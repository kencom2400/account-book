import { Test, TestingModule } from '@nestjs/testing';
import { CategoryType, TransactionStatus } from '@account-book/types';
import { CalculateMonthlyBalanceUseCase } from './calculate-monthly-balance.use-case';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { MonthlyBalanceDomainService } from '../../domain/services/monthly-balance-domain.service';
import { TransactionDomainService } from '../../domain/services/transaction-domain.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';

describe('CalculateMonthlyBalanceUseCase', () => {
  let useCase: CalculateMonthlyBalanceUseCase;
  let repository: jest.Mocked<ITransactionRepository>;

  const createTransaction = (
    id: string,
    amount: number,
    categoryType: CategoryType,
    categoryId: string,
    institutionId = 'inst_1',
    date?: Date,
  ): TransactionEntity => {
    return new TransactionEntity(
      id,
      date || new Date('2024-01-15'),
      amount,
      { id: categoryId, name: `Category ${categoryId}`, type: categoryType },
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
        CalculateMonthlyBalanceUseCase,
        MonthlyBalanceDomainService,
        TransactionDomainService,
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: mockRepo,
        },
      ],
    }).compile();

    useCase = module.get<CalculateMonthlyBalanceUseCase>(
      CalculateMonthlyBalanceUseCase,
    );
    repository = module.get(TRANSACTION_REPOSITORY);
  });

  describe('execute', () => {
    it('should calculate monthly balance with income and expenses', async () => {
      const currentTransactions = [
        createTransaction('tx_1', 100000, CategoryType.INCOME, 'cat_1'),
        createTransaction('tx_2', 50000, CategoryType.EXPENSE, 'cat_2'),
        createTransaction('tx_3', 30000, CategoryType.EXPENSE, 'cat_3'),
      ];

      repository.findByMonth.mockResolvedValueOnce(currentTransactions); // 当月
      repository.findByMonth.mockResolvedValueOnce([]); // 前月
      repository.findByMonth.mockResolvedValueOnce([]); // 前年同月

      const result = await useCase.execute(2024, 1);

      expect(result.month).toBe('2024-01');
      expect(result.income.total).toBe(100000);
      expect(result.income.count).toBe(1);
      expect(result.expense.total).toBe(80000);
      expect(result.expense.count).toBe(2);
      expect(result.balance).toBe(20000);
      expect(result.savingsRate).toBe(20); // (20000 / 100000) * 100
    });

    it('should calculate comparison with previous month', async () => {
      const currentTransactions = [
        createTransaction('tx_1', 100000, CategoryType.INCOME, 'cat_1'),
        createTransaction('tx_2', 50000, CategoryType.EXPENSE, 'cat_2'),
      ];

      const previousMonthTransactions = [
        createTransaction('tx_3', 90000, CategoryType.INCOME, 'cat_1'),
        createTransaction('tx_4', 40000, CategoryType.EXPENSE, 'cat_2'),
      ];

      repository.findByMonth.mockResolvedValueOnce(currentTransactions); // 当月
      repository.findByMonth.mockResolvedValueOnce(previousMonthTransactions); // 前月
      repository.findByMonth.mockResolvedValueOnce([]); // 前年同月

      const result = await useCase.execute(2024, 1);

      expect(result.comparison.previousMonth).not.toBeNull();
      expect(result.comparison.previousMonth?.incomeDiff).toBe(10000);
      expect(result.comparison.previousMonth?.expenseDiff).toBe(10000);
      expect(result.comparison.previousMonth?.balanceDiff).toBe(0);
    });

    it('should return null for comparison when previous month has no data', async () => {
      const currentTransactions = [
        createTransaction('tx_1', 100000, CategoryType.INCOME, 'cat_1'),
      ];

      repository.findByMonth.mockResolvedValueOnce(currentTransactions); // 当月
      repository.findByMonth.mockResolvedValueOnce([]); // 前月
      repository.findByMonth.mockResolvedValueOnce([]); // 前年同月

      const result = await useCase.execute(2024, 1);

      expect(result.comparison.previousMonth).toBeNull();
      expect(result.comparison.sameMonthLastYear).toBeNull();
    });

    it('should calculate savings rate as 0 when income is 0', async () => {
      const currentTransactions = [
        createTransaction('tx_1', 50000, CategoryType.EXPENSE, 'cat_2'),
      ];

      repository.findByMonth.mockResolvedValueOnce(currentTransactions); // 当月
      repository.findByMonth.mockResolvedValueOnce([]); // 前月
      repository.findByMonth.mockResolvedValueOnce([]); // 前年同月

      const result = await useCase.execute(2024, 1);

      expect(result.savingsRate).toBe(0);
    });

    it('should aggregate by categoryId', async () => {
      const currentTransactions = [
        createTransaction('tx_1', 50000, CategoryType.INCOME, 'cat_1'),
        createTransaction('tx_2', 30000, CategoryType.INCOME, 'cat_1'),
        createTransaction('tx_3', 20000, CategoryType.EXPENSE, 'cat_2'),
      ];

      repository.findByMonth.mockResolvedValueOnce(currentTransactions); // 当月
      repository.findByMonth.mockResolvedValueOnce([]); // 前月
      repository.findByMonth.mockResolvedValueOnce([]); // 前年同月

      const result = await useCase.execute(2024, 1);

      expect(result.income.byCategory).toHaveLength(1);
      expect(result.income.byCategory[0].categoryId).toBe('cat_1');
      expect(result.income.byCategory[0].amount).toBe(80000);
      expect(result.income.byCategory[0].count).toBe(2);

      expect(result.expense.byCategory).toHaveLength(1);
      expect(result.expense.byCategory[0].categoryId).toBe('cat_2');
      expect(result.expense.byCategory[0].amount).toBe(20000);
    });

    it('should convert transactions to DTOs', async () => {
      const currentTransactions = [
        createTransaction('tx_1', 100000, CategoryType.INCOME, 'cat_1'),
      ];

      repository.findByMonth.mockResolvedValueOnce(currentTransactions); // 当月
      repository.findByMonth.mockResolvedValueOnce([]); // 前月
      repository.findByMonth.mockResolvedValueOnce([]); // 前年同月

      const result = await useCase.execute(2024, 1);

      expect(result.income.transactions).toHaveLength(1);
      expect(result.income.transactions[0].id).toBe('tx_1');
      expect(result.income.transactions[0].categoryType).toBe(
        CategoryType.INCOME,
      );
      expect(result.income.transactions[0].categoryId).toBe('cat_1');
    });

    it('should handle month !== 1 in getPreviousMonth', async () => {
      const currentTransactions = [
        createTransaction('tx_1', 100000, CategoryType.INCOME, 'cat_1'),
      ];

      repository.findByMonth.mockImplementation((year, month) => {
        if (year === 2024 && month === 2)
          return Promise.resolve(currentTransactions);
        if (year === 2024 && month === 1) return Promise.resolve([]); // 前月（1月）
        if (year === 2023 && month === 2) return Promise.resolve([]); // 前年同月（前年2月）
        return Promise.resolve([]);
      });

      const result = await useCase.execute(2024, 2);

      expect(result.month).toBe('2024-02');
      // 前月は1月（2024, 1）になることを確認
      expect(repository.findByMonth).toHaveBeenCalledWith(2024, 1);
      // 前年同月は前年2月（2023, 2）になることを確認
      expect(repository.findByMonth).toHaveBeenCalledWith(2023, 2);
    });

    it('should handle month === 1 in getPreviousMonth', async () => {
      const currentTransactions = [
        createTransaction('tx_1', 100000, CategoryType.INCOME, 'cat_1'),
      ];

      repository.findByMonth.mockImplementation((year, month) => {
        if (year === 2024 && month === 1)
          return Promise.resolve(currentTransactions);
        if (year === 2023 && month === 12) return Promise.resolve([]); // 前月（前年12月）
        if (year === 2023 && month === 1) return Promise.resolve([]); // 前年同月（前年1月）
        return Promise.resolve([]);
      });

      const result = await useCase.execute(2024, 1);

      expect(result.month).toBe('2024-01');
      // 前月は前年12月（2023, 12）になることを確認
      expect(repository.findByMonth).toHaveBeenCalledWith(2023, 12);
      // 前年同月は前年1月（2023, 1）になることを確認
      expect(repository.findByMonth).toHaveBeenCalledWith(2023, 1);
    });

    it('should calculate comparison with same month last year', async () => {
      const currentTransactions = [
        createTransaction('tx_1', 100000, CategoryType.INCOME, 'cat_1'),
        createTransaction('tx_2', 50000, CategoryType.EXPENSE, 'cat_2'),
      ];

      const sameMonthLastYearTransactions = [
        createTransaction('tx_3', 90000, CategoryType.INCOME, 'cat_1'),
        createTransaction('tx_4', 40000, CategoryType.EXPENSE, 'cat_2'),
      ];

      repository.findByMonth.mockResolvedValueOnce(currentTransactions); // 当月
      repository.findByMonth.mockResolvedValueOnce([]); // 前月
      repository.findByMonth.mockResolvedValueOnce(
        sameMonthLastYearTransactions,
      ); // 前年同月

      const result = await useCase.execute(2024, 1);

      expect(result.comparison.sameMonthLastYear).not.toBeNull();
      expect(result.comparison.sameMonthLastYear?.incomeDiff).toBe(10000);
      expect(result.comparison.sameMonthLastYear?.expenseDiff).toBe(10000);
      expect(result.comparison.sameMonthLastYear?.balanceDiff).toBe(0);
    });
  });
});
