import { CategoryType, TransactionStatus } from '@account-book/types';
import { TransactionEntity } from './transaction.entity';

describe('TransactionEntity', () => {
  const validTransaction = {
    id: 'tx_123',
    date: new Date('2024-01-15'),
    amount: 1000,
    category: {
      id: 'cat_1',
      name: '食費',
      type: CategoryType.EXPENSE,
    },
    description: 'スーパーでの買い物',
    institutionId: 'inst_1',
    accountId: 'acc_1',
    status: TransactionStatus.COMPLETED,
    isReconciled: false,
    relatedTransactionId: null,
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-15T10:00:00'),
  };

  describe('constructor', () => {
    it('should create a valid transaction entity', () => {
      const transaction = new TransactionEntity(
        validTransaction.id,
        validTransaction.date,
        validTransaction.amount,
        validTransaction.category,
        validTransaction.description,
        validTransaction.institutionId,
        validTransaction.accountId,
        validTransaction.status,
        validTransaction.isReconciled,
        validTransaction.relatedTransactionId,
        validTransaction.createdAt,
        validTransaction.updatedAt,
      );

      expect(transaction.id).toBe('tx_123');
      expect(transaction.amount).toBe(1000);
      expect(transaction.category.name).toBe('食費');
    });

    it('should throw error when id is missing', () => {
      expect(
        () =>
          new TransactionEntity(
            '',
            validTransaction.date,
            validTransaction.amount,
            validTransaction.category,
            validTransaction.description,
            validTransaction.institutionId,
            validTransaction.accountId,
            validTransaction.status,
            validTransaction.isReconciled,
            validTransaction.relatedTransactionId,
            validTransaction.createdAt,
            validTransaction.updatedAt,
          ),
      ).toThrow('Transaction ID is required');
    });

    it('should throw error when date is missing', () => {
      expect(
        () =>
          new TransactionEntity(
            validTransaction.id,
            null as any,
            validTransaction.amount,
            validTransaction.category,
            validTransaction.description,
            validTransaction.institutionId,
            validTransaction.accountId,
            validTransaction.status,
            validTransaction.isReconciled,
            validTransaction.relatedTransactionId,
            validTransaction.createdAt,
            validTransaction.updatedAt,
          ),
      ).toThrow('Transaction date is required');
    });

    it('should throw error when amount is undefined', () => {
      expect(
        () =>
          new TransactionEntity(
            validTransaction.id,
            validTransaction.date,
            undefined as any,
            validTransaction.category,
            validTransaction.description,
            validTransaction.institutionId,
            validTransaction.accountId,
            validTransaction.status,
            validTransaction.isReconciled,
            validTransaction.relatedTransactionId,
            validTransaction.createdAt,
            validTransaction.updatedAt,
          ),
      ).toThrow('Transaction amount is required');
    });

    it('should throw error when amount is null', () => {
      expect(
        () =>
          new TransactionEntity(
            validTransaction.id,
            validTransaction.date,
            null as any,
            validTransaction.category,
            validTransaction.description,
            validTransaction.institutionId,
            validTransaction.accountId,
            validTransaction.status,
            validTransaction.isReconciled,
            validTransaction.relatedTransactionId,
            validTransaction.createdAt,
            validTransaction.updatedAt,
          ),
      ).toThrow('Transaction amount is required');
    });

    it('should throw error when category is missing', () => {
      expect(
        () =>
          new TransactionEntity(
            validTransaction.id,
            validTransaction.date,
            validTransaction.amount,
            null as any,
            validTransaction.description,
            validTransaction.institutionId,
            validTransaction.accountId,
            validTransaction.status,
            validTransaction.isReconciled,
            validTransaction.relatedTransactionId,
            validTransaction.createdAt,
            validTransaction.updatedAt,
          ),
      ).toThrow('Transaction category is required');
    });

    it('should throw error when category id is missing', () => {
      expect(
        () =>
          new TransactionEntity(
            validTransaction.id,
            validTransaction.date,
            validTransaction.amount,
            { id: '', name: 'Test', type: CategoryType.EXPENSE },
            validTransaction.description,
            validTransaction.institutionId,
            validTransaction.accountId,
            validTransaction.status,
            validTransaction.isReconciled,
            validTransaction.relatedTransactionId,
            validTransaction.createdAt,
            validTransaction.updatedAt,
          ),
      ).toThrow('Transaction category is required');
    });

    it('should throw error when description is missing', () => {
      expect(
        () =>
          new TransactionEntity(
            validTransaction.id,
            validTransaction.date,
            validTransaction.amount,
            validTransaction.category,
            '',
            validTransaction.institutionId,
            validTransaction.accountId,
            validTransaction.status,
            validTransaction.isReconciled,
            validTransaction.relatedTransactionId,
            validTransaction.createdAt,
            validTransaction.updatedAt,
          ),
      ).toThrow('Transaction description is required');
    });

    it('should throw error when institutionId is missing', () => {
      expect(
        () =>
          new TransactionEntity(
            validTransaction.id,
            validTransaction.date,
            validTransaction.amount,
            validTransaction.category,
            validTransaction.description,
            '',
            validTransaction.accountId,
            validTransaction.status,
            validTransaction.isReconciled,
            validTransaction.relatedTransactionId,
            validTransaction.createdAt,
            validTransaction.updatedAt,
          ),
      ).toThrow('Institution ID is required');
    });

    it('should throw error when accountId is missing', () => {
      expect(
        () =>
          new TransactionEntity(
            validTransaction.id,
            validTransaction.date,
            validTransaction.amount,
            validTransaction.category,
            validTransaction.description,
            validTransaction.institutionId,
            '',
            validTransaction.status,
            validTransaction.isReconciled,
            validTransaction.relatedTransactionId,
            validTransaction.createdAt,
            validTransaction.updatedAt,
          ),
      ).toThrow('Account ID is required');
    });
  });

  describe('isIncome', () => {
    it('should return true for income transaction', () => {
      const transaction = new TransactionEntity(
        validTransaction.id,
        validTransaction.date,
        validTransaction.amount,
        { id: 'cat_1', name: '給与', type: CategoryType.INCOME },
        validTransaction.description,
        validTransaction.institutionId,
        validTransaction.accountId,
        validTransaction.status,
        validTransaction.isReconciled,
        validTransaction.relatedTransactionId,
        validTransaction.createdAt,
        validTransaction.updatedAt,
      );

      expect(transaction.isIncome()).toBe(true);
      expect(transaction.isExpense()).toBe(false);
      expect(transaction.isTransfer()).toBe(false);
    });
  });

  describe('isExpense', () => {
    it('should return true for expense transaction', () => {
      const transaction = new TransactionEntity(
        validTransaction.id,
        validTransaction.date,
        validTransaction.amount,
        { id: 'cat_1', name: '食費', type: CategoryType.EXPENSE },
        validTransaction.description,
        validTransaction.institutionId,
        validTransaction.accountId,
        validTransaction.status,
        validTransaction.isReconciled,
        validTransaction.relatedTransactionId,
        validTransaction.createdAt,
        validTransaction.updatedAt,
      );

      expect(transaction.isExpense()).toBe(true);
      expect(transaction.isIncome()).toBe(false);
      expect(transaction.isTransfer()).toBe(false);
    });
  });

  describe('isTransfer', () => {
    it('should return true for transfer transaction', () => {
      const transaction = new TransactionEntity(
        validTransaction.id,
        validTransaction.date,
        validTransaction.amount,
        { id: 'cat_1', name: '口座振替', type: CategoryType.TRANSFER },
        validTransaction.description,
        validTransaction.institutionId,
        validTransaction.accountId,
        validTransaction.status,
        validTransaction.isReconciled,
        validTransaction.relatedTransactionId,
        validTransaction.createdAt,
        validTransaction.updatedAt,
      );

      expect(transaction.isTransfer()).toBe(true);
      expect(transaction.isIncome()).toBe(false);
      expect(transaction.isExpense()).toBe(false);
    });
  });

  describe('isReconciliated', () => {
    it('should return true when reconciled', () => {
      const transaction = new TransactionEntity(
        validTransaction.id,
        validTransaction.date,
        validTransaction.amount,
        validTransaction.category,
        validTransaction.description,
        validTransaction.institutionId,
        validTransaction.accountId,
        validTransaction.status,
        true,
        validTransaction.relatedTransactionId,
        validTransaction.createdAt,
        validTransaction.updatedAt,
      );

      expect(transaction.isReconciliated()).toBe(true);
    });

    it('should return false when not reconciled', () => {
      const transaction = new TransactionEntity(
        validTransaction.id,
        validTransaction.date,
        validTransaction.amount,
        validTransaction.category,
        validTransaction.description,
        validTransaction.institutionId,
        validTransaction.accountId,
        validTransaction.status,
        false,
        validTransaction.relatedTransactionId,
        validTransaction.createdAt,
        validTransaction.updatedAt,
      );

      expect(transaction.isReconciliated()).toBe(false);
    });
  });

  describe('reconcile', () => {
    it('should mark transaction as reconciled', () => {
      const transaction = new TransactionEntity(
        validTransaction.id,
        validTransaction.date,
        validTransaction.amount,
        validTransaction.category,
        validTransaction.description,
        validTransaction.institutionId,
        validTransaction.accountId,
        validTransaction.status,
        false,
        validTransaction.relatedTransactionId,
        validTransaction.createdAt,
        validTransaction.updatedAt,
      );

      const reconciled = transaction.reconcile();

      expect(reconciled.isReconciled).toBe(true);
      expect(transaction.isReconciled).toBe(false); // Original unchanged
    });

    it('should update updatedAt when reconciled', () => {
      const transaction = new TransactionEntity(
        validTransaction.id,
        validTransaction.date,
        validTransaction.amount,
        validTransaction.category,
        validTransaction.description,
        validTransaction.institutionId,
        validTransaction.accountId,
        validTransaction.status,
        false,
        validTransaction.relatedTransactionId,
        validTransaction.createdAt,
        new Date('2024-01-15T10:00:00'),
      );

      const reconciled = transaction.reconcile();

      expect(reconciled.updatedAt.getTime()).toBeGreaterThan(
        transaction.updatedAt.getTime(),
      );
    });
  });

  describe('updateCategory', () => {
    it('should update category', () => {
      const transaction = new TransactionEntity(
        validTransaction.id,
        validTransaction.date,
        validTransaction.amount,
        { id: 'cat_1', name: '食費', type: CategoryType.EXPENSE },
        validTransaction.description,
        validTransaction.institutionId,
        validTransaction.accountId,
        validTransaction.status,
        validTransaction.isReconciled,
        validTransaction.relatedTransactionId,
        validTransaction.createdAt,
        validTransaction.updatedAt,
      );

      const newCategory = {
        id: 'cat_2',
        name: '交通費',
        type: CategoryType.EXPENSE,
      };
      const updated = transaction.updateCategory(newCategory);

      expect(updated.category.id).toBe('cat_2');
      expect(updated.category.name).toBe('交通費');
      expect(transaction.category.id).toBe('cat_1'); // Original unchanged
    });
  });

  describe('updateStatus', () => {
    it('should update status', () => {
      const transaction = new TransactionEntity(
        validTransaction.id,
        validTransaction.date,
        validTransaction.amount,
        validTransaction.category,
        validTransaction.description,
        validTransaction.institutionId,
        validTransaction.accountId,
        TransactionStatus.PENDING,
        validTransaction.isReconciled,
        validTransaction.relatedTransactionId,
        validTransaction.createdAt,
        validTransaction.updatedAt,
      );

      const updated = transaction.updateStatus(TransactionStatus.COMPLETED);

      expect(updated.status).toBe(TransactionStatus.COMPLETED);
      expect(transaction.status).toBe(TransactionStatus.PENDING); // Original unchanged
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON correctly', () => {
      const transaction = new TransactionEntity(
        validTransaction.id,
        validTransaction.date,
        validTransaction.amount,
        validTransaction.category,
        validTransaction.description,
        validTransaction.institutionId,
        validTransaction.accountId,
        validTransaction.status,
        validTransaction.isReconciled,
        validTransaction.relatedTransactionId,
        validTransaction.createdAt,
        validTransaction.updatedAt,
      );

      const json = transaction.toJSON();

      expect(json.id).toBe('tx_123');
      expect(json.amount).toBe(1000);
      expect(json.category.name).toBe('食費');
      expect(json.status).toBe(TransactionStatus.COMPLETED);
      expect(json.isReconciled).toBe(false);
      expect(json.relatedTransactionId).toBeNull();
    });
  });
});
