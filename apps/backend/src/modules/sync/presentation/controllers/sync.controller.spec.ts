import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { SyncAllTransactionsUseCase } from '../../application/use-cases/sync-all-transactions.use-case';
import { GetSyncHistoryUseCase } from '../../application/use-cases/get-sync-history.use-case';
import { GetSyncStatusUseCase } from '../../application/use-cases/get-sync-status.use-case';
import { CancelSyncUseCase } from '../../application/use-cases/cancel-sync.use-case';
import { SyncStatus } from '../../domain/enums/sync-status.enum';

describe('SyncController', () => {
  let controller: SyncController;
  let syncAllTransactionsUseCase: jest.Mocked<SyncAllTransactionsUseCase>;
  let getSyncHistoryUseCase: jest.Mocked<GetSyncHistoryUseCase>;
  let getSyncStatusUseCase: jest.Mocked<GetSyncStatusUseCase>;
  let cancelSyncUseCase: jest.Mocked<CancelSyncUseCase>;

  beforeEach(async () => {
    const mockSyncAllTransactionsUseCase = {
      execute: jest.fn(),
    };

    const mockGetSyncHistoryUseCase = {
      execute: jest.fn(),
      findById: jest.fn(),
    };

    const mockGetSyncStatusUseCase = {
      execute: jest.fn(),
      getSyncSchedule: jest.fn(),
      updateSyncSchedule: jest.fn(),
    };

    const mockCancelSyncUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncAllTransactionsUseCase,
          useValue: mockSyncAllTransactionsUseCase,
        },
        {
          provide: GetSyncHistoryUseCase,
          useValue: mockGetSyncHistoryUseCase,
        },
        {
          provide: GetSyncStatusUseCase,
          useValue: mockGetSyncStatusUseCase,
        },
        {
          provide: CancelSyncUseCase,
          useValue: mockCancelSyncUseCase,
        },
      ],
    }).compile();

    controller = module.get<SyncController>(SyncController);
    syncAllTransactionsUseCase = module.get(SyncAllTransactionsUseCase);
    getSyncHistoryUseCase = module.get(GetSyncHistoryUseCase);
    getSyncStatusUseCase = module.get(GetSyncStatusUseCase);
    cancelSyncUseCase = module.get(CancelSyncUseCase);
  });

  describe('startSync', () => {
    it('should execute sync and return result', async () => {
      // Arrange
      const mockResult = {
        results: [
          {
            syncHistoryId: 'sync-123',
            institutionId: 'inst-1',
            institutionName: 'Test Bank',
            institutionType: 'bank' as const,
            success: true,
            totalFetched: 10,
            newRecords: 10,
            duplicateRecords: 0,
            errorMessage: null,
            duration: 1000,
            startedAt: new Date(),
            completedAt: new Date(),
          },
        ],
        summary: {
          totalInstitutions: 1,
          successCount: 1,
          failureCount: 0,
          totalFetched: 10,
          totalNew: 10,
          totalDuplicate: 0,
          duration: 1000,
        },
      };

      syncAllTransactionsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      const result = await controller.startSync({});

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.summary.successCount).toBe(1);
      expect(syncAllTransactionsUseCase.execute).toHaveBeenCalledWith({
        forceFullSync: undefined,
        institutionIds: undefined,
      });
    });

    it('should pass forceFullSync option', async () => {
      // Arrange
      const mockResult = {
        results: [],
        summary: {
          totalInstitutions: 0,
          successCount: 0,
          failureCount: 0,
          totalFetched: 0,
          totalNew: 0,
          totalDuplicate: 0,
          duration: 0,
        },
      };

      syncAllTransactionsUseCase.execute.mockResolvedValue(mockResult);

      // Act
      await controller.startSync({ forceFullSync: true });

      // Assert
      expect(syncAllTransactionsUseCase.execute).toHaveBeenCalledWith({
        forceFullSync: true,
        institutionIds: undefined,
      });
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status', async () => {
      // Arrange
      const mockStatus = {
        isRunning: false,
        currentSyncId: null,
        startedAt: null,
        progress: null,
      };

      getSyncStatusUseCase.execute.mockResolvedValue(mockStatus);

      // Act
      const result = await controller.getSyncStatus();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.isRunning).toBe(false);
      expect(getSyncStatusUseCase.execute).toHaveBeenCalled();
    });

    it('should return running status with progress', async () => {
      // Arrange
      const mockStatus = {
        isRunning: true,
        currentSyncId: 'sync-123',
        startedAt: new Date(),
        progress: {
          totalInstitutions: 5,
          completedInstitutions: 2,
          currentInstitution: 'Test Bank',
          percentage: 40,
        },
      };

      getSyncStatusUseCase.execute.mockResolvedValue(mockStatus);

      // Act
      const result = await controller.getSyncStatus();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.isRunning).toBe(true);
      expect(result.data.progress).toBeDefined();
      expect(result.data.progress?.percentage).toBe(40);
    });
  });

  describe('getSyncHistory', () => {
    it('should return sync history list', async () => {
      // Arrange
      const mockHistory = [
        {
          id: 'sync-123',
          institutionId: 'inst-1',
          institutionName: 'Test Bank',
          institutionType: 'bank' as const,
          status: SyncStatus.SUCCESS,
          startedAt: new Date(),
          completedAt: new Date(),
          totalFetched: 10,
          newRecords: 10,
          duplicateRecords: 0,
          errorMessage: null,
          retryCount: 0,
        },
      ];

      getSyncHistoryUseCase.execute.mockResolvedValue({
        histories: mockHistory,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      // Act
      const result = await controller.getSyncHistory({});

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('cancelSync', () => {
    it('should cancel sync successfully', async () => {
      // Arrange
      cancelSyncUseCase.execute.mockResolvedValue({
        success: true,
        message: 'Sync cancelled successfully',
      });

      // Act
      const result = await controller.cancelSync('sync-123');

      // Assert
      expect(result.success).toBe(true);
      expect(cancelSyncUseCase.execute).toHaveBeenCalledWith('sync-123');
    });
  });
});
