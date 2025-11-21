import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * エラー詳細情報の型定義
 */
interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

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
          details = messages.map((msg: string | object) => {
            if (typeof msg === 'string') {
              // フィールド名を抽出（例: "name must be a string" -> field: "name"）
              const fieldMatch = msg.match(/^(\w+)\s/);
              return {
                field: fieldMatch ? fieldMatch[1] : undefined,
                message: msg,
              };
            }
            // オブジェクト形式の場合（将来的な拡張用）
            return msg as ErrorDetail;
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
