import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { BankConnectionError } from '../../domain/errors/bank-connection.error';
import { ErrorDetail } from '@account-book/types/api/error-response';

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
        // ErrorDetailの構造を満たしているかチェック
        details = exception.details.map((detail: unknown): ErrorDetail => {
          if (
            typeof detail === 'object' &&
            detail !== null &&
            'message' in detail &&
            typeof (detail as { message: unknown }).message === 'string'
          ) {
            const errorDetail = detail as {
              message: string;
              field?: string;
              code?: string;
            };
            return {
              field: errorDetail.field,
              message: errorDetail.message,
              code: errorDetail.code,
            };
          }
          return {
            message: JSON.stringify(detail),
          };
        });
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
