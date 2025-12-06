import { HttpExceptionFilter } from './http-exception.filter';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { AlertNotFoundException } from '../../modules/alert/domain/errors/alert.errors';
import { DuplicateAlertException } from '../../modules/alert/domain/errors/alert.errors';
import { EventNotFoundException } from '../../modules/event/domain/errors/event.errors';
import {
  ReconciliationNotFoundException,
  CardSummaryNotFoundError,
  BankTransactionNotFoundError,
  InvalidPaymentDateError,
} from '../../modules/reconciliation/domain/errors/reconciliation.errors';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: jest.Mocked<Response>;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Response>;

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;
  });

  describe('HTTP例外の処理', () => {
    it('NotFoundExceptionを統一された形式で処理する', () => {
      const exception = new NotFoundException({
        message: 'Resource not found',
        code: 'RESOURCE_NOT_FOUND',
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Resource not found',
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('BadRequestExceptionを統一された形式で処理する', () => {
      const exception = new BadRequestException({
        message: 'Invalid request',
        code: 'INVALID_REQUEST',
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request',
          details: [{ message: 'Invalid request' }],
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('バリデーションエラーの配列をdetailsとして処理する', () => {
      const exception = new BadRequestException({
        message: ['name must be a string', 'email must be an email'],
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BadRequestException',
          message: expect.any(String),
          details: [
            { field: 'name', message: 'name must be a string' },
            { field: 'email', message: 'email must be an email' },
          ],
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('文字列形式のNotFoundExceptionを処理する', () => {
      const exception = new NotFoundException('Resource not found');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NotFoundException',
          message: 'Resource not found',
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });
  });

  describe('カスタム例外の変換', () => {
    it('AlertNotFoundExceptionをNotFoundExceptionに変換する', () => {
      const exception = new AlertNotFoundException('alert-001');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AL001',
          message: 'Alert not found: alert-001',
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('DuplicateAlertExceptionをUnprocessableEntityExceptionに変換する', () => {
      const exception = new DuplicateAlertException('reconciliation-001');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AL002',
          message:
            'Duplicate alert already exists for reconciliation: reconciliation-001',
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('EventNotFoundExceptionをNotFoundExceptionに変換する', () => {
      const exception = new EventNotFoundException('event-001');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'EV001',
          message: 'Event not found: event-001',
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('ReconciliationNotFoundExceptionをNotFoundExceptionに変換する', () => {
      const exception = new ReconciliationNotFoundException(
        'reconciliation-001',
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RC005',
          message: 'Reconciliation not found: reconciliation-001',
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('CardSummaryNotFoundErrorをNotFoundExceptionに変換する', () => {
      const exception = new CardSummaryNotFoundError('card-001', '2025-01');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RC001',
          message: 'カード請求データが見つかりません',
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('BankTransactionNotFoundErrorをBadGatewayExceptionに変換する', () => {
      const exception = new BankTransactionNotFoundError('card-001', '2025-01');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(502);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RC002',
          message: '外部サービスへの接続に失敗しました',
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('InvalidPaymentDateErrorをUnprocessableEntityExceptionに変換する', () => {
      const exception = new InvalidPaymentDateError(
        new Date('2025-02-01'),
        new Date('2025-01-01'),
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RC003',
          message: '引落予定日が未来です。引落日到来後に再実行してください',
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });
  });

  describe('Error型の例外の変換', () => {
    it('"not found"を含むErrorをNotFoundExceptionに変換する', () => {
      const exception = new Error('Resource not found');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NotFoundException',
          message: 'Resource not found',
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('バリデーション関連のErrorをBadRequestExceptionに変換する', () => {
      const exception = new Error('Field is required');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'BadRequestException',
          message: 'Field is required',
          details: [{ message: 'Field is required' }],
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('その他のErrorをInternalServerErrorExceptionに変換する', () => {
      const exception = new Error('Unexpected error');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'InternalServerErrorException',
          message: 'Unexpected error',
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('未知の型の例外をInternalServerErrorExceptionに変換する', () => {
      const exception = 'String error';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'InternalServerErrorException',
          message: 'Internal server error',
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });
  });

  describe('エラーレスポンス形式の統一', () => {
    it('すべてのエラーレスポンスにsuccess: falseが含まれる', () => {
      const exception = new NotFoundException('Not found');

      filter.catch(exception, mockArgumentsHost);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.success).toBe(false);
    });

    it('すべてのエラーレスポンスにmetadataが含まれる', () => {
      const exception = new BadRequestException('Bad request');

      filter.catch(exception, mockArgumentsHost);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.metadata).toEqual({
        timestamp: expect.any(String),
        version: '1.0',
      });
    });

    it('すべてのエラーレスポンスにerrorオブジェクトが含まれる', () => {
      const exception = new UnprocessableEntityException('Unprocessable');

      filter.catch(exception, mockArgumentsHost);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response.error).toBeDefined();
      expect(response.error.code).toBeDefined();
      expect(response.error.message).toBeDefined();
    });
  });
});
