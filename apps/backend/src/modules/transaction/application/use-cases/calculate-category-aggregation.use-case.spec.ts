import { Test, TestingModule } from '@nestjs/testing';
import { CategoryType, TransactionStatus } from '@account-book/types';
import { CalculateCategoryAggregationUseCase } from './calculate-category-aggregation.use-case';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { CATEGORY_REPOSITORY } from '../../../category/domain/repositories/category.repository.interface';
import type { ICategoryRepository } from '../../../category/domain/repositories/category.repository.interface';
import { CategoryAggregationDomainService } from '../../domain/services/category-aggregation-domain.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { CategoryEntity } from '../../../category/domain/entities/category.entity';

describe('CalculateCategoryAggregationUseCase', () => {
  let useCase: CalculateCategoryAggregationUseCase;
  let transactionRepository: jest.Mocked<ITransactionRepository>;
  let categoryRepository: jest.Mocked<ICategoryRepository>;

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
  ): CategoryEntity => {
    return new CategoryEntity(
      id,
      name,
      type,
      null,
      null,
      null,
      true,
      1,
      new Date(),
      new Date(),
    );
  };

  beforeEach(async () => {
    const mockTransactionRepo = {
      findByDateRange: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockCategoryRepo = {
      findByIds: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculateCategoryAggregationUseCase,
        CategoryAggregationDomainService,
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: mockTransactionRepo,
        },
        {
          provide: CATEGORY_REPOSITORY,
          useValue: mockCategoryRepo,
        },
      ],
    }).compile();

    useCase = module.get<CalculateCategoryAggregationUseCase>(
      CalculateCategoryAggregationUseCase,
    );
    transactionRepository = module.get(TRANSACTION_REPOSITORY);
    categoryRepository = module.get(CATEGORY_REPOSITORY);
  });

  describe('execute', () => {
    it('should calculate category aggregation for all categories', async () => {
      const transactions = [
        createTransaction('1', 100000, CategoryType.INCOME, 'cat_1'),
        createTransaction('2', 50000, CategoryType.EXPENSE, 'cat_2'),
        createTransaction('3', 30000, CategoryType.EXPENSE, 'cat_3'),
      ];

      const categories = [
        createCategory('cat_1', 'Salary', CategoryType.INCOME),
        createCategory('cat_2', 'Food', CategoryType.EXPENSE),
        createCategory('cat_3', 'Transport', CategoryType.EXPENSE),
      ];

      transactionRepository.findByDateRange.mockResolvedValue(transactions);
      categoryRepository.findByIds.mockResolvedValue(categories);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const result = await useCase.execute(startDate, endDate);

      expect(result).toHaveLength(5); // 全カテゴリタイプ
      expect(result[0].categoryType).toBe(CategoryType.INCOME);
      expect(result[0].totalAmount).toBe(100000);
      expect(result[0].transactionCount).toBe(1);
      expect(result[1].categoryType).toBe(CategoryType.EXPENSE);
      expect(result[1].totalAmount).toBe(80000);
      expect(result[1].transactionCount).toBe(2);
    });

    it('should calculate category aggregation for specific category type', async () => {
      const transactions = [
        createTransaction('1', 50000, CategoryType.EXPENSE, 'cat_2'),
        createTransaction('2', 30000, CategoryType.EXPENSE, 'cat_3'),
      ];

      const categories = [
        createCategory('cat_2', 'Food', CategoryType.EXPENSE),
        createCategory('cat_3', 'Transport', CategoryType.EXPENSE),
      ];

      transactionRepository.findByDateRange.mockResolvedValue(transactions);
      categoryRepository.findByIds.mockResolvedValue(categories);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const result = await useCase.execute(
        startDate,
        endDate,
        CategoryType.EXPENSE,
      );

      expect(result).toHaveLength(1);
      expect(result[0].categoryType).toBe(CategoryType.EXPENSE);
      expect(result[0].totalAmount).toBe(80000);
      expect(result[0].transactionCount).toBe(2);
      expect(result[0].subcategories).toHaveLength(2);
    });

    it('should return empty array when no transactions', async () => {
      transactionRepository.findByDateRange.mockResolvedValue([]);
      categoryRepository.findByIds.mockResolvedValue([]);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const result = await useCase.execute(startDate, endDate);

      expect(result).toHaveLength(5); // 全カテゴリタイプ（データなし）
      expect(result[0].totalAmount).toBe(0);
      expect(result[0].transactionCount).toBe(0);
    });

    it('should build subcategory aggregation with category names', async () => {
      const transactions = [
        createTransaction('1', 50000, CategoryType.EXPENSE, 'cat_2'),
        createTransaction('2', 30000, CategoryType.EXPENSE, 'cat_3'),
      ];

      const categories = [
        createCategory('cat_2', 'Food', CategoryType.EXPENSE),
        createCategory('cat_3', 'Transport', CategoryType.EXPENSE),
      ];

      transactionRepository.findByDateRange.mockResolvedValue(transactions);
      categoryRepository.findByIds.mockResolvedValue(categories);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const result = await useCase.execute(
        startDate,
        endDate,
        CategoryType.EXPENSE,
      );

      expect(result[0].subcategories).toHaveLength(2);
      expect(result[0].subcategories[0].categoryName).toBe('Food');
      expect(result[0].subcategories[1].categoryName).toBe('Transport');
      expect(categoryRepository.findByIds).toHaveBeenCalledWith([
        'cat_2',
        'cat_3',
      ]);
    });

    it('should format dates correctly', async () => {
      const transactions = [
        createTransaction('1', 100000, CategoryType.INCOME, 'cat_1'),
      ];

      transactionRepository.findByDateRange.mockResolvedValue(transactions);
      categoryRepository.findByIds.mockResolvedValue([]);

      const startDate = new Date('2025-01-15');
      const endDate = new Date('2025-01-20');
      const result = await useCase.execute(startDate, endDate);

      expect(result[0].startDate).toBe('2025-01-15');
      expect(result[0].endDate).toBe('2025-01-20');
    });
  });
});
