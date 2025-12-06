import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response, Request } from 'express';
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
    const request = ctx.getRequest<Request>();

    // HTTP例外の場合はそのまま処理
    if (exception instanceof HttpException) {
      this.handleHttpException(exception, response);
      return;
    }

    // カスタム例外をHTTP例外に変換
    const httpException = this.convertToHttpException(exception, request);
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
  private convertToHttpException(
    exception: unknown,
    request: Request,
  ): HttpException {
    // Alert関連の例外
    if (exception instanceof AlertNotFoundException) {
      return new NotFoundException({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: exception.message,
        code: 'AL001',
        errors: [],
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    if (exception instanceof DuplicateAlertException) {
      return new UnprocessableEntityException({
        success: false,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: exception.message,
        code: 'AL002',
        errors: [],
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    if (exception instanceof AlertAlreadyResolvedException) {
      return new UnprocessableEntityException({
        success: false,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: exception.message,
        code: 'AL003',
        errors: [],
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    if (exception instanceof CriticalAlertDeletionException) {
      return new UnprocessableEntityException({
        success: false,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: exception.message,
        code: 'AL004',
        errors: [],
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Reconciliation関連の例外
    if (
      exception instanceof ReconciliationNotFoundException ||
      exception instanceof CardSummaryNotFoundError
    ) {
      return new NotFoundException({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: exception.message,
        code:
          exception instanceof ReconciliationNotFoundException
            ? 'RC005'
            : exception.code,
        errors: [],
        ...(exception.details || {}),
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    if (exception instanceof BankTransactionNotFoundError) {
      return new BadGatewayException({
        success: false,
        statusCode: HttpStatus.BAD_GATEWAY,
        message: exception.message,
        code: exception.code,
        errors: [],
        ...(exception.details || {}),
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    if (
      exception instanceof InvalidPaymentDateError ||
      exception instanceof MultipleCandidateError
    ) {
      return new UnprocessableEntityException({
        success: false,
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: exception.message,
        code: exception.code,
        errors: [],
        ...(exception.details || {}),
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Error型の例外（文字列マッチングで判定）
    if (exception instanceof Error) {
      // "not found"を含むエラーは404に変換
      if (exception.message.includes('not found')) {
        return new NotFoundException({
          success: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: exception.message,
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      }

      // バリデーション関連のエラーは400に変換
      if (
        exception.message.includes('required') ||
        exception.message.includes('must be') ||
        exception.message.includes('validation')
      ) {
        return new BadRequestException({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: exception.message,
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      }
    }

    // その他のエラーは500に変換
    return new InternalServerErrorException({
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message:
        exception instanceof Error
          ? exception.message
          : 'Internal server error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
