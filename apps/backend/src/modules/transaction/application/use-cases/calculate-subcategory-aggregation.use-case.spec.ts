import { Test, TestingModule } from '@nestjs/testing';
import { CategoryType, TransactionStatus } from '@account-book/types';
import { CalculateSubcategoryAggregationUseCase } from './calculate-subcategory-aggregation.use-case';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { CATEGORY_REPOSITORY } from '../../../category/domain/repositories/category.repository.interface';
import type { ICategoryRepository } from '../../../category/domain/repositories/category.repository.interface';
import { SubcategoryAggregationDomainService } from '../../domain/services/subcategory-aggregation-domain.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { CategoryEntity } from '../../../category/domain/entities/category.entity';

describe('CalculateSubcategoryAggregationUseCase', () => {
  let useCase: CalculateSubcategoryAggregationUseCase;
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
    const mockTransactionRepo = {
      findByDateRange: jest.fn(),
      findByCategoryType: jest.fn(),
      findByCategoryIdsAndDateRange: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockCategoryRepo = {
      findAll: jest.fn(),
      findByType: jest.fn(),
      findById: jest.fn(),
      findByParentId: jest.fn(),
      findByIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculateSubcategoryAggregationUseCase,
        SubcategoryAggregationDomainService,
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

    useCase = module.get<CalculateSubcategoryAggregationUseCase>(
      CalculateSubcategoryAggregationUseCase,
    );
    transactionRepository = module.get(TRANSACTION_REPOSITORY);
    categoryRepository = module.get(CATEGORY_REPOSITORY);
  });

  describe('execute', () => {
    it('should calculate subcategory aggregation for all categories', async () => {
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
      categoryRepository.findAll.mockResolvedValue(categories);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const result = await useCase.execute(startDate, endDate);

      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.period.start).toBeDefined();
      expect(result.period.end).toBeDefined();
      expect(result.totalAmount).toBe(180000);
      expect(result.totalTransactionCount).toBe(3);
      expect(transactionRepository.findByDateRange).toHaveBeenCalledWith(
        startDate,
        endDate,
      );
      expect(categoryRepository.findAll).toHaveBeenCalled();
    });

    it('should calculate subcategory aggregation for specific category type', async () => {
      const transactions = [
        createTransaction('1', 50000, CategoryType.EXPENSE, 'cat_2'),
        createTransaction('2', 30000, CategoryType.EXPENSE, 'cat_3'),
      ];

      const categories = [
        createCategory('cat_2', 'Food', CategoryType.EXPENSE),
        createCategory('cat_3', 'Transport', CategoryType.EXPENSE),
      ];

      transactionRepository.findByCategoryType.mockResolvedValue(transactions);
      categoryRepository.findByType.mockResolvedValue(categories);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const result = await useCase.execute(
        startDate,
        endDate,
        CategoryType.EXPENSE,
      );

      expect(result.items).toBeDefined();
      expect(result.totalAmount).toBe(80000);
      expect(result.totalTransactionCount).toBe(2);
      expect(transactionRepository.findByCategoryType).toHaveBeenCalledWith(
        CategoryType.EXPENSE,
        startDate,
        endDate,
      );
      expect(categoryRepository.findByType).toHaveBeenCalledWith(
        CategoryType.EXPENSE,
      );
    });

    it('should calculate subcategory aggregation for specific itemId', async () => {
      const parentCategory = createCategory(
        'cat_parent',
        'Parent Category',
        CategoryType.EXPENSE,
      );
      const childCategory1 = createCategory(
        'cat_child_1',
        'Child Category 1',
        CategoryType.EXPENSE,
        'cat_parent',
      );
      const childCategory2 = createCategory(
        'cat_child_2',
        'Child Category 2',
        CategoryType.EXPENSE,
        'cat_parent',
      );

      const transactions = [
        createTransaction('1', 50000, CategoryType.EXPENSE, 'cat_child_1'),
        createTransaction('2', 30000, CategoryType.EXPENSE, 'cat_child_2'),
      ];

      // Promise.allで並列実行されるため、両方のモックを設定
      categoryRepository.findById.mockResolvedValue(parentCategory);
      // getAllDescendantCategoriesで複数回呼ばれる可能性があるため、モックを設定
      // 最初の呼び出し（Promise.all内）と、getAllDescendantCategories内での呼び出し
      categoryRepository.findByParentId
        .mockResolvedValueOnce([childCategory1, childCategory2]) // Promise.all内
        .mockResolvedValueOnce([childCategory1, childCategory2]) // getAllDescendantCategories内（cat_parent）
        .mockResolvedValueOnce([]) // getAllDescendantCategories内（cat_child_1）
        .mockResolvedValueOnce([]); // getAllDescendantCategories内（cat_child_2）
      transactionRepository.findByCategoryIdsAndDateRange.mockResolvedValue(
        transactions,
      );

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const result = await useCase.execute(
        startDate,
        endDate,
        undefined,
        'cat_parent',
      );

      expect(result.items).toBeDefined();
      expect(result.totalAmount).toBe(80000);
      expect(result.totalTransactionCount).toBe(2);
      expect(categoryRepository.findById).toHaveBeenCalledWith('cat_parent');
      // getAllDescendantCategoriesで複数回呼ばれるため、少なくとも1回は呼ばれることを確認
      expect(categoryRepository.findByParentId).toHaveBeenCalled();
      expect(
        transactionRepository.findByCategoryIdsAndDateRange,
      ).toHaveBeenCalledWith(
        expect.arrayContaining(['cat_parent', 'cat_child_1', 'cat_child_2']),
        startDate,
        endDate,
      );
    });

    it('should return empty response when itemId does not exist', async () => {
      categoryRepository.findById.mockResolvedValue(null);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const result = await useCase.execute(
        startDate,
        endDate,
        undefined,
        'non-existent',
      );

      expect(result.items).toHaveLength(0);
      expect(result.totalAmount).toBe(0);
      expect(result.totalTransactionCount).toBe(0);
      expect(categoryRepository.findById).toHaveBeenCalledWith('non-existent');
    });

    it('should return empty response when no transactions', async () => {
      transactionRepository.findByDateRange.mockResolvedValue([]);
      categoryRepository.findAll.mockResolvedValue([]);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const result = await useCase.execute(startDate, endDate);

      expect(result.items).toHaveLength(0);
      expect(result.totalAmount).toBe(0);
      expect(result.totalTransactionCount).toBe(0);
    });

    it('should build hierarchy structure correctly', async () => {
      const parentCategory = createCategory(
        'cat_parent',
        'Parent Category',
        CategoryType.EXPENSE,
      );
      const childCategory = createCategory(
        'cat_child',
        'Child Category',
        CategoryType.EXPENSE,
        'cat_parent',
      );

      const transactions = [
        createTransaction('1', 50000, CategoryType.EXPENSE, 'cat_child'),
      ];

      transactionRepository.findByDateRange.mockResolvedValue(transactions);
      categoryRepository.findAll.mockResolvedValue([
        parentCategory,
        childCategory,
      ]);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const result = await useCase.execute(startDate, endDate);

      expect(result.items.length).toBeGreaterThan(0);
      const parentItem = result.items.find(
        (item) => item.itemId === 'cat_parent',
      );
      expect(parentItem).toBeDefined();
      if (parentItem) {
        expect(parentItem.children.length).toBeGreaterThan(0);
        const childItem = parentItem.children.find(
          (item) => item.itemId === 'cat_child',
        );
        expect(childItem).toBeDefined();
        expect(childItem?.totalAmount).toBe(50000);
      }
    });
  });
});
