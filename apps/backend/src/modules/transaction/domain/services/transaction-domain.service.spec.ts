import { Test, TestingModule } from '@nestjs/testing';
import { CategoryType, TransactionStatus } from '@account-book/types';
import { TransactionDomainService } from './transaction-domain.service';
import { TransactionEntity } from '../entities/transaction.entity';

describe('TransactionDomainService', () => {
  let service: TransactionDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionDomainService],
    }).compile();

    service = module.get<TransactionDomainService>(TransactionDomainService);
  });

  const createTransaction = (
    id: string,
    amount: number,
    categoryType: CategoryType,
    date?: Date,
    institutionId = 'inst_1',
  ): TransactionEntity => {
    return new TransactionEntity(
      id,
      date || new Date('2024-01-15'),
      amount,
      { id: 'cat_1', name: 'Test', type: categoryType },
      'Test description',
      institutionId,
      'acc_1',
      TransactionStatus.COMPLETED,
      false,
      null,
      new Date(),
      new Date(),
    );
  };

  describe('canReconcileAsTransfer', () => {
    it('should return true for valid transfer pair', () => {
      const transfer1 = createTransaction('tx_1', -1000, CategoryType.TRANSFER);
      const transfer2 = createTransaction('tx_2', 1000, CategoryType.TRANSFER);

      const result = service.canReconcileAsTransfer(transfer1, transfer2);

      expect(result).toBe(true);
    });

    it('should return false when one is not transfer type', () => {
      const transfer = createTransaction('tx_1', -1000, CategoryType.TRANSFER);
      const expense = createTransaction('tx_2', 1000, CategoryType.EXPENSE);

      const result = service.canReconcileAsTransfer(transfer, expense);

      expect(result).toBe(false);
    });

    it('should return false when amounts do not match', () => {
      const transfer1 = createTransaction('tx_1', -1000, CategoryType.TRANSFER);
      const transfer2 = createTransaction('tx_2', 1500, CategoryType.TRANSFER);

      const result = service.canReconcileAsTransfer(transfer1, transfer2);

      expect(result).toBe(false);
    });

    it('should return false when both amounts are positive', () => {
      const transfer1 = createTransaction('tx_1', 1000, CategoryType.TRANSFER);
      const transfer2 = createTransaction('tx_2', 1000, CategoryType.TRANSFER);

      const result = service.canReconcileAsTransfer(transfer1, transfer2);

      expect(result).toBe(false);
    });

    it('should return false when both amounts are negative', () => {
      const transfer1 = createTransaction('tx_1', -1000, CategoryType.TRANSFER);
      const transfer2 = createTransaction('tx_2', -1000, CategoryType.TRANSFER);

      const result = service.canReconcileAsTransfer(transfer1, transfer2);

      expect(result).toBe(false);
    });

    it('should return false when date difference exceeds 3 days', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-05');
      const transfer1 = createTransaction(
        'tx_1',
        -1000,
        CategoryType.TRANSFER,
        date1,
      );
      const transfer2 = createTransaction(
        'tx_2',
        1000,
        CategoryType.TRANSFER,
        date2,
      );

      const result = service.canReconcileAsTransfer(transfer1, transfer2);

      expect(result).toBe(false);
    });

    it('should return true when date difference is within 3 days', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-03');
      const transfer1 = createTransaction(
        'tx_1',
        -1000,
        CategoryType.TRANSFER,
        date1,
      );
      const transfer2 = createTransaction(
        'tx_2',
        1000,
        CategoryType.TRANSFER,
        date2,
      );

      const result = service.canReconcileAsTransfer(transfer1, transfer2);

      expect(result).toBe(true);
    });
  });

  describe('canReconcileCreditCardPayment', () => {
    it('should return true when total matches bank withdrawal', () => {
      const cardTransactions = [
        createTransaction('tx_1', -500, CategoryType.EXPENSE),
        createTransaction('tx_2', -300, CategoryType.EXPENSE),
        createTransaction('tx_3', -200, CategoryType.EXPENSE),
      ];
      const bankWithdrawal = createTransaction(
        'tx_4',
        -1000,
        CategoryType.TRANSFER,
      );

      const result = service.canReconcileCreditCardPayment(
        cardTransactions,
        bankWithdrawal,
      );

      expect(result.canReconcile).toBe(true);
      expect(result.totalAmount).toBe(1000);
    });

    it('should return false when bank withdrawal is not transfer type', () => {
      const cardTransactions = [
        createTransaction('tx_1', -500, CategoryType.EXPENSE),
      ];
      const bankWithdrawal = createTransaction(
        'tx_4',
        -500,
        CategoryType.EXPENSE,
      );

      const result = service.canReconcileCreditCardPayment(
        cardTransactions,
        bankWithdrawal,
      );

      expect(result.canReconcile).toBe(false);
      expect(result.totalAmount).toBe(0);
    });

    it('should return false when totals do not match', () => {
      const cardTransactions = [
        createTransaction('tx_1', -500, CategoryType.EXPENSE),
        createTransaction('tx_2', -300, CategoryType.EXPENSE),
      ];
      const bankWithdrawal = createTransaction(
        'tx_4',
        -1000,
        CategoryType.TRANSFER,
      );

      const result = service.canReconcileCreditCardPayment(
        cardTransactions,
        bankWithdrawal,
      );

      expect(result.canReconcile).toBe(false);
      expect(result.totalAmount).toBe(800);
    });

    it('should handle empty card transactions', () => {
      const cardTransactions: TransactionEntity[] = [];
      const bankWithdrawal = createTransaction(
        'tx_4',
        -1000,
        CategoryType.TRANSFER,
      );

      const result = service.canReconcileCreditCardPayment(
        cardTransactions,
        bankWithdrawal,
      );

      expect(result.canReconcile).toBe(false);
      expect(result.totalAmount).toBe(0);
    });
  });

  describe('calculateBalance', () => {
    it('should calculate income and expense correctly', () => {
      const transactions = [
        createTransaction('tx_1', 5000, CategoryType.INCOME),
        createTransaction('tx_2', -1000, CategoryType.EXPENSE),
        createTransaction('tx_3', -500, CategoryType.EXPENSE),
      ];

      const result = service.calculateBalance(transactions);

      expect(result.income).toBe(5000);
      expect(result.expense).toBe(1500);
      expect(result.balance).toBe(3500);
    });

    it('should exclude transfers from balance calculation', () => {
      const transactions = [
        createTransaction('tx_1', 5000, CategoryType.INCOME),
        createTransaction('tx_2', -1000, CategoryType.EXPENSE),
        createTransaction('tx_3', -2000, CategoryType.TRANSFER),
        createTransaction('tx_4', 2000, CategoryType.TRANSFER),
      ];

      const result = service.calculateBalance(transactions);

      expect(result.income).toBe(5000);
      expect(result.expense).toBe(1000);
      expect(result.balance).toBe(4000);
    });

    it('should handle empty transaction list', () => {
      const transactions: TransactionEntity[] = [];

      const result = service.calculateBalance(transactions);

      expect(result.income).toBe(0);
      expect(result.expense).toBe(0);
      expect(result.balance).toBe(0);
    });

    it('should handle only income transactions', () => {
      const transactions = [
        createTransaction('tx_1', 5000, CategoryType.INCOME),
        createTransaction('tx_2', 3000, CategoryType.INCOME),
      ];

      const result = service.calculateBalance(transactions);

      expect(result.income).toBe(8000);
      expect(result.expense).toBe(0);
      expect(result.balance).toBe(8000);
    });

    it('should handle only expense transactions', () => {
      const transactions = [
        createTransaction('tx_1', -2000, CategoryType.EXPENSE),
        createTransaction('tx_2', -1000, CategoryType.EXPENSE),
      ];

      const result = service.calculateBalance(transactions);

      expect(result.income).toBe(0);
      expect(result.expense).toBe(3000);
      expect(result.balance).toBe(-3000);
    });
  });

  describe('aggregateByCategory', () => {
    it('should aggregate transactions by category type', () => {
      const transactions = [
        createTransaction('tx_1', 5000, CategoryType.INCOME),
        createTransaction('tx_2', 3000, CategoryType.INCOME),
        createTransaction('tx_3', -1000, CategoryType.EXPENSE),
        createTransaction('tx_4', -500, CategoryType.EXPENSE),
        createTransaction('tx_5', -2000, CategoryType.TRANSFER),
      ];

      const result = service.aggregateByCategory(transactions);

      const income = result.get(CategoryType.INCOME);
      expect(income?.count).toBe(2);
      expect(income?.total).toBe(8000);
      expect(income?.transactions).toHaveLength(2);

      const expense = result.get(CategoryType.EXPENSE);
      expect(expense?.count).toBe(2);
      expect(expense?.total).toBe(-1500);

      const transfer = result.get(CategoryType.TRANSFER);
      expect(transfer?.count).toBe(1);
      expect(transfer?.total).toBe(-2000);
    });

    it('should handle empty transaction list', () => {
      const transactions: TransactionEntity[] = [];

      const result = service.aggregateByCategory(transactions);

      expect(result.size).toBe(0);
    });

    it('should handle single category', () => {
      const transactions = [
        createTransaction('tx_1', -1000, CategoryType.EXPENSE),
        createTransaction('tx_2', -500, CategoryType.EXPENSE),
      ];

      const result = service.aggregateByCategory(transactions);

      expect(result.size).toBe(1);
      const expense = result.get(CategoryType.EXPENSE);
      expect(expense?.count).toBe(2);
      expect(expense?.total).toBe(-1500);
    });
  });

  describe('aggregateByInstitution', () => {
    it('should aggregate transactions by institution', () => {
      const transactions = [
        createTransaction(
          'tx_1',
          5000,
          CategoryType.INCOME,
          undefined,
          'inst_1',
        ),
        createTransaction(
          'tx_2',
          3000,
          CategoryType.INCOME,
          undefined,
          'inst_1',
        ),
        createTransaction(
          'tx_3',
          -1000,
          CategoryType.EXPENSE,
          undefined,
          'inst_2',
        ),
        createTransaction(
          'tx_4',
          -500,
          CategoryType.EXPENSE,
          undefined,
          'inst_2',
        ),
      ];

      const result = service.aggregateByInstitution(transactions);

      const inst1 = result.get('inst_1');
      expect(inst1?.count).toBe(2);
      expect(inst1?.total).toBe(8000);
      expect(inst1?.transactions).toHaveLength(2);

      const inst2 = result.get('inst_2');
      expect(inst2?.count).toBe(2);
      expect(inst2?.total).toBe(-1500);
    });

    it('should handle empty transaction list', () => {
      const transactions: TransactionEntity[] = [];

      const result = service.aggregateByInstitution(transactions);

      expect(result.size).toBe(0);
    });

    it('should handle single institution', () => {
      const transactions = [
        createTransaction(
          'tx_1',
          -1000,
          CategoryType.EXPENSE,
          undefined,
          'inst_1',
        ),
        createTransaction(
          'tx_2',
          -500,
          CategoryType.EXPENSE,
          undefined,
          'inst_1',
        ),
      ];

      const result = service.aggregateByInstitution(transactions);

      expect(result.size).toBe(1);
      const inst1 = result.get('inst_1');
      expect(inst1?.count).toBe(2);
      expect(inst1?.total).toBe(-1500);
    });
  });
});
