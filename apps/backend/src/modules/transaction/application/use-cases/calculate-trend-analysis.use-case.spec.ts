import { Test, TestingModule } from '@nestjs/testing';
import { CategoryType, TransactionStatus } from '@account-book/types';
import { CalculateTrendAnalysisUseCase } from './calculate-trend-analysis.use-case';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { MonthlyBalanceDomainService } from '../../domain/services/monthly-balance-domain.service';
import { TrendAnalysisDomainService } from '../../domain/services/trend-analysis-domain.service';
import { TransactionDomainService } from '../../domain/services/transaction-domain.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import {
  TrendTargetType,
  MovingAveragePeriod,
} from '../../presentation/dto/get-trend-analysis.dto';

describe('CalculateTrendAnalysisUseCase', () => {
  let useCase: CalculateTrendAnalysisUseCase;
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
    const mockTransactionRepo = {
      findByDateRange: jest.fn(),
      findByMonth: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculateTrendAnalysisUseCase,
        MonthlyBalanceDomainService,
        TrendAnalysisDomainService,
        TransactionDomainService,
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: mockTransactionRepo,
        },
      ],
    }).compile();

    useCase = module.get<CalculateTrendAnalysisUseCase>(
      CalculateTrendAnalysisUseCase,
    );
    repository = module.get(TRANSACTION_REPOSITORY);
  });

  describe('execute', () => {
    it('should calculate trend analysis for balance with 12 months data', async () => {
      // 12ヶ月分の取引データを作成（2024年1月〜12月）
      const transactions: TransactionEntity[] = [];
      for (let month = 1; month <= 12; month++) {
        const date = new Date(2024, month - 1, 15);
        // 収入: 300,000円
        transactions.push(
          createTransaction(
            `tx_income_${month}`,
            300000,
            CategoryType.INCOME,
            'cat_income',
            'inst_1',
            date,
          ),
        );
        // 支出: 200,000円 + 月ごとに増加
        transactions.push(
          createTransaction(
            `tx_expense_${month}`,
            200000 + month * 10000,
            CategoryType.EXPENSE,
            'cat_expense',
            'inst_1',
            date,
          ),
        );
      }

      repository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(
        2024,
        1,
        2024,
        12,
        TrendTargetType.BALANCE,
        MovingAveragePeriod.SIX_MONTHS,
      );

      expect(result.period.start).toBe('2024-01');
      expect(result.period.end).toBe('2024-12');
      expect(result.targetType).toBe(TrendTargetType.BALANCE);
      expect(result.actual).toHaveLength(12);
      expect(result.movingAverage.period).toBe(6);
      expect(result.movingAverage.data).toHaveLength(12);
      expect(result.trendLine.points).toHaveLength(12);
      expect(result.statistics.mean).toBeGreaterThan(0);
      expect(result.statistics.standardDeviation).toBeGreaterThan(0);
    });

    it('should calculate trend analysis for income', async () => {
      const transactions: TransactionEntity[] = [];
      for (let month = 1; month <= 6; month++) {
        const date = new Date(2024, month - 1, 15);
        // 収入が月ごとに増加
        transactions.push(
          createTransaction(
            `tx_income_${month}`,
            300000 + month * 10000,
            CategoryType.INCOME,
            'cat_income',
            'inst_1',
            date,
          ),
        );
      }

      repository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(
        2024,
        1,
        2024,
        6,
        TrendTargetType.INCOME,
        MovingAveragePeriod.THREE_MONTHS,
      );

      expect(result.targetType).toBe(TrendTargetType.INCOME);
      expect(result.actual).toHaveLength(6);
      expect(result.movingAverage.period).toBe(3);
    });

    it('should calculate trend analysis for expense', async () => {
      const transactions: TransactionEntity[] = [];
      for (let month = 1; month <= 6; month++) {
        const date = new Date(2024, month - 1, 15);
        // 支出が月ごとに増加
        transactions.push(
          createTransaction(
            `tx_expense_${month}`,
            200000 + month * 10000,
            CategoryType.EXPENSE,
            'cat_expense',
            'inst_1',
            date,
          ),
        );
      }

      repository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(
        2024,
        1,
        2024,
        6,
        TrendTargetType.EXPENSE,
        MovingAveragePeriod.THREE_MONTHS,
      );

      expect(result.targetType).toBe(TrendTargetType.EXPENSE);
      expect(result.actual).toHaveLength(6);
    });

    it('should throw error when data is less than 6 months', async () => {
      const transactions: TransactionEntity[] = [];
      for (let month = 1; month <= 5; month++) {
        const date = new Date(2024, month - 1, 15);
        transactions.push(
          createTransaction(
            `tx_${month}`,
            100000,
            CategoryType.INCOME,
            'cat_1',
            'inst_1',
            date,
          ),
        );
      }

      repository.findByDateRange.mockResolvedValue(transactions);

      await expect(
        useCase.execute(2024, 1, 2024, 5, TrendTargetType.BALANCE),
      ).rejects.toThrow('最低6ヶ月分のデータが必要です');
    });

    it('should throw error when start date is after end date', async () => {
      await expect(
        useCase.execute(2024, 12, 2024, 1, TrendTargetType.BALANCE),
      ).rejects.toThrow('開始日が終了日より後です');
    });

    it('should generate insights for increasing expense trend', async () => {
      const transactions: TransactionEntity[] = [];
      for (let month = 1; month <= 12; month++) {
        const date = new Date(2024, month - 1, 15);
        // 支出が継続的に増加
        transactions.push(
          createTransaction(
            `tx_expense_${month}`,
            200000 + month * 10000,
            CategoryType.EXPENSE,
            'cat_expense',
            'inst_1',
            date,
          ),
        );
      }

      repository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(
        2024,
        1,
        2024,
        12,
        TrendTargetType.EXPENSE,
        MovingAveragePeriod.SIX_MONTHS,
      );

      // 支出増加トレンドのインサイトが生成される
      const expenseInsight = result.insights.find(
        (i) => i.title === '支出が増加傾向です',
      );
      expect(expenseInsight).toBeDefined();
      expect(expenseInsight?.severity).toBe('warning');
    });

    it('should generate insights for decreasing income trend', async () => {
      const transactions: TransactionEntity[] = [];
      for (let month = 1; month <= 12; month++) {
        const date = new Date(2024, month - 1, 15);
        // 収入が継続的に減少
        transactions.push(
          createTransaction(
            `tx_income_${month}`,
            300000 - month * 5000,
            CategoryType.INCOME,
            'cat_income',
            'inst_1',
            date,
          ),
        );
      }

      repository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(
        2024,
        1,
        2024,
        12,
        TrendTargetType.INCOME,
        MovingAveragePeriod.SIX_MONTHS,
      );

      // 収入減少トレンドのインサイトが生成される
      const incomeInsight = result.insights.find(
        (i) => i.title === '収入が減少傾向です',
      );
      expect(incomeInsight).toBeDefined();
      expect(incomeInsight?.severity).toBe('warning');
    });

    it('should generate insights for decreasing balance trend', async () => {
      const transactions: TransactionEntity[] = [];
      for (let month = 1; month <= 12; month++) {
        const date = new Date(2024, month - 1, 15);
        // 収入は一定、支出が増加（収支が悪化）
        transactions.push(
          createTransaction(
            `tx_income_${month}`,
            300000,
            CategoryType.INCOME,
            'cat_income',
            'inst_1',
            date,
          ),
        );
        transactions.push(
          createTransaction(
            `tx_expense_${month}`,
            200000 + month * 10000,
            CategoryType.EXPENSE,
            'cat_expense',
            'inst_1',
            date,
          ),
        );
      }

      repository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(
        2024,
        1,
        2024,
        12,
        TrendTargetType.BALANCE,
        MovingAveragePeriod.SIX_MONTHS,
      );

      // 収支悪化トレンドのインサイトが生成される
      const balanceInsight = result.insights.find(
        (i) => i.title === '収支が悪化傾向です',
      );
      expect(balanceInsight).toBeDefined();
      expect(balanceInsight?.severity).toBe('critical');
    });

    it('should handle empty transactions (returns data with zero values)', async () => {
      // 空の取引でも、groupTransactionsByMonthは6ヶ月分のデータを生成する
      // そのため、エラーは発生せず、すべて0の値が返される
      repository.findByDateRange.mockResolvedValue([]);

      const result = await useCase.execute(
        2024,
        1,
        2024,
        6,
        TrendTargetType.BALANCE,
      );

      expect(result.actual).toHaveLength(6);
      expect(result.actual.every((a) => a.value === 0)).toBe(true);
    });

    it('should use default parameters when not provided', async () => {
      const transactions: TransactionEntity[] = [];
      for (let month = 1; month <= 6; month++) {
        const date = new Date(2024, month - 1, 15);
        transactions.push(
          createTransaction(
            `tx_${month}`,
            100000,
            CategoryType.INCOME,
            'cat_1',
            'inst_1',
            date,
          ),
        );
      }

      repository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(2024, 1, 2024, 6);

      // デフォルト値が使用される
      expect(result.targetType).toBe(TrendTargetType.BALANCE);
      expect(result.movingAverage.period).toBe(MovingAveragePeriod.SIX_MONTHS);
    });

    it('should skip transactions outside the target period', async () => {
      const transactions: TransactionEntity[] = [];
      // 対象期間: 2024年1月〜6月
      // 対象期間内の取引
      for (let month = 1; month <= 6; month++) {
        const date = new Date(2024, month - 1, 15);
        transactions.push(
          createTransaction(
            `tx_${month}`,
            100000,
            CategoryType.INCOME,
            'cat_1',
            'inst_1',
            date,
          ),
        );
      }
      // 対象期間外の取引（2023年12月、2024年7月）
      transactions.push(
        createTransaction(
          'tx_outside_1',
          50000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
          new Date(2023, 11, 15), // 2023年12月
        ),
      );
      transactions.push(
        createTransaction(
          'tx_outside_2',
          50000,
          CategoryType.INCOME,
          'cat_1',
          'inst_1',
          new Date(2024, 6, 15), // 2024年7月
        ),
      );

      repository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(
        2024,
        1,
        2024,
        6,
        TrendTargetType.INCOME,
      );

      // 対象期間外の取引は集計されない
      expect(result.actual).toHaveLength(6);
      // 各月の収入は100000円（対象期間外の50000円は含まれない）
      expect(result.actual.every((a) => a.value === 100000)).toBe(true);
    });

    it('should generate insights for high coefficient of variation', async () => {
      const transactions: TransactionEntity[] = [];
      // 変動が大きいデータ（変動係数 > 0.3）
      const amounts = [100000, 500000, 50000, 400000, 80000, 600000];
      for (let month = 1; month <= 6; month++) {
        const date = new Date(2024, month - 1, 15);
        transactions.push(
          createTransaction(
            `tx_${month}`,
            amounts[month - 1] ?? 100000,
            CategoryType.EXPENSE,
            'cat_expense',
            'inst_1',
            date,
          ),
        );
      }

      repository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(
        2024,
        1,
        2024,
        6,
        TrendTargetType.EXPENSE,
        MovingAveragePeriod.THREE_MONTHS,
      );

      // 変動が大きい場合のインサイトが生成される
      const volatilityInsight = result.insights.find(
        (i) => i.title === '変動が大きいです',
      );
      expect(volatilityInsight).toBeDefined();
      expect(volatilityInsight?.severity).toBe('info');
    });

    it('should generate insights for stable trend', async () => {
      const transactions: TransactionEntity[] = [];
      // 安定したデータ（変動が小さい）
      for (let month = 1; month <= 12; month++) {
        const date = new Date(2024, month - 1, 15);
        transactions.push(
          createTransaction(
            `tx_${month}`,
            100000, // すべて同じ値
            CategoryType.INCOME,
            'cat_income',
            'inst_1',
            date,
          ),
        );
      }

      repository.findByDateRange.mockResolvedValue(transactions);

      const result = await useCase.execute(
        2024,
        1,
        2024,
        12,
        TrendTargetType.INCOME,
        MovingAveragePeriod.SIX_MONTHS,
      );

      // 安定した傾向のインサイトが生成される
      const stableInsight = result.insights.find(
        (i) => i.title === '安定した傾向です',
      );
      expect(stableInsight).toBeDefined();
      expect(stableInsight?.severity).toBe('info');
    });
  });
});
