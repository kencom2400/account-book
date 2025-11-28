import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ScheduledConnectionCheckUseCase } from './scheduled-connection-check.use-case';
import { CheckConnectionStatusUseCase } from './check-connection-status.use-case';
import { InstitutionAggregationService } from '../services/institution-aggregation.service';
import type { IInstitutionInfo } from '../../domain/adapters/api-client.interface';

describe('ScheduledConnectionCheckUseCase', () => {
  let useCase: ScheduledConnectionCheckUseCase;
  let checkConnectionStatusUseCase: jest.Mocked<CheckConnectionStatusUseCase>;
  let institutionAggregationService: jest.Mocked<InstitutionAggregationService>;

  const mockInstitutions: IInstitutionInfo[] = [
    {
      institutionId: 'inst_1',
      name: 'Test Bank',
      type: 'bank',
      isActive: true,
      credentials: {
        username: 'test',
        password: 'test',
      },
    },
    {
      institutionId: 'inst_2',
      name: 'Test Card',
      type: 'credit_card',
      isActive: true,
      credentials: {
        username: 'test2',
        password: 'test2',
      },
    },
  ];

  beforeEach(async () => {
    const mockCheckUseCase = {
      execute: jest.fn(),
    };

    const mockAggregationService = {
      getAllInstitutions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledConnectionCheckUseCase,
        {
          provide: CheckConnectionStatusUseCase,
          useValue: mockCheckUseCase,
        },
        {
          provide: InstitutionAggregationService,
          useValue: mockAggregationService,
        },
      ],
    }).compile();

    // Suppress logs during tests
    module.useLogger(false);

    useCase = module.get<ScheduledConnectionCheckUseCase>(
      ScheduledConnectionCheckUseCase,
    );
    checkConnectionStatusUseCase = module.get(CheckConnectionStatusUseCase);
    institutionAggregationService = module.get(InstitutionAggregationService);
  });

  describe('handleScheduledCheck', () => {
    it('should execute scheduled check successfully', async () => {
      institutionAggregationService.getAllInstitutions.mockResolvedValue(
        mockInstitutions,
      );
      checkConnectionStatusUseCase.execute.mockResolvedValue([
        {
          institutionId: 'inst_1',
          status: 'CONNECTED',
          checkedAt: new Date(),
          responseTime: 100,
        },
        {
          institutionId: 'inst_2',
          status: 'CONNECTED',
          checkedAt: new Date(),
          responseTime: 150,
        },
      ]);

      await useCase.handleScheduledCheck();

      expect(
        institutionAggregationService.getAllInstitutions,
      ).toHaveBeenCalled();
      expect(checkConnectionStatusUseCase.execute).toHaveBeenCalledWith(
        {},
        mockInstitutions,
      );
      expect(useCase.isCheckRunning()).toBe(false);
    });

    it('should skip when already running', async () => {
      // Start first check
      institutionAggregationService.getAllInstitutions.mockResolvedValue(
        mockInstitutions,
      );
      checkConnectionStatusUseCase.execute.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve([
                  {
                    institutionId: 'inst_1',
                    status: 'CONNECTED',
                    checkedAt: new Date(),
                    responseTime: 100,
                  },
                ]),
              100,
            ),
          ),
      );

      const firstCheck = useCase.handleScheduledCheck();

      // Try to start second check while first is running
      await useCase.handleScheduledCheck();

      // Second check should be skipped
      expect(
        institutionAggregationService.getAllInstitutions,
      ).toHaveBeenCalledTimes(1);

      await firstCheck;
    });

    it('should skip when no institutions are registered', async () => {
      institutionAggregationService.getAllInstitutions.mockResolvedValue([]);

      await useCase.handleScheduledCheck();

      expect(
        institutionAggregationService.getAllInstitutions,
      ).toHaveBeenCalled();
      expect(checkConnectionStatusUseCase.execute).not.toHaveBeenCalled();
    });

    it('should log warning when errors are detected', async () => {
      const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn');

      institutionAggregationService.getAllInstitutions.mockResolvedValue(
        mockInstitutions,
      );
      checkConnectionStatusUseCase.execute.mockResolvedValue([
        {
          institutionId: 'inst_1',
          status: 'CONNECTED',
          checkedAt: new Date(),
          responseTime: 100,
        },
        {
          institutionId: 'inst_2',
          status: 'DISCONNECTED',
          checkedAt: new Date(),
          responseTime: 5000,
          errorMessage: 'Connection failed',
        },
      ]);

      await useCase.handleScheduledCheck();

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('1/2件で問題が検出されました'),
      );

      loggerWarnSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');

      institutionAggregationService.getAllInstitutions.mockRejectedValue(
        new Error('Database error'),
      );

      await useCase.handleScheduledCheck();

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        '定期接続チェック中にエラーが発生しました',
        expect.any(String),
      );
      expect(useCase.isCheckRunning()).toBe(false);

      loggerErrorSpy.mockRestore();
    });
  });

  describe('triggerManualCheck', () => {
    it('should execute manual check successfully', async () => {
      checkConnectionStatusUseCase.execute.mockResolvedValue([
        {
          institutionId: 'inst_1',
          status: 'CONNECTED',
          checkedAt: new Date(),
          responseTime: 100,
        },
      ]);

      await useCase.triggerManualCheck(mockInstitutions);

      expect(checkConnectionStatusUseCase.execute).toHaveBeenCalledWith(
        {},
        mockInstitutions,
      );
      expect(useCase.isCheckRunning()).toBe(false);
    });

    it('should skip when already running', async () => {
      const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn');

      checkConnectionStatusUseCase.execute.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve([
                  {
                    institutionId: 'inst_1',
                    status: 'CONNECTED',
                    checkedAt: new Date(),
                    responseTime: 100,
                  },
                ]),
              100,
            ),
          ),
      );

      const firstCheck = useCase.triggerManualCheck(mockInstitutions);

      await useCase.triggerManualCheck(mockInstitutions);

      expect(loggerWarnSpy).toHaveBeenCalledWith('チェックが既に実行中です');

      await firstCheck;
      loggerWarnSpy.mockRestore();
    });

    it('should throw error when check fails', async () => {
      checkConnectionStatusUseCase.execute.mockRejectedValue(
        new Error('Check failed'),
      );

      await expect(
        useCase.triggerManualCheck(mockInstitutions),
      ).rejects.toThrow('Check failed');

      expect(useCase.isCheckRunning()).toBe(false);
    });
  });

  describe('isCheckRunning', () => {
    it('should return false when no check is running', () => {
      expect(useCase.isCheckRunning()).toBe(false);
    });

    it('should return true while check is running', async () => {
      institutionAggregationService.getAllInstitutions.mockResolvedValue(
        mockInstitutions,
      );
      checkConnectionStatusUseCase.execute.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve([
                  {
                    institutionId: 'inst_1',
                    status: 'CONNECTED',
                    checkedAt: new Date(),
                    responseTime: 100,
                  },
                ]),
              50,
            ),
          ),
      );

      const checkPromise = useCase.handleScheduledCheck();

      // Should be running now
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(useCase.isCheckRunning()).toBe(true);

      await checkPromise;

      // Should be finished now
      expect(useCase.isCheckRunning()).toBe(false);
    });
  });
});
