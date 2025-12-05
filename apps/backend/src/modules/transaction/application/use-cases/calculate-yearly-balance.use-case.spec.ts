import { Test, TestingModule } from '@nestjs/testing';
import { CategoryType, TransactionStatus } from '@account-book/types';
import { CalculateYearlyBalanceUseCase } from './calculate-yearly-balance.use-case';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { MonthlyBalanceDomainService } from '../../domain/services/monthly-balance-domain.service';
import { YearlyBalanceDomainService } from '../../domain/services/yearly-balance-domain.service';
import { TransactionDomainService } from '../../domain/services/transaction-domain.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';

describe('CalculateYearlyBalanceUseCase', () => {
  let useCase: CalculateYearlyBalanceUseCase;
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
      findByDateRange: jest.fn(),
      findByMonth: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculateYearlyBalanceUseCase,
        MonthlyBalanceDomainService,
        YearlyBalanceDomainService,
        TransactionDomainService,
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: mockRepo,
        },
      ],
    }).compile();

    useCase = module.get<CalculateYearlyBalanceUseCase>(
      CalculateYearlyBalanceUseCase,
    );
    repository = module.get(TRANSACTION_REPOSITORY);
  });

  describe('execute', () => {
    it('should calculate yearly balance with transactions', async () => {
      const transactions = [
        createTransaction(
          'tx_1',
          300000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
          new Date('2024-01-15'),
        ),
        createTransaction(
          'tx_2',
          200000,
          CategoryType.EXPENSE,
          'cat_2',
          'inst_1',
          new Date('2024-01-20'),
        ),
        createTransaction(
          'tx_3',
          300000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
          new Date('2024-02-15'),
        ),
        createTransaction(
          'tx_4',
          180000,
          CategoryType.EXPENSE,
          'cat_2',
          'inst_1',
          new Date('2024-02-20'),
        ),
      ];

      repository.findByDateRange.mockResolvedValueOnce(transactions);

      const result = await useCase.execute(2024);

      expect(result.year).toBe(2024);
      expect(result.months).toHaveLength(12);
      expect(result.months[0].month).toBe('2024-01');
      expect(result.months[0].income.total).toBe(300000);
      expect(result.months[0].expense.total).toBe(200000);
      expect(result.months[0].balance).toBe(100000);
      expect(result.months[1].month).toBe('2024-02');
      expect(result.months[1].income.total).toBe(300000);
      expect(result.months[1].expense.total).toBe(180000);
      expect(result.months[1].balance).toBe(120000);

      // 年間サマリー
      expect(result.annual.totalIncome).toBe(600000);
      expect(result.annual.totalExpense).toBe(380000);
      expect(result.annual.totalBalance).toBe(220000);
      expect(result.annual.averageIncome).toBeCloseTo(50000, 0); // 600000 / 12
      expect(result.annual.averageExpense).toBeCloseTo(31666.67, 0); // 380000 / 12

      // トレンド分析
      expect(result.trend.incomeProgression).toBeDefined();
      expect(result.trend.expenseProgression).toBeDefined();
      expect(result.trend.balanceProgression).toBeDefined();

      // ハイライト
      expect(result.highlights).toBeDefined();
    });

    it('should handle empty transactions', async () => {
      repository.findByDateRange.mockResolvedValueOnce([]);

      const result = await useCase.execute(2024);

      expect(result.year).toBe(2024);
      expect(result.months).toHaveLength(12);
      expect(result.months[0].income.total).toBe(0);
      expect(result.months[0].expense.total).toBe(0);
      expect(result.months[0].balance).toBe(0);
      expect(result.annual.totalIncome).toBe(0);
      expect(result.annual.totalExpense).toBe(0);
      expect(result.annual.totalBalance).toBe(0);
    });

    it('should call findByDateRange with correct date range', async () => {
      repository.findByDateRange.mockResolvedValueOnce([]);

      await useCase.execute(2024);

      expect(repository.findByDateRange).toHaveBeenCalledWith(
        new Date(2024, 0, 1), // 1月1日
        new Date(2024, 11, 31, 23, 59, 59, 999), // 12月31日 23:59:59.999
      );
    });

    it('should aggregate transactions by month correctly', async () => {
      const transactions = [
        createTransaction(
          'tx_1',
          100000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
          new Date('2024-01-15'),
        ),
        createTransaction(
          'tx_2',
          50000,
          CategoryType.EXPENSE,
          'cat_2',
          'inst_1',
          new Date('2024-01-20'),
        ),
        createTransaction(
          'tx_3',
          200000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
          new Date('2024-12-15'),
        ),
        createTransaction(
          'tx_4',
          100000,
          CategoryType.EXPENSE,
          'cat_2',
          'inst_1',
          new Date('2024-12-20'),
        ),
      ];

      repository.findByDateRange.mockResolvedValueOnce(transactions);

      const result = await useCase.execute(2024);

      // 1月のデータ
      expect(result.months[0].month).toBe('2024-01');
      expect(result.months[0].income.total).toBe(100000);
      expect(result.months[0].expense.total).toBe(50000);
      expect(result.months[0].balance).toBe(50000);

      // 12月のデータ
      expect(result.months[11].month).toBe('2024-12');
      expect(result.months[11].income.total).toBe(200000);
      expect(result.months[11].expense.total).toBe(100000);
      expect(result.months[11].balance).toBe(100000);

      // 2月〜11月は空データ
      for (let i = 1; i < 11; i++) {
        expect(result.months[i].income.total).toBe(0);
        expect(result.months[i].expense.total).toBe(0);
        expect(result.months[i].balance).toBe(0);
      }
    });
  });
});
