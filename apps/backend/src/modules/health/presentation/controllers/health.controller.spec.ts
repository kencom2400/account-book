import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { CheckConnectionStatusUseCase } from '../../application/use-cases/check-connection-status.use-case';
import { GetConnectionHistoryUseCase } from '../../application/use-cases/get-connection-history.use-case';
import { InstitutionAggregationService } from '../../application/services/institution-aggregation.service';

describe('HealthController', () => {
  let controller: HealthController;
  let checkConnectionStatusUseCase: jest.Mocked<CheckConnectionStatusUseCase>;
  let getConnectionHistoryUseCase: jest.Mocked<GetConnectionHistoryUseCase>;
  let institutionAggregationService: jest.Mocked<InstitutionAggregationService>;

  const mockInstitution = {
    id: 'inst_1',
    name: 'Test Bank',
    type: 'bank' as const,
    isConnected: true,
    lastSyncedAt: new Date(),
  };

  const mockConnectionResult = {
    institutionId: 'inst_1',
    institutionName: 'Test Bank',
    institutionType: 'bank' as const,
    success: true,
    checkedAt: new Date(),
    responseTime: 100,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: CheckConnectionStatusUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetConnectionHistoryUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: InstitutionAggregationService,
          useValue: {
            getAllInstitutions: jest.fn(),
            getInstitutionById: jest.fn(),
          },
        },
      ],
    }).compile();

    module.useLogger(false);

    controller = module.get<HealthController>(HealthController);
    checkConnectionStatusUseCase = module.get(CheckConnectionStatusUseCase);
    getConnectionHistoryUseCase = module.get(GetConnectionHistoryUseCase);
    institutionAggregationService = module.get(InstitutionAggregationService);
  });

  describe('checkInstitutionsHealth', () => {
    it('should check health for all institutions', async () => {
      institutionAggregationService.getAllInstitutions.mockResolvedValue([
        mockInstitution,
      ]);
      checkConnectionStatusUseCase.execute.mockResolvedValue([
        mockConnectionResult,
      ]);

      const result = await controller.checkInstitutionsHealth({});

      expect(result.totalCount).toBe(1);
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(0);
      expect(result.results).toHaveLength(1);
    });

    it('should return empty results if no institutions', async () => {
      institutionAggregationService.getAllInstitutions.mockResolvedValue([]);

      const result = await controller.checkInstitutionsHealth({});

      expect(result.totalCount).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should count errors correctly', async () => {
      institutionAggregationService.getAllInstitutions.mockResolvedValue([
        mockInstitution,
      ]);
      checkConnectionStatusUseCase.execute.mockResolvedValue([
        {
          ...mockConnectionResult,
          errorMessage: 'Connection failed',
        },
      ]);

      const result = await controller.checkInstitutionsHealth({});

      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(1);
    });

    it('should throw Error on error (handled by HttpExceptionFilter)', async () => {
      institutionAggregationService.getAllInstitutions.mockRejectedValue(
        new Error('Database error'),
      );

      // エラーハンドリングはHttpExceptionFilterが一元管理するため、
      // コントローラーからはErrorがそのままスローされる
      await expect(controller.checkInstitutionsHealth({})).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getInstitutionHistory', () => {
    it('should get connection history for institution', async () => {
      const mockHistory = {
        id: 'hist_1',
        institutionId: 'inst_1',
        institutionName: 'Test Bank',
        institutionType: 'bank' as const,
        status: 'success' as const,
        checkedAt: new Date(),
        responseTime: 100,
      };

      getConnectionHistoryUseCase.execute.mockResolvedValue([mockHistory]);

      const result = await controller.getInstitutionHistory('inst_1', {});

      expect(result.histories).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });

    it('should return empty history if no records', async () => {
      getConnectionHistoryUseCase.execute.mockResolvedValue([]);

      const result = await controller.getInstitutionHistory('inst_1', {});

      expect(result.histories).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('should throw Error on error (handled by HttpExceptionFilter)', async () => {
      getConnectionHistoryUseCase.execute.mockRejectedValue(
        new Error('Database error'),
      );

      // エラーハンドリングはHttpExceptionFilterが一元管理するため、
      // コントローラーからはErrorがそのままスローされる
      await expect(
        controller.getInstitutionHistory('inst_1', {}),
      ).rejects.toThrow('Database error');
    });
  });
});
