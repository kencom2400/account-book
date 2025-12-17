import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { E2ETestDatabaseHelper } from '../helpers/database-helper';
import { createTestApp } from '../helpers/test-setup';
import { TRANSACTION_REPOSITORY } from '../../src/modules/transaction/domain/repositories/transaction.repository.interface';
import { ITransactionRepository } from '../../src/modules/transaction/domain/repositories/transaction.repository.interface';
import { TransactionEntity } from '../../src/modules/transaction/domain/entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';

/**
 * TransactionTypeOrmRepository 統合テスト
 *
 * 実際のデータベースを使用してRepositoryの動作を確認します。
 * モックを使用せず、実際のデータベース操作をテストします。
 */
describe('TransactionTypeOrmRepository Integration', () => {
  let app: INestApplication;
  let dbHelper: E2ETestDatabaseHelper;
  let repository: ITransactionRepository;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [AppModule],
    });

    app = await createTestApp(moduleBuilder, {
      enableValidationPipe: false,
      enableHttpExceptionFilter: false,
    });

    dbHelper = new E2ETestDatabaseHelper(app);

    const isConnected: boolean = await dbHelper.checkConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    repository = app.get<ITransactionRepository>(TRANSACTION_REPOSITORY);
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await app.close();
  });

  beforeEach(async () => {
    await dbHelper.cleanDatabase();
  });

  describe('save', () => {
    it('should save a transaction to the database', async () => {
      const transaction = new TransactionEntity(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        {
          id: 'cat_1',
          name: 'Food',
          type: CategoryType.EXPENSE,
        },
        'Test transaction',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      const saved = await repository.save(transaction);

      expect(saved).toBeInstanceOf(TransactionEntity);
      expect(saved.id).toBe('tx_1');
      expect(saved.amount).toBe(1000);
      expect(saved.category.id).toBe('cat_1');
      expect(saved.category.name).toBe('Food');
      expect(saved.institutionId).toBe('inst_1');
      expect(saved.accountId).toBe('acc_1');
    });

    it('should update an existing transaction', async () => {
      const transaction = new TransactionEntity(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        {
          id: 'cat_1',
          name: 'Food',
          type: CategoryType.EXPENSE,
        },
        'Test transaction',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      await repository.save(transaction);

      const updated = new TransactionEntity(
        'tx_1',
        new Date('2024-01-15'),
        2000,
        {
          id: 'cat_1',
          name: 'Food',
          type: CategoryType.EXPENSE,
        },
        'Updated transaction',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      const saved = await repository.save(updated);

      expect(saved.amount).toBe(2000);
      expect(saved.description).toBe('Updated transaction');
    });
  });

  describe('findById', () => {
    it('should find a transaction by id', async () => {
      const transaction = new TransactionEntity(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        {
          id: 'cat_1',
          name: 'Food',
          type: CategoryType.EXPENSE,
        },
        'Test transaction',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      await repository.save(transaction);

      const found = await repository.findById('tx_1');

      expect(found).toBeInstanceOf(TransactionEntity);
      expect(found?.id).toBe('tx_1');
      expect(found?.amount).toBe(1000);
    });

    it('should return null if transaction not found', async () => {
      const found = await repository.findById('nonexistent');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all transactions', async () => {
      const transaction1 = new TransactionEntity(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        {
          id: 'cat_1',
          name: 'Food',
          type: CategoryType.EXPENSE,
        },
        'Test transaction 1',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      const transaction2 = new TransactionEntity(
        'tx_2',
        new Date('2024-01-16'),
        2000,
        {
          id: 'cat_2',
          name: 'Transport',
          type: CategoryType.EXPENSE,
        },
        'Test transaction 2',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      await repository.save(transaction1);
      await repository.save(transaction2);

      const all = await repository.findAll();

      expect(all).toHaveLength(2);
      expect(all[0].id).toBe('tx_2'); // 日付降順でソート
      expect(all[1].id).toBe('tx_1');
    });

    it('should return empty array if no transactions', async () => {
      const all = await repository.findAll();

      expect(all).toHaveLength(0);
    });
  });

  describe('findByInstitutionId', () => {
    it('should find transactions by institution id', async () => {
      const transaction1 = new TransactionEntity(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        {
          id: 'cat_1',
          name: 'Food',
          type: CategoryType.EXPENSE,
        },
        'Test transaction 1',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      const transaction2 = new TransactionEntity(
        'tx_2',
        new Date('2024-01-16'),
        2000,
        {
          id: 'cat_2',
          name: 'Transport',
          type: CategoryType.EXPENSE,
        },
        'Test transaction 2',
        'inst_2',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      await repository.save(transaction1);
      await repository.save(transaction2);

      const found = await repository.findByInstitutionId('inst_1');

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('tx_1');
      expect(found[0].institutionId).toBe('inst_1');
    });
  });

  describe('findByAccountId', () => {
    it('should find transactions by account id', async () => {
      const transaction1 = new TransactionEntity(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        {
          id: 'cat_1',
          name: 'Food',
          type: CategoryType.EXPENSE,
        },
        'Test transaction 1',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      const transaction2 = new TransactionEntity(
        'tx_2',
        new Date('2024-01-16'),
        2000,
        {
          id: 'cat_2',
          name: 'Transport',
          type: CategoryType.EXPENSE,
        },
        'Test transaction 2',
        'inst_1',
        'acc_2',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      await repository.save(transaction1);
      await repository.save(transaction2);

      const found = await repository.findByAccountId('acc_1');

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('tx_1');
      expect(found[0].accountId).toBe('acc_1');
    });
  });

  describe('findByDateRange', () => {
    it('should find transactions by date range', async () => {
      const transaction1 = new TransactionEntity(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        {
          id: 'cat_1',
          name: 'Food',
          type: CategoryType.EXPENSE,
        },
        'Test transaction 1',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      const transaction2 = new TransactionEntity(
        'tx_2',
        new Date('2024-02-15'),
        2000,
        {
          id: 'cat_2',
          name: 'Transport',
          type: CategoryType.EXPENSE,
        },
        'Test transaction 2',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      await repository.save(transaction1);
      await repository.save(transaction2);

      const found = await repository.findByDateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('tx_1');
    });
  });

  describe('findByMonth', () => {
    it('should find transactions by month', async () => {
      const transaction1 = new TransactionEntity(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        {
          id: 'cat_1',
          name: 'Food',
          type: CategoryType.EXPENSE,
        },
        'Test transaction 1',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      const transaction2 = new TransactionEntity(
        'tx_2',
        new Date('2024-02-15'),
        2000,
        {
          id: 'cat_2',
          name: 'Transport',
          type: CategoryType.EXPENSE,
        },
        'Test transaction 2',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      await repository.save(transaction1);
      await repository.save(transaction2);

      const found = await repository.findByMonth(2024, 1);

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('tx_1');
    });
  });

  describe('delete', () => {
    it('should delete a transaction', async () => {
      const transaction = new TransactionEntity(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        {
          id: 'cat_1',
          name: 'Food',
          type: CategoryType.EXPENSE,
        },
        'Test transaction',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      await repository.save(transaction);

      await repository.delete('tx_1');

      const found = await repository.findById('tx_1');
      expect(found).toBeNull();
    });
  });

  describe('saveMany', () => {
    it('should save multiple transactions', async () => {
      const transaction1 = new TransactionEntity(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        {
          id: 'cat_1',
          name: 'Food',
          type: CategoryType.EXPENSE,
        },
        'Test transaction 1',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      const transaction2 = new TransactionEntity(
        'tx_2',
        new Date('2024-01-16'),
        2000,
        {
          id: 'cat_2',
          name: 'Transport',
          type: CategoryType.EXPENSE,
        },
        'Test transaction 2',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      const saved = await repository.saveMany([transaction1, transaction2]);

      expect(saved).toHaveLength(2);
      expect(saved[0].id).toBe('tx_1');
      expect(saved[1].id).toBe('tx_2');

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('findByIds', () => {
    it('should find transactions by multiple ids', async () => {
      const transaction1 = new TransactionEntity(
        'tx_1',
        new Date('2024-01-15'),
        1000,
        {
          id: 'cat_1',
          name: 'Food',
          type: CategoryType.EXPENSE,
        },
        'Test transaction 1',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      const transaction2 = new TransactionEntity(
        'tx_2',
        new Date('2024-01-16'),
        2000,
        {
          id: 'cat_2',
          name: 'Transport',
          type: CategoryType.EXPENSE,
        },
        'Test transaction 2',
        'inst_1',
        'acc_1',
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );

      await repository.save(transaction1);
      await repository.save(transaction2);

      const found = await repository.findByIds(['tx_1', 'tx_2']);

      expect(found).toHaveLength(2);
      expect(found.map((t) => t.id)).toContain('tx_1');
      expect(found.map((t) => t.id)).toContain('tx_2');
    });

    it('should return empty array if no ids provided', async () => {
      const found = await repository.findByIds([]);

      expect(found).toHaveLength(0);
    });
  });
});
