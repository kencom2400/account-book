import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { BankConnectionError } from '../../domain/errors/bank-connection.error';

/**
 * BankConnectionError用の例外フィルター
 */
@Catch(BankConnectionError)
export class BankConnectionExceptionFilter implements ExceptionFilter {
  catch(exception: BankConnectionError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        code: exception.code,
        message: exception.message,
        details: exception.details,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
