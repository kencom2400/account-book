import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorDetail } from '@account-book/types/api/error-response';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    // バリデーションエラーの場合、detailsを配列形式に変換
    let details: ErrorDetail[] | undefined;
    if (exception instanceof BadRequestException) {
      const exceptionResponse = exception.getResponse();
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
            // ErrorDetailの構造を満たしているかチェック
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

    response.status(status).json({
      success: false,
      error: {
        code: exception.name,
        message: exception.message,
        ...(details && details.length > 0 ? { details } : {}),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    });
  }
}
