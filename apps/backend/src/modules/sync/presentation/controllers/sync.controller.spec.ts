import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { SyncTransactionsUseCase } from '../../application/use-cases/sync-transactions.use-case';
import { ScheduledSyncJob } from '../../application/jobs/scheduled-sync.job';
import { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { SYNC_HISTORY_REPOSITORY } from '../../sync.tokens';
import { SyncHistoryEntity } from '../../domain/entities/sync-history.entity';
import { SyncStatus } from '../../domain/enums/sync-status.enum';

describe('SyncController', () => {
  let controller: SyncController;
  let syncTransactionsUseCase: jest.Mocked<SyncTransactionsUseCase>;
  let scheduledSyncJob: jest.Mocked<ScheduledSyncJob>;
  let syncHistoryRepository: jest.Mocked<ISyncHistoryRepository>;

  beforeEach(async () => {
    const mockSyncTransactionsUseCase = {
      execute: jest.fn(),
    };

    const mockScheduledSyncJob = {
      isSyncRunning: jest.fn(),
      executeManualSync: jest.fn(),
    };

    const mockSyncHistoryRepository: Partial<ISyncHistoryRepository> = {
      findLatest: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByDateRange: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncTransactionsUseCase,
          useValue: mockSyncTransactionsUseCase,
        },
        {
          provide: ScheduledSyncJob,
          useValue: mockScheduledSyncJob,
        },
        {
          provide: SYNC_HISTORY_REPOSITORY,
          useValue: mockSyncHistoryRepository,
        },
      ],
    }).compile();

    controller = module.get<SyncController>(SyncController);
    syncTransactionsUseCase = module.get(SyncTransactionsUseCase);
    scheduledSyncJob = module.get(ScheduledSyncJob);
    syncHistoryRepository = module.get(SYNC_HISTORY_REPOSITORY);
  });

  describe('syncTransactions', () => {
    it('should execute sync and return result', async () => {
      // Arrange
      const mockSyncHistory = SyncHistoryEntity.create(2)
        .start()
        .complete(2, 0, 10);

      syncTransactionsUseCase.execute.mockResolvedValue({
        syncHistory: mockSyncHistory,
        successCount: 2,
        failureCount: 0,
        newTransactionsCount: 10,
      });

      // Act
      const result = await controller.syncTransactions({});

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.successCount).toBe(2);
      expect(result.data.failureCount).toBe(0);
      expect(result.data.newTransactionsCount).toBe(10);
      expect(syncTransactionsUseCase.execute).toHaveBeenCalledWith({
        forceFullSync: undefined,
      });
    });

    it('should pass forceFullSync option', async () => {
      // Arrange
      const mockSyncHistory = SyncHistoryEntity.create(2)
        .start()
        .complete(2, 0, 10);

      syncTransactionsUseCase.execute.mockResolvedValue({
        syncHistory: mockSyncHistory,
        successCount: 2,
        failureCount: 0,
        newTransactionsCount: 10,
      });

      // Act
      await controller.syncTransactions({ forceFullSync: true });

      // Assert
      expect(syncTransactionsUseCase.execute).toHaveBeenCalledWith({
        forceFullSync: true,
      });
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status with latest history', async () => {
      // Arrange
      const mockSyncHistory = SyncHistoryEntity.create(2)
        .start()
        .complete(2, 0, 10);

      scheduledSyncJob.isSyncRunning.mockReturnValue(false);
      syncHistoryRepository.findLatest.mockResolvedValue(mockSyncHistory);

      // Act
      const result = await controller.getSyncStatus();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.isRunning).toBe(false);
      expect(result.data.latestSync).not.toBeNull();
      expect(result.data.latestSync?.successCount).toBe(2);
    });

    it('should return null when no sync history exists', async () => {
      // Arrange
      scheduledSyncJob.isSyncRunning.mockReturnValue(false);
      syncHistoryRepository.findLatest.mockResolvedValue(null);

      // Act
      const result = await controller.getSyncStatus();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.isRunning).toBe(false);
      expect(result.data.latestSync).toBeNull();
    });
  });

  describe('getSyncHistory', () => {
    it('should return all sync histories when no date range specified', async () => {
      // Arrange
      const mockHistories = [
        SyncHistoryEntity.create(2).start().complete(2, 0, 10),
        SyncHistoryEntity.create(3).start().complete(3, 0, 15),
      ];

      syncHistoryRepository.findAll.mockResolvedValue(mockHistories);

      // Act
      const result = await controller.getSyncHistory({});

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(syncHistoryRepository.findAll).toHaveBeenCalledWith(50);
    });

    it('should return sync histories for specified date range', async () => {
      // Arrange
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';
      const mockHistories = [
        SyncHistoryEntity.create(2).start().complete(2, 0, 10),
      ];

      syncHistoryRepository.findByDateRange.mockResolvedValue(mockHistories);

      // Act
      const result = await controller.getSyncHistory({ startDate, endDate });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(syncHistoryRepository.findByDateRange).toHaveBeenCalled();
    });
  });

  describe('getSyncHistoryById', () => {
    it('should return sync history when found', async () => {
      // Arrange
      const mockSyncHistory = SyncHistoryEntity.create(2)
        .start()
        .complete(2, 0, 10);

      syncHistoryRepository.findById.mockResolvedValue(mockSyncHistory);

      // Act
      const result = await controller.getSyncHistoryById('sync_123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.syncId).toBe(mockSyncHistory.id);
      expect(result.data.status).toBe(SyncStatus.SUCCESS);
    });

    it('should return error when sync history not found', async () => {
      // Arrange
      syncHistoryRepository.findById.mockResolvedValue(null);

      // Act
      const result = await controller.getSyncHistoryById('nonexistent');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Sync history not found');
    });
  });
});
