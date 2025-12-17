import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { E2ETestDatabaseHelper } from '../helpers/database-helper';
import { createTestApp } from '../helpers/test-setup';
import {
  TRANSACTION_REPOSITORY,
  ITransactionRepository,
} from '../../src/modules/transaction/domain/repositories/transaction.repository.interface';
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

  // テストデータ定数
  const TX_ID_1 = 'tx_1';
  const TX_ID_2 = 'tx_2';
  const CAT_ID_1 = 'cat_1';
  const CAT_ID_2 = 'cat_2';
  const CAT_NAME_1 = 'Food';
  const CAT_NAME_2 = 'Transport';
  const INST_ID_1 = 'inst_1';
  const INST_ID_2 = 'inst_2';
  const ACC_ID_1 = 'acc_1';
  const ACC_ID_2 = 'acc_2';
  const TEST_DESCRIPTION = 'Test transaction';
  const TEST_DESCRIPTION_1 = 'Test transaction 1';
  const TEST_DESCRIPTION_2 = 'Test transaction 2';
  const UPDATED_DESCRIPTION = 'Updated transaction';
  const TEST_AMOUNT_1 = 1000;
  const TEST_AMOUNT_2 = 2000;

  // 固定日付
  const FIXED_DATE = new Date('2024-01-01T00:00:00Z');
  const TEST_DATE_1 = new Date('2024-01-15T00:00:00Z');
  const TEST_DATE_2 = new Date('2024-01-16T00:00:00Z');
  const TEST_DATE_FEB = new Date('2024-02-15T00:00:00Z');
  const DATE_RANGE_START = new Date('2024-01-01T00:00:00Z');
  const DATE_RANGE_END = new Date('2024-01-31T23:59:59Z');

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
        TX_ID_1,
        TEST_DATE_1,
        TEST_AMOUNT_1,
        {
          id: CAT_ID_1,
          name: CAT_NAME_1,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      const saved = await repository.save(transaction);

      expect(saved).toBeInstanceOf(TransactionEntity);
      expect(saved.id).toBe(TX_ID_1);
      expect(saved.amount).toBe(TEST_AMOUNT_1);
      expect(saved.category.id).toBe(CAT_ID_1);
      expect(saved.category.name).toBe(CAT_NAME_1);
      expect(saved.institutionId).toBe(INST_ID_1);
      expect(saved.accountId).toBe(ACC_ID_1);
    });

    it('should update an existing transaction', async () => {
      const transaction = new TransactionEntity(
        TX_ID_1,
        TEST_DATE_1,
        TEST_AMOUNT_1,
        {
          id: CAT_ID_1,
          name: CAT_NAME_1,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(transaction);

      const updated = new TransactionEntity(
        TX_ID_1,
        TEST_DATE_1,
        TEST_AMOUNT_2,
        {
          id: CAT_ID_1,
          name: CAT_NAME_1,
          type: CategoryType.EXPENSE,
        },
        UPDATED_DESCRIPTION,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      const saved = await repository.save(updated);

      expect(saved.amount).toBe(TEST_AMOUNT_2);
      expect(saved.description).toBe(UPDATED_DESCRIPTION);
    });
  });

  describe('findById', () => {
    it('should find a transaction by id', async () => {
      const transaction = new TransactionEntity(
        TX_ID_1,
        TEST_DATE_1,
        TEST_AMOUNT_1,
        {
          id: CAT_ID_1,
          name: CAT_NAME_1,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(transaction);

      const found = await repository.findById(TX_ID_1);

      expect(found).toBeInstanceOf(TransactionEntity);
      expect(found?.id).toBe(TX_ID_1);
      expect(found?.amount).toBe(TEST_AMOUNT_1);
    });

    it('should return null if transaction not found', async () => {
      const found = await repository.findById('nonexistent');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all transactions', async () => {
      const transaction1 = new TransactionEntity(
        TX_ID_1,
        TEST_DATE_1,
        TEST_AMOUNT_1,
        {
          id: CAT_ID_1,
          name: CAT_NAME_1,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION_1,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      const transaction2 = new TransactionEntity(
        TX_ID_2,
        TEST_DATE_2,
        TEST_AMOUNT_2,
        {
          id: CAT_ID_2,
          name: CAT_NAME_2,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION_2,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(transaction1);
      await repository.save(transaction2);

      const all = await repository.findAll();

      expect(all).toHaveLength(2);
      expect(all[0].id).toBe(TX_ID_2); // 日付降順でソート
      expect(all[1].id).toBe(TX_ID_1);
    });

    it('should return empty array if no transactions', async () => {
      const all = await repository.findAll();

      expect(all).toHaveLength(0);
    });
  });

  describe('findByInstitutionId', () => {
    it('should find transactions by institution id', async () => {
      const transaction1 = new TransactionEntity(
        TX_ID_1,
        TEST_DATE_1,
        TEST_AMOUNT_1,
        {
          id: CAT_ID_1,
          name: CAT_NAME_1,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION_1,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      const transaction2 = new TransactionEntity(
        TX_ID_2,
        TEST_DATE_2,
        TEST_AMOUNT_2,
        {
          id: CAT_ID_2,
          name: CAT_NAME_2,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION_2,
        INST_ID_2,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(transaction1);
      await repository.save(transaction2);

      const found = await repository.findByInstitutionId(INST_ID_1);

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(TX_ID_1);
      expect(found[0].institutionId).toBe(INST_ID_1);
    });
  });

  describe('findByAccountId', () => {
    it('should find transactions by account id', async () => {
      const transaction1 = new TransactionEntity(
        TX_ID_1,
        TEST_DATE_1,
        TEST_AMOUNT_1,
        {
          id: CAT_ID_1,
          name: CAT_NAME_1,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION_1,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      const transaction2 = new TransactionEntity(
        TX_ID_2,
        TEST_DATE_2,
        TEST_AMOUNT_2,
        {
          id: CAT_ID_2,
          name: CAT_NAME_2,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION_2,
        INST_ID_1,
        ACC_ID_2,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(transaction1);
      await repository.save(transaction2);

      const found = await repository.findByAccountId(ACC_ID_1);

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(TX_ID_1);
      expect(found[0].accountId).toBe(ACC_ID_1);
    });
  });

  describe('findByDateRange', () => {
    it('should find transactions by date range', async () => {
      const transaction1 = new TransactionEntity(
        TX_ID_1,
        TEST_DATE_1,
        TEST_AMOUNT_1,
        {
          id: CAT_ID_1,
          name: CAT_NAME_1,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION_1,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      const transaction2 = new TransactionEntity(
        TX_ID_2,
        TEST_DATE_FEB,
        TEST_AMOUNT_2,
        {
          id: CAT_ID_2,
          name: CAT_NAME_2,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION_2,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(transaction1);
      await repository.save(transaction2);

      const found = await repository.findByDateRange(
        DATE_RANGE_START,
        DATE_RANGE_END,
      );

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(TX_ID_1);
    });
  });

  describe('findByMonth', () => {
    it('should find transactions by month', async () => {
      const transaction1 = new TransactionEntity(
        TX_ID_1,
        TEST_DATE_1,
        TEST_AMOUNT_1,
        {
          id: CAT_ID_1,
          name: CAT_NAME_1,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION_1,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      const transaction2 = new TransactionEntity(
        TX_ID_2,
        TEST_DATE_FEB,
        TEST_AMOUNT_2,
        {
          id: CAT_ID_2,
          name: CAT_NAME_2,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION_2,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(transaction1);
      await repository.save(transaction2);

      const found = await repository.findByMonth(2024, 1);

      expect(found).toHaveLength(1);
      expect(found[0].id).toBe(TX_ID_1);
    });
  });

  describe('delete', () => {
    it('should delete a transaction', async () => {
      const transaction = new TransactionEntity(
        TX_ID_1,
        TEST_DATE_1,
        TEST_AMOUNT_1,
        {
          id: CAT_ID_1,
          name: CAT_NAME_1,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(transaction);

      await repository.delete(TX_ID_1);

      const found = await repository.findById(TX_ID_1);
      expect(found).toBeNull();
    });
  });

  describe('saveMany', () => {
    it('should save multiple transactions', async () => {
      const transaction1 = new TransactionEntity(
        TX_ID_1,
        TEST_DATE_1,
        TEST_AMOUNT_1,
        {
          id: CAT_ID_1,
          name: CAT_NAME_1,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION_1,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      const transaction2 = new TransactionEntity(
        TX_ID_2,
        TEST_DATE_2,
        TEST_AMOUNT_2,
        {
          id: CAT_ID_2,
          name: CAT_NAME_2,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION_2,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      const saved = await repository.saveMany([transaction1, transaction2]);

      expect(saved).toHaveLength(2);
      expect(saved[0].id).toBe(TX_ID_1);
      expect(saved[1].id).toBe(TX_ID_2);

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('findByIds', () => {
    it('should find transactions by multiple ids', async () => {
      const transaction1 = new TransactionEntity(
        TX_ID_1,
        TEST_DATE_1,
        TEST_AMOUNT_1,
        {
          id: CAT_ID_1,
          name: CAT_NAME_1,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION_1,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      const transaction2 = new TransactionEntity(
        TX_ID_2,
        TEST_DATE_2,
        TEST_AMOUNT_2,
        {
          id: CAT_ID_2,
          name: CAT_NAME_2,
          type: CategoryType.EXPENSE,
        },
        TEST_DESCRIPTION_2,
        INST_ID_1,
        ACC_ID_1,
        TransactionStatus.COMPLETED,
        false,
        null,
        FIXED_DATE,
        FIXED_DATE,
      );

      await repository.save(transaction1);
      await repository.save(transaction2);

      const found = await repository.findByIds([TX_ID_1, TX_ID_2]);

      expect(found).toHaveLength(2);
      expect(found.map((t) => t.id)).toContain(TX_ID_1);
      expect(found.map((t) => t.id)).toContain(TX_ID_2);
    });

    it('should return empty array if no ids provided', async () => {
      const found = await repository.findByIds([]);

      expect(found).toHaveLength(0);
    });
  });
});
