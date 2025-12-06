import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorDetail } from '@account-book/types';
import { AlertNotFoundException } from '../../modules/alert/domain/errors/alert.errors';
import { DuplicateAlertException } from '../../modules/alert/domain/errors/alert.errors';
import { AlertAlreadyResolvedException } from '../../modules/alert/domain/errors/alert.errors';
import { CriticalAlertDeletionException } from '../../modules/alert/domain/errors/alert.errors';
import {
  ReconciliationNotFoundException,
  CardSummaryNotFoundError,
  BankTransactionNotFoundError,
  InvalidPaymentDateError,
  MultipleCandidateError,
} from '../../modules/reconciliation/domain/errors/reconciliation.errors';
import { EventNotFoundException } from '../../modules/event/domain/errors/event.errors';

/**
 * グローバル例外フィルター
 * すべての例外をキャッチし、統一されたエラーレスポンス形式で返す
 * Issue #366: Exception Filterの導入によるエラーハンドリングの一元化
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // HTTP例外の場合はそのまま処理
    if (exception instanceof HttpException) {
      this.handleHttpException(exception, response);
      return;
    }

    // カスタム例外をHTTP例外に変換
    const httpException = this.convertToHttpException(exception);
    this.handleHttpException(httpException, response);
  }

  /**
   * HTTP例外を処理
   */
  private handleHttpException(
    exception: HttpException,
    response: Response,
  ): void {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // バリデーションエラーの場合、detailsを配列形式に変換
    let details: ErrorDetail[] | undefined;
    let errorCode: string | undefined;
    let errorMessage: string;

    if (exception instanceof BadRequestException) {
      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const messages = exceptionResponse.message;
        if (Array.isArray(messages)) {
          // ValidationPipeが返すエラーメッセージ配列を変換
          details = messages.map((msg: string | object): ErrorDetail => {
            if (typeof msg === 'string') {
              // フィールド名を抽出（例: "name must be a string" -> field: "name"）
              const fieldMatch = msg.match(/^(\w+)\s/);
              return {
                field: fieldMatch ? fieldMatch[1] : undefined,
                message: msg,
              };
            }
            // オブジェクト形式の場合（将来的な拡張用）
            if (
              typeof msg === 'object' &&
              msg !== null &&
              'message' in msg &&
              typeof (msg as { message: unknown }).message === 'string'
            ) {
              const errorObj = msg as {
                message: string;
                field?: string;
                code?: string;
              };
              return {
                field: errorObj.field,
                message: errorObj.message,
                code: errorObj.code,
              };
            }
            // フォールバック: オブジェクトを文字列化
            return {
              message: JSON.stringify(msg),
            };
          });
        } else if (typeof messages === 'string') {
          // 単一メッセージの場合
          details = [{ message: messages }];
        }
      }
    }

    // エラーレスポンスから情報を抽出
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      if ('code' in exceptionResponse) {
        errorCode = String(exceptionResponse.code);
      }
      if ('message' in exceptionResponse) {
        errorMessage = String(exceptionResponse.message);
      } else {
        errorMessage = exception.message;
      }
    } else {
      errorMessage = exception.message;
    }

    response.status(status).json({
      success: false,
      error: {
        code: errorCode || exception.name,
        message: errorMessage,
        ...(details && details.length > 0 ? { details } : {}),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  }

  /**
   * カスタム例外をHTTP例外に変換
   */
  private convertToHttpException(exception: unknown): HttpException {
    // Alert関連の例外
    if (exception instanceof AlertNotFoundException) {
      return new NotFoundException({
        message: exception.message,
        code: exception.code,
      });
    }

    // Alert関連のUnprocessableEntityException例外を1つのifブロックにまとめる
    if (
      exception instanceof DuplicateAlertException ||
      exception instanceof AlertAlreadyResolvedException ||
      exception instanceof CriticalAlertDeletionException
    ) {
      return new UnprocessableEntityException({
        message: exception.message,
        code: exception.code,
      });
    }

    // Event関連の例外
    if (exception instanceof EventNotFoundException) {
      return new NotFoundException({
        message: exception.message,
        code: exception.code,
      });
    }

    // Reconciliation関連の例外
    if (
      exception instanceof ReconciliationNotFoundException ||
      exception instanceof CardSummaryNotFoundError
    ) {
      return new NotFoundException({
        message: exception.message,
        code: exception.code,
        ...(exception.details || {}),
      });
    }

    if (exception instanceof BankTransactionNotFoundError) {
      return new BadGatewayException({
        message: exception.message,
        code: exception.code,
        ...(exception.details || {}),
      });
    }

    if (
      exception instanceof InvalidPaymentDateError ||
      exception instanceof MultipleCandidateError
    ) {
      return new UnprocessableEntityException({
        message: exception.message,
        code: exception.code,
        ...(exception.details || {}),
      });
    }

    // Error型の例外（文字列マッチングで判定）
    // ⚠️ 警告: このロジックは堅牢性に欠けます。
    // エラーメッセージの文字列に基づく判定は、予期せぬ挙動を引き起こす可能性があります。
    // 例: 500系エラーのメッセージが「validation of external service response failed」の場合、
    //     'validation'という単語が含まれているために、誤って400 BadRequestExceptionとして処理される可能性があります。
    // TODO: 将来的には、アプリケーション全体でドメイン固有のカスタム例外クラスをスローするように
    //       リファクタリングし、この文字列マッチングロジックを削除することを推奨します。
    if (exception instanceof Error) {
      // "not found"を含むエラーは404に変換
      if (exception.message.includes('not found')) {
        return new NotFoundException({
          message: exception.message,
        });
      }

      // バリデーション関連のエラーは400に変換
      if (
        exception.message.includes('required') ||
        exception.message.includes('must be') ||
        exception.message.includes('validation')
      ) {
        return new BadRequestException({
          message: exception.message,
        });
      }
    }

    // その他のエラーは500に変換
    return new InternalServerErrorException({
      message:
        exception instanceof Error
          ? exception.message
          : 'Internal server error',
    });
  }
}
