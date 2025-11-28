import { Test, TestingModule } from '@nestjs/testing';
import { CategoryType, TransactionStatus } from '@account-book/types';
import { CalculateMonthlySummaryUseCase } from './calculate-monthly-summary.use-case';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TransactionDomainService } from '../../domain/services/transaction-domain.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';

describe('CalculateMonthlySummaryUseCase', () => {
  let useCase: CalculateMonthlySummaryUseCase;
  let repository: jest.Mocked<ITransactionRepository>;

  const createTransaction = (
    id: string,
    amount: number,
    categoryType: CategoryType,
    institutionId = 'inst_1',
  ): TransactionEntity => {
    return new TransactionEntity(
      id,
      new Date('2024-01-15'),
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

  beforeEach(async () => {
    const mockRepo = {
      findByMonth: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculateMonthlySummaryUseCase,
        TransactionDomainService,
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: mockRepo,
        },
      ],
    }).compile();

    useCase = module.get<CalculateMonthlySummaryUseCase>(
      CalculateMonthlySummaryUseCase,
    );
    repository = module.get(TRANSACTION_REPOSITORY);
  });

  describe('execute', () => {
    it('should calculate monthly summary with income and expenses', async () => {
      const transactions = [
        createTransaction('tx_1', 5000, CategoryType.INCOME, 'inst_1'),
        createTransaction('tx_2', 3000, CategoryType.INCOME, 'inst_1'),
        createTransaction('tx_3', -1000, CategoryType.EXPENSE, 'inst_2'),
        createTransaction('tx_4', -500, CategoryType.EXPENSE, 'inst_2'),
      ];

      repository.findByMonth.mockResolvedValue(transactions);

      const result = await useCase.execute(2024, 1);

      expect(result.year).toBe(2024);
      expect(result.month).toBe(1);
      expect(result.income).toBe(8000);
      expect(result.expense).toBe(1500);
      expect(result.balance).toBe(6500);
      expect(result.transactionCount).toBe(4);
    });

    it('should aggregate by category correctly', async () => {
      const transactions = [
        createTransaction('tx_1', 5000, CategoryType.INCOME),
        createTransaction('tx_2', 3000, CategoryType.INCOME),
        createTransaction('tx_3', -1000, CategoryType.EXPENSE),
        createTransaction('tx_4', -2000, CategoryType.TRANSFER),
      ];

      repository.findByMonth.mockResolvedValue(transactions);

      const result = await useCase.execute(2024, 1);

      expect(result.byCategory[CategoryType.INCOME]).toEqual({
        count: 2,
        total: 8000,
      });
      expect(result.byCategory[CategoryType.EXPENSE]).toEqual({
        count: 1,
        total: -1000,
      });
      expect(result.byCategory[CategoryType.TRANSFER]).toEqual({
        count: 1,
        total: -2000,
      });
    });

    it('should aggregate by institution correctly', async () => {
      const transactions = [
        createTransaction('tx_1', 5000, CategoryType.INCOME, 'inst_1'),
        createTransaction('tx_2', 3000, CategoryType.INCOME, 'inst_1'),
        createTransaction('tx_3', -1000, CategoryType.EXPENSE, 'inst_2'),
        createTransaction('tx_4', -500, CategoryType.EXPENSE, 'inst_2'),
      ];

      repository.findByMonth.mockResolvedValue(transactions);

      const result = await useCase.execute(2024, 1);

      expect(result.byInstitution['inst_1']).toEqual({
        count: 2,
        total: 8000,
      });
      expect(result.byInstitution['inst_2']).toEqual({
        count: 2,
        total: -1500,
      });
    });

    it('should handle empty transactions', async () => {
      repository.findByMonth.mockResolvedValue([]);

      const result = await useCase.execute(2024, 1);

      expect(result.year).toBe(2024);
      expect(result.month).toBe(1);
      expect(result.income).toBe(0);
      expect(result.expense).toBe(0);
      expect(result.balance).toBe(0);
      expect(result.transactionCount).toBe(0);
      expect(Object.keys(result.byCategory)).toHaveLength(0);
      expect(Object.keys(result.byInstitution)).toHaveLength(0);
    });

    it('should exclude transfers from balance calculation', async () => {
      const transactions = [
        createTransaction('tx_1', 5000, CategoryType.INCOME),
        createTransaction('tx_2', -1000, CategoryType.EXPENSE),
        createTransaction('tx_3', -2000, CategoryType.TRANSFER),
        createTransaction('tx_4', 2000, CategoryType.TRANSFER),
      ];

      repository.findByMonth.mockResolvedValue(transactions);

      const result = await useCase.execute(2024, 1);

      expect(result.income).toBe(5000);
      expect(result.expense).toBe(1000);
      expect(result.balance).toBe(4000);
      // Transfers are still counted in transactionCount
      expect(result.transactionCount).toBe(4);
    });

    it('should handle only income transactions', async () => {
      const transactions = [
        createTransaction('tx_1', 5000, CategoryType.INCOME),
        createTransaction('tx_2', 3000, CategoryType.INCOME),
      ];

      repository.findByMonth.mockResolvedValue(transactions);

      const result = await useCase.execute(2024, 1);

      expect(result.income).toBe(8000);
      expect(result.expense).toBe(0);
      expect(result.balance).toBe(8000);
    });

    it('should handle only expense transactions', async () => {
      const transactions = [
        createTransaction('tx_1', -2000, CategoryType.EXPENSE),
        createTransaction('tx_2', -1000, CategoryType.EXPENSE),
      ];

      repository.findByMonth.mockResolvedValue(transactions);

      const result = await useCase.execute(2024, 1);

      expect(result.income).toBe(0);
      expect(result.expense).toBe(3000);
      expect(result.balance).toBe(-3000);
    });

    it('should handle multiple institutions with same transactions', async () => {
      const transactions = [
        createTransaction('tx_1', 1000, CategoryType.INCOME, 'inst_1'),
        createTransaction('tx_2', 1000, CategoryType.INCOME, 'inst_2'),
        createTransaction('tx_3', 1000, CategoryType.INCOME, 'inst_3'),
      ];

      repository.findByMonth.mockResolvedValue(transactions);

      const result = await useCase.execute(2024, 1);

      expect(Object.keys(result.byInstitution)).toHaveLength(3);
      expect(result.byInstitution['inst_1'].total).toBe(1000);
      expect(result.byInstitution['inst_2'].total).toBe(1000);
      expect(result.byInstitution['inst_3'].total).toBe(1000);
    });
  });
});
