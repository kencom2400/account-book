import { Test, TestingModule } from '@nestjs/testing';
import { SubcategoryAggregationDomainService } from './subcategory-aggregation-domain.service';
import { TransactionEntity } from '../entities/transaction.entity';
import { CategoryEntity } from '../../../category/domain/entities/category.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';

describe('SubcategoryAggregationDomainService', () => {
  let service: SubcategoryAggregationDomainService;

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

  const createCategory = (
    id: string,
    name: string,
    type: CategoryType,
    parentId: string | null = null,
  ): CategoryEntity => {
    return new CategoryEntity(
      id,
      name,
      type,
      parentId,
      null,
      null,
      true,
      1,
      new Date(),
      new Date(),
    );
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubcategoryAggregationDomainService],
    }).compile();

    service = module.get<SubcategoryAggregationDomainService>(
      SubcategoryAggregationDomainService,
    );
  });

  describe('aggregateBySubcategory', () => {
    it('should aggregate transactions by subcategory', () => {
      const transactions = [
        createTransaction('1', 50000, CategoryType.EXPENSE, 'cat_1'),
        createTransaction('2', 30000, CategoryType.EXPENSE, 'cat_2'),
        createTransaction('3', 20000, CategoryType.EXPENSE, 'cat_1'),
      ];

      // カテゴリIDごとにグループ化
      const transactionsByCategoryId = new Map<string, TransactionEntity[]>();
      for (const transaction of transactions) {
        const categoryId = transaction.category.id;
        if (!transactionsByCategoryId.has(categoryId)) {
          transactionsByCategoryId.set(categoryId, []);
        }
        transactionsByCategoryId.get(categoryId)!.push(transaction);
      }

      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const result = service.aggregateBySubcategory(
        transactionsByCategoryId,
        totalAmount,
      );

      expect(result.size).toBe(2);
      expect(result.get('cat_1')?.totalAmount).toBe(70000);
      expect(result.get('cat_1')?.transactionCount).toBe(2);
      expect(result.get('cat_1')?.averageAmount).toBe(35000);
      expect(result.get('cat_2')?.totalAmount).toBe(30000);
      expect(result.get('cat_2')?.transactionCount).toBe(1);
      expect(result.get('cat_2')?.averageAmount).toBe(30000);
    });

    it('should return empty map when no transactions', () => {
      const transactionsByCategoryId = new Map<string, TransactionEntity[]>();

      const result = service.aggregateBySubcategory(
        transactionsByCategoryId,
        0,
      );

      expect(result.size).toBe(0);
    });

    it('should aggregate all transactions including different category types', () => {
      const transactions = [
        createTransaction('1', 50000, CategoryType.EXPENSE, 'cat_1'),
        createTransaction('2', 30000, CategoryType.INCOME, 'cat_2'),
      ];

      // カテゴリIDごとにグループ化
      const transactionsByCategoryId = new Map<string, TransactionEntity[]>();
      for (const transaction of transactions) {
        const categoryId = transaction.category.id;
        if (!transactionsByCategoryId.has(categoryId)) {
          transactionsByCategoryId.set(categoryId, []);
        }
        transactionsByCategoryId.get(categoryId)!.push(transaction);
      }

      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const result = service.aggregateBySubcategory(
        transactionsByCategoryId,
        totalAmount,
      );

      expect(result.size).toBe(2);
      expect(result.get('cat_1')?.totalAmount).toBe(50000);
      expect(result.get('cat_2')?.totalAmount).toBe(30000);
    });
  });

  describe('aggregateHierarchy', () => {
    it('should aggregate transactions with hierarchy structure', () => {
      const transactions = [
        createTransaction('1', 50000, CategoryType.EXPENSE, 'cat_child_1'),
        createTransaction('2', 30000, CategoryType.EXPENSE, 'cat_child_2'),
        createTransaction('3', 20000, CategoryType.EXPENSE, 'cat_child_1'),
      ];

      const categories = [
        createCategory('cat_parent', 'Parent Category', CategoryType.EXPENSE),
        createCategory(
          'cat_child_1',
          'Child Category 1',
          CategoryType.EXPENSE,
          'cat_parent',
        ),
        createCategory(
          'cat_child_2',
          'Child Category 2',
          CategoryType.EXPENSE,
          'cat_parent',
        ),
      ];

      // カテゴリIDごとにグループ化
      const transactionsByCategoryId = new Map<string, TransactionEntity[]>();
      for (const transaction of transactions) {
        const categoryId = transaction.category.id;
        if (!transactionsByCategoryId.has(categoryId)) {
          transactionsByCategoryId.set(categoryId, []);
        }
        transactionsByCategoryId.get(categoryId)!.push(transaction);
      }

      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const result = service.aggregateHierarchy(
        transactionsByCategoryId,
        categories,
        totalAmount,
      );

      expect(result).toHaveLength(1);
      expect(result[0].itemId).toBe('cat_parent');
      expect(result[0].totalAmount).toBe(100000); // 50000 + 30000 + 20000
      expect(result[0].transactionCount).toBe(3);
      expect(result[0].children).toHaveLength(2);
      expect(result[0].children[0].itemId).toBe('cat_child_1');
      expect(result[0].children[0].totalAmount).toBe(70000);
      expect(result[0].children[1].itemId).toBe('cat_child_2');
      expect(result[0].children[1].totalAmount).toBe(30000);
    });

    it('should handle categories without transactions', () => {
      const transactions: TransactionEntity[] = [];
      const categories = [
        createCategory('cat_parent', 'Parent Category', CategoryType.EXPENSE),
        createCategory(
          'cat_child_1',
          'Child Category 1',
          CategoryType.EXPENSE,
          'cat_parent',
        ),
      ];

      // カテゴリIDごとにグループ化
      const transactionsByCategoryId = new Map<string, TransactionEntity[]>();
      for (const transaction of transactions) {
        const categoryId = transaction.category.id;
        if (!transactionsByCategoryId.has(categoryId)) {
          transactionsByCategoryId.set(categoryId, []);
        }
        transactionsByCategoryId.get(categoryId)!.push(transaction);
      }

      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      const result = service.aggregateHierarchy(
        transactionsByCategoryId,
        categories,
        totalAmount,
      );

      expect(result).toHaveLength(1);
      expect(result[0].itemId).toBe('cat_parent');
      expect(result[0].totalAmount).toBe(0);
      expect(result[0].transactionCount).toBe(0);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].totalAmount).toBe(0);
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

  describe('calculateAverage', () => {
    it('should calculate average correctly', () => {
      expect(service.calculateAverage(100, 2)).toBe(50);
      expect(service.calculateAverage(300, 3)).toBe(100);
      expect(service.calculateAverage(333, 3)).toBe(111); // rounded
    });

    it('should return 0 when count is 0', () => {
      expect(service.calculateAverage(50, 0)).toBe(0);
    });
  });

  describe('calculateTrend', () => {
    it('should calculate monthly trend for transactions (already filtered by UseCase)', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      // UseCaseで既に期間でフィルタリング済みの取引を想定
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
          CategoryType.EXPENSE,
          'cat_2',
          new Date('2025-01-25'),
        ),
      ];

      const result = service.calculateTrend(transactions, startDate, endDate);

      expect(result.monthly).toHaveLength(1);
      expect(result.monthly[0].month).toBe('2025-01');
      expect(result.monthly[0].amount).toBe(180000); // 100000 + 50000 + 30000
      expect(result.monthly[0].count).toBe(3);
    });

    it('should calculate monthly trend for multiple months', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-02-28');
      // UseCaseで既に期間でフィルタリング済みの取引を想定
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
          new Date('2025-02-10'),
        ),
      ];

      const result = service.calculateTrend(transactions, startDate, endDate);

      expect(result.monthly).toHaveLength(2);
      expect(result.monthly[0].month).toBe('2025-01');
      expect(result.monthly[0].amount).toBe(100000);
      expect(result.monthly[0].count).toBe(1);
      expect(result.monthly[1].month).toBe('2025-02');
      expect(result.monthly[1].amount).toBe(50000);
      expect(result.monthly[1].count).toBe(1);
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
