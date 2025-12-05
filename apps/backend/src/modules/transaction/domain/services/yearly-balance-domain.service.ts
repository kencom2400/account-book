import { Injectable } from '@nestjs/common';
import { MonthlyBalanceDomainService } from './monthly-balance-domain.service';

/**
 * AnnualSummary Value Object
 */
export interface AnnualSummary {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  averageIncome: number;
  averageExpense: number;
  savingsRate: number;
}

/**
 * TrendAnalysis Value Object (Domain層)
 */
export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // 傾き（線形回帰の係数）を100倍した値
  standardDeviation: number;
}

/**
 * Highlights Value Object
 */
export interface Highlights {
  maxIncomeMonth: string | null;
  maxExpenseMonth: string | null;
  bestBalanceMonth: string | null;
  worstBalanceMonth: string | null;
}

/**
 * MonthlySummary Value Object
 * 年間集計用の月別サマリー
 */
export interface MonthlySummary {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  balance: number;
}

/**
 * YearlyBalanceDomainService
 * 年間収支集計のドメインロジック
 */
@Injectable()
export class YearlyBalanceDomainService {
  constructor(
    private readonly monthlyBalanceDomainService: MonthlyBalanceDomainService,
  ) {}

  /**
   * 年間サマリーを計算
   * @param monthlySummaries 月別サマリーの配列（12ヶ月分）
   * @returns 年間サマリー
   */
  calculateAnnualSummary(monthlySummaries: MonthlySummary[]): AnnualSummary {
    const totalIncome = monthlySummaries.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = monthlySummaries.reduce(
      (sum, m) => sum + m.expense,
      0,
    );
    const totalBalance = totalIncome - totalExpense;
    const monthCount = monthlySummaries.length || 12; // 12ヶ月分を想定

    const averageIncome = totalIncome / monthCount;
    const averageExpense = totalExpense / monthCount;

    const savingsRate = this.monthlyBalanceDomainService.calculateSavingsRate(
      totalIncome,
      totalExpense,
    );

    return {
      totalIncome,
      totalExpense,
      totalBalance,
      averageIncome,
      averageExpense,
      savingsRate,
    };
  }

  /**
   * トレンド分析を実行
   * @param monthlyAmounts 月別の金額配列（12ヶ月分）
   * @returns トレンド分析結果
   */
  analyzeTrend(monthlyAmounts: number[]): TrendAnalysis {
    if (monthlyAmounts.length === 0) {
      return {
        direction: 'stable',
        changeRate: 0,
        standardDeviation: 0,
      };
    }

    const slope = this.calculateSlope(monthlyAmounts);
    const standardDeviation = this.calculateStandardDeviation(monthlyAmounts);

    // 傾きの符号で方向を判定
    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(slope) < 0.01) {
      // 傾きがほぼ0の場合はstable
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    return {
      direction,
      changeRate: slope * 100, // パーセンテージに変換
      standardDeviation,
    };
  }

  /**
   * ハイライト情報を抽出
   * @param monthlySummaries 月別サマリーの配列（12ヶ月分）
   * @returns ハイライト情報
   */
  extractHighlights(monthlySummaries: MonthlySummary[]): Highlights {
    if (monthlySummaries.length === 0) {
      return {
        maxIncomeMonth: null,
        maxExpenseMonth: null,
        bestBalanceMonth: null,
        worstBalanceMonth: null,
      };
    }

    // 最大収入月
    const maxIncomeMonth = monthlySummaries.reduce((max, current) =>
      current.income > max.income ? current : max,
    );

    // 最大支出月
    const maxExpenseMonth = monthlySummaries.reduce((max, current) =>
      current.expense > max.expense ? current : max,
    );

    // 最高収支月（収支が最大）
    const bestBalanceMonth = monthlySummaries.reduce((max, current) =>
      current.balance > max.balance ? current : max,
    );

    // 最低収支月（収支が最小）
    const worstBalanceMonth = monthlySummaries.reduce((min, current) =>
      current.balance < min.balance ? current : min,
    );

    return {
      maxIncomeMonth: maxIncomeMonth.income > 0 ? maxIncomeMonth.month : null,
      maxExpenseMonth:
        maxExpenseMonth.expense > 0 ? maxExpenseMonth.month : null,
      bestBalanceMonth:
        bestBalanceMonth.balance > Number.NEGATIVE_INFINITY
          ? bestBalanceMonth.month
          : null,
      worstBalanceMonth:
        worstBalanceMonth.balance < Number.POSITIVE_INFINITY
          ? worstBalanceMonth.month
          : null,
    };
  }

  /**
   * 線形回帰の傾きを計算
   * @param monthlyAmounts 月別の金額配列
   * @returns 傾き（線形回帰の係数）
   */
  calculateSlope(monthlyAmounts: number[]): number {
    if (monthlyAmounts.length === 0) {
      return 0;
    }

    const n = monthlyAmounts.length;
    const x = Array.from({ length: n }, (_, i) => i + 1); // 1, 2, 3, ..., n

    // 平均値
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = monthlyAmounts.reduce((sum, val) => sum + val, 0) / n;

    // 傾きの計算: Σ(xi - x̄)(yi - ȳ) / Σ(xi - x̄)²
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = monthlyAmounts[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }

    if (denominator === 0) {
      return 0;
    }

    return numerator / denominator;
  }

  /**
   * 標準偏差を計算
   * @param monthlyAmounts 月別の金額配列
   * @returns 標準偏差
   */
  calculateStandardDeviation(monthlyAmounts: number[]): number {
    if (monthlyAmounts.length === 0) {
      return 0;
    }

    const n = monthlyAmounts.length;
    const mean = monthlyAmounts.reduce((sum, val) => sum + val, 0) / n;

    // 分散を計算
    const variance =
      monthlyAmounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;

    // 標準偏差 = √分散
    return Math.sqrt(variance);
  }
}
