import { Test, TestingModule } from '@nestjs/testing';
import { CategoryAggregationDomainService } from './category-aggregation-domain.service';
import { TransactionEntity } from '../entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';

describe('CategoryAggregationDomainService', () => {
  let service: CategoryAggregationDomainService;

  const createTransaction = (
    id: string,
    amount: number,
    categoryType: CategoryType,
    categoryId: string,
    date?: Date,
  ): TransactionEntity => {
    return new TransactionEntity(
      id,
      date || new Date('2025-01-15'),
      amount,
      { id: categoryId, name: `Category ${categoryId}`, type: categoryType },
      'Test description',
      'inst_1',
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
      providers: [CategoryAggregationDomainService],
    }).compile();

    service = module.get<CategoryAggregationDomainService>(
      CategoryAggregationDomainService,
    );
  });

  describe('aggregateByCategoryType', () => {
    it('should aggregate transactions by category type', () => {
      const transactions = [
        createTransaction('1', 100000, CategoryType.INCOME, 'cat_1'),
        createTransaction('2', 50000, CategoryType.EXPENSE, 'cat_2'),
        createTransaction('3', 30000, CategoryType.EXPENSE, 'cat_3'),
        createTransaction('4', 20000, CategoryType.INCOME, 'cat_1'),
      ];

      const result = service.aggregateByCategoryType(
        transactions,
        CategoryType.INCOME,
      );

      expect(result.category).toBe(CategoryType.INCOME);
      expect(result.totalAmount).toBe(120000);
      expect(result.transactionCount).toBe(2);
      expect(result.percentage).toBe(60); // 120000 / 200000 * 100
    });

    it('should return 0 percentage when total is 0', () => {
      const transactions: TransactionEntity[] = [];

      const result = service.aggregateByCategoryType(
        transactions,
        CategoryType.INCOME,
      );

      expect(result.totalAmount).toBe(0);
      expect(result.transactionCount).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });

  describe('aggregateBySubcategory', () => {
    it('should aggregate transactions by subcategory', () => {
      const transactions = [
        createTransaction('1', 50000, CategoryType.EXPENSE, 'cat_1'),
        createTransaction('2', 30000, CategoryType.EXPENSE, 'cat_2'),
        createTransaction('3', 20000, CategoryType.EXPENSE, 'cat_1'),
      ];

      const result = service.aggregateBySubcategory(
        transactions,
        CategoryType.EXPENSE,
      );

      expect(result.size).toBe(2);
      expect(result.get('cat_1')?.amount).toBe(70000);
      expect(result.get('cat_1')?.count).toBe(2);
      expect(result.get('cat_1')?.percentage).toBe(70); // 70000 / 100000 * 100
      expect(result.get('cat_2')?.amount).toBe(30000);
      expect(result.get('cat_2')?.count).toBe(1);
      expect(result.get('cat_2')?.percentage).toBe(30); // 30000 / 100000 * 100
    });

    it('should return empty map when no transactions match category type', () => {
      const transactions = [
        createTransaction('1', 50000, CategoryType.INCOME, 'cat_1'),
      ];

      const result = service.aggregateBySubcategory(
        transactions,
        CategoryType.EXPENSE,
      );

      expect(result.size).toBe(0);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(service.calculatePercentage(50, 100)).toBe(50);
      expect(service.calculatePercentage(30, 100)).toBe(30);
      expect(service.calculatePercentage(1, 3)).toBe(33.3); // 33.333... rounded to 33.3
    });

    it('should return 0 when total is 0', () => {
      expect(service.calculatePercentage(50, 0)).toBe(0);
    });
  });

  describe('calculateTrend', () => {
    it('should calculate monthly trend', () => {
      const transactions = [
        createTransaction(
          '1',
          100000,
          CategoryType.INCOME,
          'cat_1',
          new Date('2025-01-15'),
        ),
        createTransaction(
          '2',
          50000,
          CategoryType.INCOME,
          'cat_1',
          new Date('2025-01-20'),
        ),
        createTransaction(
          '3',
          30000,
          CategoryType.INCOME,
          'cat_1',
          new Date('2025-02-10'),
        ),
      ];

      const result = service.calculateTrend(
        transactions,
        new Date('2025-01-01'),
        new Date('2025-02-28'),
      );

      expect(result.monthly).toHaveLength(2);
      expect(result.monthly[0].month).toBe('2025-01');
      expect(result.monthly[0].amount).toBe(150000);
      expect(result.monthly[0].count).toBe(2);
      expect(result.monthly[1].month).toBe('2025-02');
      expect(result.monthly[1].amount).toBe(30000);
      expect(result.monthly[1].count).toBe(1);
    });

    it('should filter transactions by date range', () => {
      const transactions = [
        createTransaction(
          '1',
          100000,
          CategoryType.INCOME,
          'cat_1',
          new Date('2024-12-15'),
        ),
        createTransaction(
          '2',
          50000,
          CategoryType.INCOME,
          'cat_1',
          new Date('2025-01-15'),
        ),
        createTransaction(
          '3',
          30000,
          CategoryType.INCOME,
          'cat_1',
          new Date('2025-02-15'),
        ),
      ];

      const result = service.calculateTrend(
        transactions,
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );

      expect(result.monthly).toHaveLength(1);
      expect(result.monthly[0].month).toBe('2025-01');
      expect(result.monthly[0].amount).toBe(50000);
    });
  });

  describe('getTopTransactions', () => {
    it('should return top transactions sorted by amount', () => {
      const transactions = [
        createTransaction('1', 10000, CategoryType.EXPENSE, 'cat_1'),
        createTransaction('2', 50000, CategoryType.EXPENSE, 'cat_2'),
        createTransaction('3', 30000, CategoryType.EXPENSE, 'cat_3'),
        createTransaction('4', 20000, CategoryType.EXPENSE, 'cat_4'),
        createTransaction('5', 40000, CategoryType.EXPENSE, 'cat_5'),
      ];

      const result = service.getTopTransactions(transactions, 3);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('2'); // 50000
      expect(result[1].id).toBe('5'); // 40000
      expect(result[2].id).toBe('3'); // 30000
    });

    it('should return all transactions when limit is greater than count', () => {
      const transactions = [
        createTransaction('1', 10000, CategoryType.EXPENSE, 'cat_1'),
        createTransaction('2', 50000, CategoryType.EXPENSE, 'cat_2'),
      ];

      const result = service.getTopTransactions(transactions, 5);

      expect(result).toHaveLength(2);
    });

    it('should use absolute value for sorting', () => {
      const transactions = [
        createTransaction('1', -50000, CategoryType.EXPENSE, 'cat_1'),
        createTransaction('2', 30000, CategoryType.EXPENSE, 'cat_2'),
        createTransaction('3', -40000, CategoryType.EXPENSE, 'cat_3'),
      ];

      const result = service.getTopTransactions(transactions, 2);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1'); // -50000 (absolute: 50000)
      expect(result[1].id).toBe('3'); // -40000 (absolute: 40000)
    });
  });
});
