import { SyncHistory } from './sync-history.entity';
import { SyncStatus } from '../enums/sync-status.enum';
import { InstitutionType } from '@account-book/types';

describe('SyncHistory', () => {
  describe('create', () => {
    it('should create a new sync history with PENDING status', () => {
      const entity = SyncHistory.create(
        'inst-1',
        'Test Bank',
        InstitutionType.BANK,
      );

      expect(entity.status).toBe(SyncStatus.PENDING);
      expect(entity.institutionId).toBe('inst-1');
      expect(entity.institutionName).toBe('Test Bank');
      expect(entity.institutionType).toBe(InstitutionType.BANK);
      expect(entity.totalFetched).toBe(0);
      expect(entity.newRecords).toBe(0);
      expect(entity.duplicateRecords).toBe(0);
      expect(entity.completedAt).toBeNull();
      expect(entity.errorMessage).toBeNull();
      expect(entity.retryCount).toBe(0);
    });
  });

  describe('markAsRunning', () => {
    it('should change status to RUNNING', () => {
      const entity = SyncHistory.create(
        'inst-1',
        'Test Bank',
        InstitutionType.BANK,
      );
      const runningEntity = entity.markAsRunning();

      expect(runningEntity.status).toBe(SyncStatus.RUNNING);
    });
  });

  describe('markAsCompleted', () => {
    it('should mark as COMPLETED with counts', () => {
      const entity = SyncHistory.create(
        'inst-1',
        'Test Bank',
        InstitutionType.BANK,
      );
      const runningEntity = entity.markAsRunning();
      const completedEntity = runningEntity.markAsCompleted(100, 90, 10);

      expect(completedEntity.status).toBe(SyncStatus.COMPLETED);
      expect(completedEntity.totalFetched).toBe(100);
      expect(completedEntity.newRecords).toBe(90);
      expect(completedEntity.duplicateRecords).toBe(10);
      expect(completedEntity.completedAt).not.toBeNull();
    });
  });

  describe('markAsFailed', () => {
    it('should mark as FAILED with error message', () => {
      const entity = SyncHistory.create(
        'inst-1',
        'Test Bank',
        InstitutionType.BANK,
      );
      const runningEntity = entity.markAsRunning();
      const failedEntity = runningEntity.markAsFailed('Connection timeout');

      expect(failedEntity.status).toBe(SyncStatus.FAILED);
      expect(failedEntity.errorMessage).toBe('Connection timeout');
      expect(failedEntity.completedAt).not.toBeNull();
    });
  });

  describe('markAsCancelled', () => {
    it('should mark as CANCELLED', () => {
      const entity = SyncHistory.create(
        'inst-1',
        'Test Bank',
        InstitutionType.BANK,
      );
      const runningEntity = entity.markAsRunning();
      const cancelledEntity = runningEntity.markAsCancelled();

      expect(cancelledEntity.status).toBe(SyncStatus.CANCELLED);
      expect(cancelledEntity.completedAt).not.toBeNull();
    });
  });

  describe('incrementRetryCount', () => {
    it('should increment retry count', () => {
      const entity = SyncHistory.create(
        'inst-1',
        'Test Bank',
        InstitutionType.BANK,
      );
      const retriedEntity = entity.incrementRetryCount();

      expect(retriedEntity.retryCount).toBe(1);
    });
  });

  describe('status check methods', () => {
    it('should correctly identify completed status', () => {
      const entity = SyncHistory.create(
        'inst-1',
        'Test Bank',
        InstitutionType.BANK,
      );
      const runningEntity = entity.markAsRunning();
      const completedEntity = runningEntity.markAsCompleted(100, 90, 10);

      expect(completedEntity.isCompleted()).toBe(true);
    });

    it('should correctly identify running status', () => {
      const entity = SyncHistory.create(
        'inst-1',
        'Test Bank',
        InstitutionType.BANK,
      );
      const runningEntity = entity.markAsRunning();

      expect(runningEntity.isRunning()).toBe(true);
      expect(runningEntity.isCompleted()).toBe(false);
    });

    it('should correctly identify failed status', () => {
      const entity = SyncHistory.create(
        'inst-1',
        'Test Bank',
        InstitutionType.BANK,
      );
      const runningEntity = entity.markAsRunning();
      const failedEntity = runningEntity.markAsFailed('Error');

      expect(failedEntity.isFailed()).toBe(true);
    });

    it('should correctly identify cancelled status', () => {
      const entity = SyncHistory.create(
        'inst-1',
        'Test Bank',
        InstitutionType.BANK,
      );
      const runningEntity = entity.markAsRunning();
      const cancelledEntity = runningEntity.markAsCancelled();

      expect(cancelledEntity.isCancelled()).toBe(true);
    });

    it('should correctly identify pending status', () => {
      const entity = SyncHistory.create(
        'inst-1',
        'Test Bank',
        InstitutionType.BANK,
      );

      expect(entity.isCompleted()).toBe(false);
      expect(entity.isRunning()).toBe(false);
      expect(entity.isFailed()).toBe(false);
      expect(entity.isCancelled()).toBe(false);
    });
  });

  describe('getDuration', () => {
    it('should return null for incomplete sync', () => {
      const entity = SyncHistory.create(
        'inst-1',
        'Test Bank',
        InstitutionType.BANK,
      );

      expect(entity.getDuration()).toBeNull();
    });

    it('should calculate duration for completed sync', () => {
      const entity = SyncHistory.create(
        'inst-1',
        'Test Bank',
        InstitutionType.BANK,
      );
      const runningEntity = entity.markAsRunning();
      const completedEntity = runningEntity.markAsCompleted(100, 90, 10);

      const duration = completedEntity.getDuration();
      expect(duration).not.toBeNull();
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });
});
