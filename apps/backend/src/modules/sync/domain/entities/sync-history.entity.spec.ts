import { SyncHistoryEntity } from './sync-history.entity';
import { SyncStatus } from '../enums/sync-status.enum';

describe('SyncHistoryEntity', () => {
  describe('create', () => {
    it('should create a new sync history with PENDING status', () => {
      const entity = SyncHistoryEntity.create(3);

      expect(entity.status).toBe(SyncStatus.PENDING);
      expect(entity.totalInstitutions).toBe(3);
      expect(entity.successCount).toBe(0);
      expect(entity.failureCount).toBe(0);
      expect(entity.newTransactionsCount).toBe(0);
      expect(entity.completedAt).toBeNull();
      expect(entity.errorMessage).toBeNull();
      expect(entity.errorDetails).toBeNull();
    });
  });

  describe('start', () => {
    it('should change status to IN_PROGRESS', () => {
      const entity = SyncHistoryEntity.create(3);
      const startedEntity = entity.start();

      expect(startedEntity.status).toBe(SyncStatus.IN_PROGRESS);
    });
  });

  describe('complete', () => {
    it('should mark as SUCCESS when all succeeded', () => {
      const entity = SyncHistoryEntity.create(3).start();
      const completedEntity = entity.complete(3, 0, 10);

      expect(completedEntity.status).toBe(SyncStatus.SUCCESS);
      expect(completedEntity.successCount).toBe(3);
      expect(completedEntity.failureCount).toBe(0);
      expect(completedEntity.newTransactionsCount).toBe(10);
      expect(completedEntity.completedAt).not.toBeNull();
    });

    it('should mark as FAILED when all failed', () => {
      const entity = SyncHistoryEntity.create(3).start();
      const completedEntity = entity.complete(0, 3, 0);

      expect(completedEntity.status).toBe(SyncStatus.FAILED);
      expect(completedEntity.successCount).toBe(0);
      expect(completedEntity.failureCount).toBe(3);
    });

    it('should mark as PARTIAL_SUCCESS when some failed', () => {
      const entity = SyncHistoryEntity.create(3).start();
      const completedEntity = entity.complete(2, 1, 5);

      expect(completedEntity.status).toBe(SyncStatus.PARTIAL_SUCCESS);
      expect(completedEntity.successCount).toBe(2);
      expect(completedEntity.failureCount).toBe(1);
      expect(completedEntity.newTransactionsCount).toBe(5);
    });
  });

  describe('fail', () => {
    it('should mark as FAILED with error message', () => {
      const entity = SyncHistoryEntity.create(3).start();
      const failedEntity = entity.fail('Connection timeout', {
        code: 'TIMEOUT',
      });

      expect(failedEntity.status).toBe(SyncStatus.FAILED);
      expect(failedEntity.errorMessage).toBe('Connection timeout');
      expect(failedEntity.errorDetails).toEqual({ code: 'TIMEOUT' });
      expect(failedEntity.completedAt).not.toBeNull();
    });
  });

  describe('addNewTransactions', () => {
    it('should increment newTransactionsCount', () => {
      const entity = SyncHistoryEntity.create(3);
      const updatedEntity = entity.addNewTransactions(5);

      expect(updatedEntity.newTransactionsCount).toBe(5);

      const finalEntity = updatedEntity.addNewTransactions(3);
      expect(finalEntity.newTransactionsCount).toBe(8);
    });
  });

  describe('status check methods', () => {
    it('should correctly identify completed status', () => {
      const entity = SyncHistoryEntity.create(3).start().complete(3, 0, 10);

      expect(entity.isCompleted()).toBe(true);
      expect(entity.isSuccess()).toBe(true);
      expect(entity.isFailed()).toBe(false);
    });

    it('should correctly identify failed status', () => {
      const entity = SyncHistoryEntity.create(3).start().fail('Error');

      expect(entity.isCompleted()).toBe(true);
      expect(entity.isSuccess()).toBe(false);
      expect(entity.isFailed()).toBe(true);
    });

    it('should correctly identify pending status', () => {
      const entity = SyncHistoryEntity.create(3);

      expect(entity.isCompleted()).toBe(false);
      expect(entity.isSuccess()).toBe(false);
      expect(entity.isFailed()).toBe(false);
    });
  });
});
