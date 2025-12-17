import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConnectionCheckerService } from './connection-checker.service';
import { ConnectionStatus } from '../../domain/value-objects/connection-status.enum';
import type { IFinancialApiClient } from '../../domain/adapters/api-client.interface';

describe('ConnectionCheckerService', () => {
  let service: ConnectionCheckerService;
  let mockApiClient: jest.Mocked<IFinancialApiClient>;

  beforeEach(async () => {
    mockApiClient = {
      healthCheck: jest.fn(),
    } as unknown as jest.Mocked<IFinancialApiClient>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionCheckerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: number) => defaultValue),
          },
        },
      ],
    }).compile();

    module.useLogger(false);

    service = module.get<ConnectionCheckerService>(ConnectionCheckerService);
  });

  describe('checkConnection', () => {
    it('should return connected status on success', async () => {
      mockApiClient.healthCheck.mockResolvedValue({
        success: true,
      });

      const result = await service.checkConnection(
        'inst_1',
        'bank',
        mockApiClient,
      );

      expect(result.institutionId).toBe('inst_1');
      expect(result.status).toBe(ConnectionStatus.CONNECTED);
    });

    it('should return need_reauth status when reauth is needed', async () => {
      mockApiClient.healthCheck.mockResolvedValue({
        success: false,
        needsReauth: true,
        errorMessage: 'Auth required',
      });

      const result = await service.checkConnection(
        'inst_1',
        'bank',
        mockApiClient,
      );

      expect(result.status).toBe(ConnectionStatus.NEED_REAUTH);
      expect(result.errorMessage).toBe('Auth required');
    });

    it('should return disconnected status on failure', async () => {
      mockApiClient.healthCheck.mockResolvedValue({
        success: false,
        errorMessage: 'Connection failed',
      });

      const result = await service.checkConnection(
        'inst_1',
        'bank',
        mockApiClient,
      );

      expect(result.status).toBe(ConnectionStatus.DISCONNECTED);
      expect(result.errorMessage).toBe('Connection failed');
    });

    it('should handle timeout', async () => {
      // タイムアウトを短く設定するため、ConfigServiceをモック
      const mockConfigService = {
        get: jest.fn((key: string, defaultValue: number) => {
          if (key === 'HEALTH_CHECK_TIMEOUT_MS') {
            return 10; // 10msでタイムアウト
          }
          return defaultValue;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ConnectionCheckerService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      module.useLogger(false);

      const timeoutService = module.get<ConnectionCheckerService>(
        ConnectionCheckerService,
      );

      // healthCheckがタイムアウトより遅く返るように設定
      mockApiClient.healthCheck.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ success: true }), 100);
          }),
      );

      const result = await timeoutService.checkConnection(
        'inst_1',
        'bank',
        mockApiClient,
      );

      expect(result.status).toBe(ConnectionStatus.DISCONNECTED);
      expect(result.errorMessage).toBe('タイムアウトしました');
      expect(result.errorCode).toBe('TIMEOUT');
    });

    it('should handle HTTP 401 error', async () => {
      const httpError = Object.assign(new Error('Unauthorized'), {
        statusCode: 401,
      });

      mockApiClient.healthCheck.mockRejectedValue(httpError);

      const result = await service.checkConnection(
        'inst_1',
        'bank',
        mockApiClient,
      );

      // performHealthCheckで401エラーはneedsReauth: trueとして処理される
      expect(result.status).toBe(ConnectionStatus.NEED_REAUTH);
      expect(result.errorMessage).toBe('認証情報が無効です');
      expect(result.errorCode).toBe('AUTH_ERROR');
    });

    it('should handle HTTP 403 error', async () => {
      const httpError = Object.assign(new Error('Forbidden'), {
        statusCode: 403,
      });

      mockApiClient.healthCheck.mockRejectedValue(httpError);

      const result = await service.checkConnection(
        'inst_1',
        'bank',
        mockApiClient,
      );

      // performHealthCheckで403エラーはneedsReauth: trueとして処理される
      expect(result.status).toBe(ConnectionStatus.NEED_REAUTH);
      expect(result.errorMessage).toBe('認証情報が無効です');
      expect(result.errorCode).toBe('AUTH_ERROR');
    });

    it('should handle generic error', async () => {
      mockApiClient.healthCheck.mockRejectedValue(new Error('Network error'));

      const result = await service.checkConnection(
        'inst_1',
        'bank',
        mockApiClient,
      );

      expect(result.status).toBe(ConnectionStatus.DISCONNECTED);
      expect(result.errorMessage).toBe('Network error');
      expect(result.errorCode).toBe('API_CLIENT_ERROR');
    });

    it('should handle error with errorCode', async () => {
      mockApiClient.healthCheck.mockResolvedValue({
        success: false,
        errorMessage: 'Connection failed',
        errorCode: 'CUSTOM_ERROR',
      });

      const result = await service.checkConnection(
        'inst_1',
        'bank',
        mockApiClient,
      );

      expect(result.status).toBe(ConnectionStatus.DISCONNECTED);
      expect(result.errorCode).toBe('CUSTOM_ERROR');
    });

    it('should handle need_reauth with errorCode', async () => {
      mockApiClient.healthCheck.mockResolvedValue({
        success: false,
        needsReauth: true,
        errorMessage: 'Auth required',
        errorCode: 'AUTH_ERROR',
      });

      const result = await service.checkConnection(
        'inst_1',
        'bank',
        mockApiClient,
      );

      expect(result.status).toBe(ConnectionStatus.NEED_REAUTH);
      expect(result.errorCode).toBe('AUTH_ERROR');
    });
  });

  describe('checkMultipleConnections', () => {
    it('should check multiple connections in parallel', async () => {
      const institutions = [
        {
          id: 'inst_1',
          type: 'bank' as const,
          apiClient: mockApiClient,
        },
        {
          id: 'inst_2',
          type: 'bank' as const,
          apiClient: mockApiClient,
        },
      ];

      mockApiClient.healthCheck.mockResolvedValue({
        success: true,
      });

      const results = await service.checkMultipleConnections(institutions);

      expect(results).toHaveLength(2);
      expect(results[0].institutionId).toBe('inst_1');
      expect(results[1].institutionId).toBe('inst_2');
      expect(results[0].status).toBe(ConnectionStatus.CONNECTED);
      expect(results[1].status).toBe(ConnectionStatus.CONNECTED);
    });

    it('should process institutions in chunks when exceeding MAX_PARALLEL', async () => {
      // MAX_PARALLELを2に設定
      const mockConfigService = {
        get: jest.fn((key: string, defaultValue: number) => {
          if (key === 'HEALTH_CHECK_MAX_PARALLEL') {
            return 2;
          }
          return defaultValue;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ConnectionCheckerService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      module.useLogger(false);

      const chunkService = module.get<ConnectionCheckerService>(
        ConnectionCheckerService,
      );

      const institutions = [
        {
          id: 'inst_1',
          type: 'bank' as const,
          apiClient: mockApiClient,
        },
        {
          id: 'inst_2',
          type: 'bank' as const,
          apiClient: mockApiClient,
        },
        {
          id: 'inst_3',
          type: 'bank' as const,
          apiClient: mockApiClient,
        },
      ];

      mockApiClient.healthCheck.mockResolvedValue({
        success: true,
      });

      const results = await chunkService.checkMultipleConnections(institutions);

      expect(results).toHaveLength(3);
      expect(mockApiClient.healthCheck).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure results', async () => {
      const institutions = [
        {
          id: 'inst_1',
          type: 'bank' as const,
          apiClient: mockApiClient,
        },
        {
          id: 'inst_2',
          type: 'bank' as const,
          apiClient: mockApiClient,
        },
      ];

      mockApiClient.healthCheck
        .mockResolvedValueOnce({
          success: true,
        })
        .mockResolvedValueOnce({
          success: false,
          errorMessage: 'Connection failed',
        });

      const results = await service.checkMultipleConnections(institutions);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe(ConnectionStatus.CONNECTED);
      expect(results[1].status).toBe(ConnectionStatus.DISCONNECTED);
    });
  });
});
