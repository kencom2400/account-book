import { Test, TestingModule } from '@nestjs/testing';
import { MonthlyBalanceDomainService } from './monthly-balance-domain.service';
import { TransactionDomainService } from './transaction-domain.service';
import { TransactionEntity } from '../entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';

describe('MonthlyBalanceDomainService', () => {
  let service: MonthlyBalanceDomainService;

  const createTransaction = (
    id: string,
    amount: number,
    categoryType: CategoryType,
    categoryId: string,
    institutionId = 'inst_1',
  ): TransactionEntity => {
    return new TransactionEntity(
      id,
      new Date('2024-01-15'),
      amount,
      { id: categoryId, name: 'Test', type: categoryType },
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonthlyBalanceDomainService, TransactionDomainService],
    }).compile();

    service = module.get<MonthlyBalanceDomainService>(
      MonthlyBalanceDomainService,
    );
  });

  describe('calculateBalance', () => {
    it('should calculate balance correctly', () => {
      const transactions = [
        createTransaction('1', 100000, CategoryType.INCOME, 'cat_1'),
        createTransaction('2', 50000, CategoryType.EXPENSE, 'cat_2'),
        createTransaction('3', 30000, CategoryType.EXPENSE, 'cat_3'),
      ];

      const result = service.calculateBalance(transactions);

      expect(result.income).toBe(100000);
      expect(result.expense).toBe(80000);
      expect(result.balance).toBe(20000);
    });
  });

  describe('aggregateByCategory', () => {
    it('should aggregate by categoryId', () => {
      const transactions = [
        createTransaction('1', 10000, CategoryType.INCOME, 'cat_1'),
        createTransaction('2', 20000, CategoryType.INCOME, 'cat_1'),
        createTransaction('3', 5000, CategoryType.EXPENSE, 'cat_2'),
      ];

      const result = service.aggregateByCategory(transactions);

      expect(result.get('cat_1')).toEqual({ total: 30000, count: 2 });
      expect(result.get('cat_2')).toEqual({ total: 5000, count: 1 });
    });
  });

  describe('aggregateByInstitution', () => {
    it('should aggregate by institutionId', () => {
      const transactions = [
        createTransaction('1', 10000, CategoryType.INCOME, 'cat_1', 'inst_1'),
        createTransaction('2', 20000, CategoryType.INCOME, 'cat_1', 'inst_1'),
        createTransaction('3', 5000, CategoryType.EXPENSE, 'cat_2', 'inst_2'),
      ];

      const result = service.aggregateByInstitution(transactions);

      expect(result.get('inst_1')).toEqual({ total: 30000, count: 2 });
      expect(result.get('inst_2')).toEqual({ total: 5000, count: 1 });
    });
  });

  describe('calculateSavingsRate', () => {
    it('should calculate savings rate correctly', () => {
      const rate = service.calculateSavingsRate(100000, 80000);
      expect(rate).toBe(20); // (100000 - 80000) / 100000 * 100
    });

    it('should return 0 when income is 0', () => {
      const rate = service.calculateSavingsRate(0, 50000);
      expect(rate).toBe(0);
    });
  });

  describe('calculateMonthComparison', () => {
    it('should calculate month comparison correctly', () => {
      const current = { income: 100000, expense: 80000, balance: 20000 };
      const previous = { income: 90000, expense: 70000, balance: 20000 };

      const result = service.calculateMonthComparison(current, previous);

      expect(result.incomeDiff).toBe(10000);
      expect(result.expenseDiff).toBe(10000);
      expect(result.balanceDiff).toBe(0);
      expect(result.incomeChangeRate).toBeCloseTo(11.11, 2);
      expect(result.expenseChangeRate).toBeCloseTo(14.29, 2);
    });
  });

  describe('calculateChangeRate', () => {
    it('should calculate change rate correctly', () => {
      const rate = service.calculateChangeRate(100, 120);
      expect(rate).toBe(20); // (120 - 100) / 100 * 100
    });

    it('should return 0 when previous is 0', () => {
      const rate = service.calculateChangeRate(0, 100);
      expect(rate).toBe(0);
    });
  });
});
