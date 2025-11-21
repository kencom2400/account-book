import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { BankConnectionError } from '../../domain/errors/bank-connection.error';

/**
 * エラー詳細情報の型定義
 */
interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

/**
 * BankConnectionError用の例外フィルター
 * Issue #214: detailsフィールドを配列形式に統一
 */
@Catch(BankConnectionError)
export class BankConnectionExceptionFilter implements ExceptionFilter {
  catch(exception: BankConnectionError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // detailsを配列形式に変換
    let details: ErrorDetail[] | undefined;
    if (exception.details) {
      if (Array.isArray(exception.details)) {
        // 既に配列形式の場合
        details = exception.details as ErrorDetail[];
      } else if (typeof exception.details === 'object') {
        // オブジェクト形式の場合、配列に変換
        const detailsObj = exception.details as Record<string, unknown>;
        details = Object.entries(detailsObj).map(([key, value]) => ({
          field: key,
          message: String(value),
        }));
      } else {
        // その他の場合（文字列など）
        const detailMessage =
          typeof exception.details === 'string'
            ? exception.details
            : JSON.stringify(exception.details);
        details = [{ message: detailMessage }];
      }
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        code: exception.code,
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
