import { Test, TestingModule } from '@nestjs/testing';
import { YearlyBalanceDomainService } from './yearly-balance-domain.service';
import { MonthlyBalanceDomainService } from './monthly-balance-domain.service';
import { TransactionDomainService } from './transaction-domain.service';
import type { MonthlySummary } from './yearly-balance-domain.service';

describe('YearlyBalanceDomainService', () => {
  let service: YearlyBalanceDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YearlyBalanceDomainService,
        MonthlyBalanceDomainService,
        TransactionDomainService,
      ],
    }).compile();

    service = module.get<YearlyBalanceDomainService>(
      YearlyBalanceDomainService,
    );
  });

  describe('calculateAnnualSummary', () => {
    it('should calculate annual summary correctly', () => {
      const monthlySummaries: MonthlySummary[] = [
        { month: '2024-01', income: 300000, expense: 200000, balance: 100000 },
        { month: '2024-02', income: 300000, expense: 180000, balance: 120000 },
        { month: '2024-03', income: 300000, expense: 220000, balance: 80000 },
      ];

      const result = service.calculateAnnualSummary(monthlySummaries);

      expect(result.totalIncome).toBe(900000);
      expect(result.totalExpense).toBe(600000);
      expect(result.totalBalance).toBe(300000);
      expect(result.averageIncome).toBe(300000);
      expect(result.averageExpense).toBe(200000);
      expect(result.savingsRate).toBeCloseTo(33.33, 2);
    });

    it('should handle empty monthly summaries', () => {
      const monthlySummaries: MonthlySummary[] = [];

      const result = service.calculateAnnualSummary(monthlySummaries);

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.totalBalance).toBe(0);
      expect(result.averageIncome).toBe(0);
      expect(result.averageExpense).toBe(0);
      expect(result.savingsRate).toBe(0);
    });

    it('should calculate savings rate as 0 when total income is 0', () => {
      const monthlySummaries: MonthlySummary[] = [
        { month: '2024-01', income: 0, expense: 100000, balance: -100000 },
      ];

      const result = service.calculateAnnualSummary(monthlySummaries);

      expect(result.savingsRate).toBe(0);
    });
  });

  describe('analyzeTrend', () => {
    it('should detect increasing trend', () => {
      const monthlyAmounts = [100000, 110000, 120000, 130000, 140000];

      const result = service.analyzeTrend(monthlyAmounts);

      expect(result.direction).toBe('increasing');
      expect(result.changeRate).toBeGreaterThan(0);
    });

    it('should detect decreasing trend', () => {
      const monthlyAmounts = [140000, 130000, 120000, 110000, 100000];

      const result = service.analyzeTrend(monthlyAmounts);

      expect(result.direction).toBe('decreasing');
      expect(result.changeRate).toBeLessThan(0);
    });

    it('should detect stable trend', () => {
      const monthlyAmounts = [100000, 100000, 100000, 100000, 100000];

      const result = service.analyzeTrend(monthlyAmounts);

      expect(result.direction).toBe('stable');
      expect(Math.abs(result.changeRate)).toBeLessThan(0.01);
    });

    it('should handle empty array', () => {
      const monthlyAmounts: number[] = [];

      const result = service.analyzeTrend(monthlyAmounts);

      expect(result.direction).toBe('stable');
      expect(result.changeRate).toBe(0);
      expect(result.standardDeviation).toBe(0);
    });
  });

  describe('extractHighlights', () => {
    it('should extract highlights correctly', () => {
      const monthlySummaries: MonthlySummary[] = [
        { month: '2024-01', income: 300000, expense: 200000, balance: 100000 },
        { month: '2024-02', income: 350000, expense: 180000, balance: 170000 },
        { month: '2024-03', income: 250000, expense: 250000, balance: 0 },
        { month: '2024-04', income: 300000, expense: 300000, balance: 0 },
      ];

      const result = service.extractHighlights(monthlySummaries);

      expect(result.maxIncomeMonth).toBe('2024-02');
      expect(result.maxExpenseMonth).toBe('2024-04');
      expect(result.bestBalanceMonth).toBe('2024-02');
      expect(result.worstBalanceMonth).toBe('2024-03');
    });

    it('should return null for highlights when all values are zero', () => {
      const monthlySummaries: MonthlySummary[] = [
        { month: '2024-01', income: 0, expense: 0, balance: 0 },
        { month: '2024-02', income: 0, expense: 0, balance: 0 },
      ];

      const result = service.extractHighlights(monthlySummaries);

      expect(result.maxIncomeMonth).toBeNull();
      expect(result.maxExpenseMonth).toBeNull();
    });

    it('should handle empty array', () => {
      const monthlySummaries: MonthlySummary[] = [];

      const result = service.extractHighlights(monthlySummaries);

      expect(result.maxIncomeMonth).toBeNull();
      expect(result.maxExpenseMonth).toBeNull();
      expect(result.bestBalanceMonth).toBeNull();
      expect(result.worstBalanceMonth).toBeNull();
    });
  });

  describe('calculateSlope', () => {
    it('should calculate positive slope for increasing trend', () => {
      const monthlyAmounts = [100000, 110000, 120000, 130000, 140000];

      const result = service.calculateSlope(monthlyAmounts);

      expect(result).toBeGreaterThan(0);
    });

    it('should calculate negative slope for decreasing trend', () => {
      const monthlyAmounts = [140000, 130000, 120000, 110000, 100000];

      const result = service.calculateSlope(monthlyAmounts);

      expect(result).toBeLessThan(0);
    });

    it('should return 0 for constant values', () => {
      const monthlyAmounts = [100000, 100000, 100000, 100000, 100000];

      const result = service.calculateSlope(monthlyAmounts);

      expect(result).toBe(0);
    });

    it('should handle empty array', () => {
      const monthlyAmounts: number[] = [];

      const result = service.calculateSlope(monthlyAmounts);

      expect(result).toBe(0);
    });
  });

  describe('calculateStandardDeviation', () => {
    it('should calculate standard deviation correctly', () => {
      const monthlyAmounts = [100000, 110000, 120000, 130000, 140000];

      const result = service.calculateStandardDeviation(monthlyAmounts);

      expect(result).toBeGreaterThan(0);
      // 標準偏差は約14142（実際の計算結果）
      expect(result).toBeCloseTo(14142, 0);
    });

    it('should return 0 for constant values', () => {
      const monthlyAmounts = [100000, 100000, 100000, 100000, 100000];

      const result = service.calculateStandardDeviation(monthlyAmounts);

      expect(result).toBe(0);
    });

    it('should handle empty array', () => {
      const monthlyAmounts: number[] = [];

      const result = service.calculateStandardDeviation(monthlyAmounts);

      expect(result).toBe(0);
    });
  });
});
