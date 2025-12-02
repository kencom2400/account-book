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
    });
  });
});
