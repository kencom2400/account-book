import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CancelSyncUseCase } from './cancel-sync.use-case';
import { SyncAllTransactionsUseCase } from './sync-all-transactions.use-case';
import { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { SyncHistory } from '../../domain/entities/sync-history.entity';
import { SyncStatus } from '../../domain/enums/sync-status.enum';
import { SYNC_HISTORY_REPOSITORY } from '../../sync.tokens';

describe('CancelSyncUseCase', () => {
  let useCase: CancelSyncUseCase;
  let mockSyncHistoryRepository: jest.Mocked<ISyncHistoryRepository>;
  let mockSyncAllTransactionsUseCase: jest.Mocked<SyncAllTransactionsUseCase>;

  beforeEach(async () => {
    mockSyncHistoryRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findLatest: jest.fn(),
      findByStatus: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockSyncAllTransactionsUseCase = {
      cancelSync: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelSyncUseCase,
        {
          provide: SYNC_HISTORY_REPOSITORY,
          useValue: mockSyncHistoryRepository,
        },
        {
          provide: SyncAllTransactionsUseCase,
          useValue: mockSyncAllTransactionsUseCase,
        },
      ],
    }).compile();

    useCase = module.get<CancelSyncUseCase>(CancelSyncUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const syncId = 'sync_test_123';

    it('should cancel sync successfully', async () => {
      // Arrange
      const syncHistory = SyncHistory.create(
        'inst_123',
        'Test Institution',
        'credit-card',
      );
      const runningSyncHistory = syncHistory.markAsRunning();

      mockSyncHistoryRepository.findById.mockResolvedValue(runningSyncHistory);
      mockSyncHistoryRepository.update.mockResolvedValue(
        runningSyncHistory.markAsCancelled(),
      );
      mockSyncAllTransactionsUseCase.cancelSync.mockReturnValue(true);

      // Act
      const result = await useCase.execute(syncId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Sync cancelled successfully');
      expect(mockSyncHistoryRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SyncStatus.CANCELLED,
        }),
      );
      expect(mockSyncAllTransactionsUseCase.cancelSync).toHaveBeenCalledWith(
        syncId,
      );
    });

    it('should throw NotFoundException when sync history does not exist', async () => {
      // Arrange
      mockSyncHistoryRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(syncId)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(syncId)).rejects.toThrow(
        `Sync history not found: ${syncId}`,
      );
    });

    it('should return failure when sync is not running', async () => {
      // Arrange
      const syncHistory = SyncHistory.create(
        'inst_123',
        'Test Institution',
        'credit-card',
      );
      const completedSyncHistory = syncHistory
        .markAsRunning()
        .markAsCompleted(10, 5, 5);

      mockSyncHistoryRepository.findById.mockResolvedValue(
        completedSyncHistory,
      );

      // Act
      const result = await useCase.execute(syncId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe(
        `Cannot cancel sync: status is ${completedSyncHistory.status}`,
      );
      expect(mockSyncHistoryRepository.update).not.toHaveBeenCalled();
      expect(mockSyncAllTransactionsUseCase.cancelSync).not.toHaveBeenCalled();
    });

    it('should return failure when sync is already cancelled', async () => {
      // Arrange
      const syncHistory = SyncHistory.create(
        'inst_123',
        'Test Institution',
        'credit-card',
      );
      const cancelledSyncHistory = syncHistory
        .markAsRunning()
        .markAsCancelled();

      mockSyncHistoryRepository.findById.mockResolvedValue(
        cancelledSyncHistory,
      );

      // Act
      const result = await useCase.execute(syncId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot cancel sync');
      expect(mockSyncHistoryRepository.update).not.toHaveBeenCalled();
    });

    it('should return failure when sync is failed', async () => {
      // Arrange
      const syncHistory = SyncHistory.create(
        'inst_123',
        'Test Institution',
        'credit-card',
      );
      const failedSyncHistory = syncHistory
        .markAsRunning()
        .markAsFailed('API connection failed');

      mockSyncHistoryRepository.findById.mockResolvedValue(failedSyncHistory);

      // Act
      const result = await useCase.execute(syncId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot cancel sync');
      expect(mockSyncHistoryRepository.update).not.toHaveBeenCalled();
    });

    it('should still succeed even if abortController is not found', async () => {
      // Arrange
      const syncHistory = SyncHistory.create(
        'inst_123',
        'Test Institution',
        'credit-card',
      );
      const runningSyncHistory = syncHistory.markAsRunning();

      mockSyncHistoryRepository.findById.mockResolvedValue(runningSyncHistory);
      mockSyncHistoryRepository.update.mockResolvedValue(
        runningSyncHistory.markAsCancelled(),
      );
      mockSyncAllTransactionsUseCase.cancelSync.mockReturnValue(false); // AbortControllerが見つからない

      // Act
      const result = await useCase.execute(syncId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Sync cancelled successfully');
      expect(mockSyncHistoryRepository.update).toHaveBeenCalled();
      expect(mockSyncAllTransactionsUseCase.cancelSync).toHaveBeenCalledWith(
        syncId,
      );
    });

    it('should handle PENDING status correctly', async () => {
      // Arrange
      const syncHistory = SyncHistory.create(
        'inst_123',
        'Test Institution',
        'credit-card',
      );
      // PENDING状態のまま（markAsRunningを呼ばない）

      mockSyncHistoryRepository.findById.mockResolvedValue(syncHistory);

      // Act
      const result = await useCase.execute(syncId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot cancel sync');
      expect(mockSyncHistoryRepository.update).not.toHaveBeenCalled();
    });

    it('should update sync history before calling cancelSync', async () => {
      // Arrange
      const syncHistory = SyncHistory.create(
        'inst_123',
        'Test Institution',
        'credit-card',
      );
      const runningSyncHistory = syncHistory.markAsRunning();

      const updateOrder: string[] = [];

      mockSyncHistoryRepository.findById.mockResolvedValue(runningSyncHistory);
      mockSyncHistoryRepository.update.mockImplementation(async (history) => {
        updateOrder.push('update');
        return history;
      });
      mockSyncAllTransactionsUseCase.cancelSync.mockImplementation((_id) => {
        updateOrder.push('cancelSync');
        return true;
      });

      // Act
      await useCase.execute(syncId);

      // Assert
      expect(updateOrder).toEqual(['update', 'cancelSync']);
    });

    it('should call SyncAllTransactionsUseCase.cancelSync with correct syncId', async () => {
      // Arrange
      const customSyncId = 'custom_sync_id_456';
      const syncHistory = SyncHistory.create(
        'inst_123',
        'Test Institution',
        'credit-card',
      );
      const runningSyncHistory = syncHistory.markAsRunning();

      mockSyncHistoryRepository.findById.mockResolvedValue(runningSyncHistory);
      mockSyncHistoryRepository.update.mockResolvedValue(
        runningSyncHistory.markAsCancelled(),
      );
      mockSyncAllTransactionsUseCase.cancelSync.mockReturnValue(true);

      // Act
      await useCase.execute(customSyncId);

      // Assert
      expect(mockSyncAllTransactionsUseCase.cancelSync).toHaveBeenCalledWith(
        customSyncId,
      );
    });
  });
});
