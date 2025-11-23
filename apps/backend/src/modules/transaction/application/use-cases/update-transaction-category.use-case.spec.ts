import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateTransactionCategoryUseCase } from './update-transaction-category.use-case';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionCategoryChangeHistoryRepository } from '../../domain/repositories/transaction-category-change-history.repository.interface';
import { TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY } from '../../domain/repositories/transaction-category-change-history.repository.interface';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';

describe('UpdateTransactionCategoryUseCase', () => {
  let useCase: UpdateTransactionCategoryUseCase;
  let mockRepository: jest.Mocked<ITransactionRepository>;
  let mockHistoryRepository: jest.Mocked<ITransactionCategoryChangeHistoryRepository>;

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
    new Date('2025-01-15T10:00:00Z'),
    new Date('2025-01-15T10:00:00Z'),
  );

  beforeEach(async () => {
    mockRepository = {
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

    mockHistoryRepository = {
      create: jest.fn(),
      findByTransactionId: jest.fn(),
      deleteAll: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTransactionCategoryUseCase,
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY,
          useValue: mockHistoryRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateTransactionCategoryUseCase>(
      UpdateTransactionCategoryUseCase,
    );
  });

  describe('execute', () => {
    it('取引のカテゴリを正しく更新できる', async () => {
      const newCategory = {
        id: 'cat-002',
        name: '交通費',
        type: CategoryType.EXPENSE,
      };

      mockRepository.findById.mockResolvedValue(mockTransaction);

      const updatedTransaction = mockTransaction.updateCategory(newCategory);
      mockRepository.update.mockResolvedValue(updatedTransaction);

      const result = await useCase.execute({
        transactionId: 'trans-001',
        category: newCategory,
      });

      expect(mockRepository.findById).toHaveBeenCalledWith('trans-001');
      expect(mockHistoryRepository.create).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalled();
      expect(result.category.id).toBe('cat-002');
      expect(result.category.name).toBe('交通費');
      expect(result.category.type).toBe(CategoryType.EXPENSE);
    });

    it('異なるカテゴリタイプに変更できる', async () => {
      const newCategory = {
        id: 'cat-income-001',
        name: '給与所得',
        type: CategoryType.INCOME,
      };

      mockRepository.findById.mockResolvedValue(mockTransaction);

      const updatedTransaction = mockTransaction.updateCategory(newCategory);
      mockRepository.update.mockResolvedValue(updatedTransaction);

      const result = await useCase.execute({
        transactionId: 'trans-001',
        category: newCategory,
      });

      expect(result.category.type).toBe(CategoryType.INCOME);
    });

    it('取引が存在しない場合はNotFoundExceptionをスローする', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const newCategory = {
        id: 'cat-002',
        name: '交通費',
        type: CategoryType.EXPENSE,
      };

      await expect(
        useCase.execute({
          transactionId: 'non-existent',
          category: newCategory,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockRepository.findById).toHaveBeenCalledWith('non-existent');
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('更新後のupdatedAtが更新される', async () => {
      const newCategory = {
        id: 'cat-002',
        name: '交通費',
        type: CategoryType.EXPENSE,
      };

      mockRepository.findById.mockResolvedValue(mockTransaction);

      const updatedTransaction = mockTransaction.updateCategory(newCategory);
      mockRepository.update.mockResolvedValue(updatedTransaction);

      const beforeUpdate = mockTransaction.updatedAt;
      const result = await useCase.execute({
        transactionId: 'trans-001',
        category: newCategory,
      });

      // updatedAtが更新されていることを確認
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
    });

    it('元の取引IDが変更されない', async () => {
      const newCategory = {
        id: 'cat-002',
        name: '交通費',
        type: CategoryType.EXPENSE,
      };

      mockRepository.findById.mockResolvedValue(mockTransaction);

      const updatedTransaction = mockTransaction.updateCategory(newCategory);
      mockRepository.update.mockResolvedValue(updatedTransaction);

      const result = await useCase.execute({
        transactionId: 'trans-001',
        category: newCategory,
      });

      expect(result.id).toBe('trans-001');
      expect(result.amount).toBe(mockTransaction.amount);
      expect(result.description).toBe(mockTransaction.description);
    });
  });
});
