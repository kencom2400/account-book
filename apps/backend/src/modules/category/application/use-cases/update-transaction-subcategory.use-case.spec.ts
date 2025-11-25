import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UpdateTransactionSubcategoryUseCase } from './update-transaction-subcategory.use-case';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { SUB_CATEGORY_REPOSITORY } from '../../domain/repositories/subcategory.repository.interface';
import type { ISubcategoryRepository } from '../../domain/repositories/subcategory.repository.interface';
import { TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY } from '../../../transaction/domain/repositories/transaction-category-change-history.repository.interface';
import type { ITransactionCategoryChangeHistoryRepository } from '../../../transaction/domain/repositories/transaction-category-change-history.repository.interface';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { Subcategory } from '../../domain/entities/subcategory.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';
import { ClassificationReason } from '../../domain/enums/classification-reason.enum';

describe('UpdateTransactionSubcategoryUseCase', () => {
  let useCase: UpdateTransactionSubcategoryUseCase;
  let mockTransactionRepository: jest.Mocked<ITransactionRepository>;
  let mockSubcategoryRepository: jest.Mocked<ISubcategoryRepository>;
  let mockHistoryRepository: jest.Mocked<ITransactionCategoryChangeHistoryRepository>;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockHistorySave: jest.Mock;
  let mockTransactionSave: jest.Mock;
  let mockTransactionFindOne: jest.Mock;

  const baseDate = new Date('2025-11-24T10:00:00.000Z');

  const mockTransaction = new TransactionEntity(
    'trans-001',
    new Date('2025-01-15'),
    -1500,
    {
      id: 'cat-001',
      name: '食費',
      type: CategoryType.EXPENSE,
    },
    'スターバックス',
    'inst-001',
    'acc-001',
    TransactionStatus.COMPLETED,
    false,
    null,
    baseDate,
    baseDate,
  );

  const mockSubcategory = new Subcategory(
    'food_restaurant',
    CategoryType.EXPENSE,
    'レストラン',
    'expense-food',
    2,
    '🍽️',
    '#FF6B6B',
    false,
    true,
    baseDate,
    baseDate,
  );

  beforeEach(async () => {
    mockTransactionRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findByAccountId: jest.fn(),
      findByDateRange: jest.fn(),
      delete: jest.fn(),
      findByInstitutionId: jest.fn(),
      getMonthlySummary: jest.fn(),
    } as any;

    mockSubcategoryRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByCategory: jest.fn(),
      findByParentId: jest.fn(),
      findDefault: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockHistoryRepository = {
      create: jest.fn(),
      findByTransactionId: jest.fn(),
      deleteAll: jest.fn(),
    } as any;

    // モック関数を作成
    mockHistorySave = jest.fn().mockResolvedValue({});
    mockTransactionSave = jest.fn().mockResolvedValue({});
    mockTransactionFindOne = jest.fn().mockResolvedValue({
      id: 'trans-001',
      date: new Date('2025-01-15'),
      amount: -1500,
      categoryId: 'cat-001',
      categoryName: '食費',
      categoryType: CategoryType.EXPENSE,
      description: 'スターバックス',
      institutionId: 'inst-001',
      accountId: 'acc-001',
      status: TransactionStatus.COMPLETED,
      isReconciled: false,
      relatedTransactionId: null,
      subcategoryId: 'food_cafe',
      classificationConfidence: 0.95,
      classificationReason: ClassificationReason.MERCHANT_MATCH,
      merchantId: 'merchant-001',
      confirmedAt: baseDate,
      createdAt: baseDate,
      updatedAt: baseDate,
    });

    // DataSourceのモックを作成
    const mockSubcategoryFindOne = jest.fn().mockResolvedValue({
      id: 'food_cafe',
      categoryType: CategoryType.EXPENSE,
      name: 'カフェ・喫茶店',
      parentId: 'expense-food',
      displayOrder: 1,
      icon: '☕',
      color: '#FF6B6B',
      isDefault: false,
      isActive: true,
      createdAt: baseDate,
      updatedAt: baseDate,
    });

    const mockEntityManager = {
      getRepository: jest.fn((entity) => {
        if (entity.name === 'TransactionCategoryChangeHistoryOrmEntity') {
          return { save: mockHistorySave };
        }
        if (entity.name === 'TransactionOrmEntity') {
          return {
            findOne: mockTransactionFindOne,
            save: mockTransactionSave,
          };
        }
        if (entity.name === 'SubcategoryOrmEntity') {
          return {
            findOne: mockSubcategoryFindOne,
          };
        }
        return { save: jest.fn() };
      }),
    };

    mockDataSource = {
      transaction: jest.fn().mockImplementation(async (callback) => {
        return await callback(mockEntityManager);
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTransactionSubcategoryUseCase,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: mockTransactionRepository,
        },
        {
          provide: SUB_CATEGORY_REPOSITORY,
          useValue: mockSubcategoryRepository,
        },
        {
          provide: TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY,
          useValue: mockHistoryRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateTransactionSubcategoryUseCase>(
      UpdateTransactionSubcategoryUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update transaction subcategory and create history', async () => {
      // Arrange
      const dto = {
        transactionId: 'trans-001',
        subcategoryId: 'food_restaurant',
      };

      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockSubcategoryRepository.findById.mockResolvedValue(mockSubcategory);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.transactionId).toBe('trans-001');
      expect(result.subcategoryId).toBe('food_restaurant');
      expect(result.confidence).toBe(1.0);
      expect(result.reason).toBe(ClassificationReason.MANUAL);
      expect(result.confirmedAt).toBeInstanceOf(Date);

      expect(mockTransactionRepository.findById).toHaveBeenCalledWith(
        'trans-001',
      );
      expect(mockSubcategoryRepository.findById).toHaveBeenCalledWith(
        'food_restaurant',
      );
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockHistorySave).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: 'trans-001',
          oldCategoryId: 'food_cafe',
          newCategoryId: 'food_restaurant',
        }),
      );
      expect(mockTransactionSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'trans-001',
          subcategoryId: 'food_restaurant',
          classificationConfidence: 1.0,
          classificationReason: ClassificationReason.MANUAL,
        }),
      );
    });

    it('should throw NotFoundException when transaction not found', async () => {
      // Arrange
      const dto = {
        transactionId: 'trans-999',
        subcategoryId: 'food_restaurant',
      };

      mockTransactionRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith(
        'trans-999',
      );
      expect(mockSubcategoryRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when subcategory not found', async () => {
      // Arrange
      const dto = {
        transactionId: 'trans-001',
        subcategoryId: 'subcategory-999',
      };

      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockSubcategoryRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(NotFoundException);
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith(
        'trans-001',
      );
      expect(mockSubcategoryRepository.findById).toHaveBeenCalledWith(
        'subcategory-999',
      );
    });

    it('should not create history when subcategory is unchanged', async () => {
      // Arrange
      const dto = {
        transactionId: 'trans-001',
        subcategoryId: 'food_cafe',
      };

      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockSubcategoryRepository.findById.mockResolvedValue(
        new Subcategory(
          'food_cafe',
          CategoryType.EXPENSE,
          'カフェ・喫茶店',
          'expense-food',
          1,
          '☕',
          '#FF6B6B',
          false,
          true,
          baseDate,
          baseDate,
        ),
      );

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.transactionId).toBe('trans-001');
      expect(result.subcategoryId).toBe('food_cafe');
      // 履歴は作成されない（同じサブカテゴリの場合）
      expect(mockHistorySave).not.toHaveBeenCalled();
      expect(mockTransactionSave).toHaveBeenCalled();
    });

    it('should handle transaction with no existing subcategory', async () => {
      // Arrange
      const transactionWithoutSubcategory = new TransactionEntity(
        'trans-002',
        new Date('2025-01-15'),
        -2000,
        {
          id: 'cat-001',
          name: '食費',
          type: CategoryType.EXPENSE,
        },
        'テスト取引',
        'inst-001',
        'acc-001',
        TransactionStatus.COMPLETED,
        false,
        null,
        baseDate,
        baseDate,
      );

      const dto = {
        transactionId: 'trans-002',
        subcategoryId: 'food_restaurant',
      };

      mockTransactionRepository.findById.mockResolvedValue(
        transactionWithoutSubcategory,
      );
      mockSubcategoryRepository.findById.mockResolvedValue(mockSubcategory);

      mockTransactionFindOne.mockResolvedValue({
        id: 'trans-002',
        subcategoryId: null,
        categoryId: 'cat-001',
        categoryName: '食費',
        categoryType: CategoryType.EXPENSE,
      });

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.subcategoryId).toBe('food_restaurant');
      expect(mockHistorySave).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: 'trans-002',
          oldCategoryId: 'cat-001',
          newCategoryId: 'food_restaurant',
        }),
      );
    });
  });
});
