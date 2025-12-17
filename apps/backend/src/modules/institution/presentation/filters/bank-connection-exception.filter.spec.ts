import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BankConnectionExceptionFilter } from './bank-connection-exception.filter';
import {
  BankConnectionError,
  BankErrorCode,
} from '../../domain/errors/bank-connection.error';

describe('BankConnectionExceptionFilter', () => {
  let filter: BankConnectionExceptionFilter;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BankConnectionExceptionFilter],
    }).compile();

    filter = module.get<BankConnectionExceptionFilter>(
      BankConnectionExceptionFilter,
    );

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/api/institutions',
      method: 'POST',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as jest.Mocked<ArgumentsHost>;
  });

  describe('catch', () => {
    it('should handle BankConnectionError with string details', () => {
      const exception = new BankConnectionError(
        BankErrorCode.CONNECTION_TIMEOUT,
        'Connection failed',
        'CONNECTION_ERROR',
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: exception.code,
          message: 'Connection failed',
          details: [{ message: 'CONNECTION_ERROR' }],
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('should handle BankConnectionError with array details', () => {
      const exception = new BankConnectionError(
        BankErrorCode.INVALID_CREDENTIALS,
        'Connection failed',
        [
          { message: 'Error 1', field: 'username' },
          { message: 'Error 2', field: 'password' },
        ],
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: exception.code,
          message: 'Connection failed',
          details: [
            { message: 'Error 1', field: 'username' },
            { message: 'Error 2', field: 'password' },
          ],
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('should handle BankConnectionError with object details', () => {
      const exception = new BankConnectionError(
        BankErrorCode.INVALID_CREDENTIALS,
        'Connection failed',
        {
          username: 'Invalid username',
          password: 'Invalid password',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: exception.code,
          message: 'Connection failed',
          details: [
            { field: 'username', message: 'Invalid username' },
            { field: 'password', message: 'Invalid password' },
          ],
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });

    it('should handle BankConnectionError without details', () => {
      const exception = new BankConnectionError(
        BankErrorCode.UNKNOWN_ERROR,
        'Connection failed',
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: exception.code,
          message: 'Connection failed',
        },
        metadata: {
          timestamp: expect.any(String),
          version: '1.0',
        },
      });
    });
  });
});
