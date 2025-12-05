import { Inject, Injectable } from '@nestjs/common';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import { MonthlyBalanceDomainService } from '../../domain/services/monthly-balance-domain.service';
import {
  YearlyBalanceDomainService,
  type TrendAnalysis,
  type MonthlySummary,
} from '../../domain/services/yearly-balance-domain.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { CategoryType } from '@account-book/types';
import type {
  IncomeExpenseSummary,
  CategoryBreakdown,
  InstitutionBreakdown,
  TransactionDto,
} from './calculate-monthly-balance.use-case';

/**
 * MonthlyBalanceSummaryDto
 * 年間集計用の簡略版DTO（comparisonフィールドなし）
 */
export interface MonthlyBalanceSummaryDto {
  month: string; // YYYY-MM
  income: IncomeExpenseSummary;
  expense: IncomeExpenseSummary;
  balance: number;
  savingsRate: number;
}

/**
 * TrendAnalysisDto
 * Presentation層のDTO（Domain層のTrendAnalysisとは別物）
 */
export interface TrendAnalysisDto {
  direction: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  standardDeviation: number;
}

/**
 * AnnualSummaryData
 */
export interface AnnualSummaryData {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  averageIncome: number;
  averageExpense: number;
  savingsRate: number;
}

/**
 * TrendData
 */
export interface TrendData {
  incomeProgression: TrendAnalysisDto;
  expenseProgression: TrendAnalysisDto;
  balanceProgression: TrendAnalysisDto;
}

/**
 * HighlightsData
 */
export interface HighlightsData {
  maxIncomeMonth: string | null;
  maxExpenseMonth: string | null;
  bestBalanceMonth: string | null;
  worstBalanceMonth: string | null;
}

/**
 * YearlyBalanceResponseDto
 */
export interface YearlyBalanceResponseDto {
  year: number;
  months: MonthlyBalanceSummaryDto[];
  annual: AnnualSummaryData;
  trend: TrendData;
  highlights: HighlightsData;
}

/**
 * CalculateYearlyBalanceUseCase
 * 年間収支推移表示のユースケース
 */
@Injectable()
export class CalculateYearlyBalanceUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    private readonly monthlyBalanceDomainService: MonthlyBalanceDomainService,
    private readonly yearlyBalanceDomainService: YearlyBalanceDomainService,
  ) {}

  /**
   * 年間収支推移を実行
   */
  async execute(year: number): Promise<YearlyBalanceResponseDto> {
    // 対象年全体の取引データを一度に取得
    const startDate = new Date(year, 0, 1); // 1月1日
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // 12月31日 23:59:59.999
    const yearlyTransactions = await this.transactionRepository.findByDateRange(
      startDate,
      endDate,
    );

    // メモリ上で月別に集計
    const monthlySummaries = this.aggregateByMonth(yearlyTransactions, year);

    // 年間サマリーを計算
    const annualSummary =
      this.yearlyBalanceDomainService.calculateAnnualSummary(monthlySummaries);

    // トレンド分析
    const incomeAmounts = monthlySummaries.map((m) => m.income);
    const expenseAmounts = monthlySummaries.map((m) => m.expense);
    const balanceAmounts = monthlySummaries.map((m) => m.balance);

    const incomeTrend =
      this.yearlyBalanceDomainService.analyzeTrend(incomeAmounts);
    const expenseTrend =
      this.yearlyBalanceDomainService.analyzeTrend(expenseAmounts);
    const balanceTrend =
      this.yearlyBalanceDomainService.analyzeTrend(balanceAmounts);

    // ハイライト情報を抽出
    const highlights =
      this.yearlyBalanceDomainService.extractHighlights(monthlySummaries);

    // DTOを構築
    return {
      year,
      months: monthlySummaries.map((summary) =>
        this.buildMonthlySummaryDto(summary, yearlyTransactions),
      ),
      annual: {
        totalIncome: annualSummary.totalIncome,
        totalExpense: annualSummary.totalExpense,
        totalBalance: annualSummary.totalBalance,
        averageIncome: annualSummary.averageIncome,
        averageExpense: annualSummary.averageExpense,
        savingsRate: annualSummary.savingsRate,
      },
      trend: {
        incomeProgression: this.toTrendAnalysisDto(incomeTrend),
        expenseProgression: this.toTrendAnalysisDto(expenseTrend),
        balanceProgression: this.toTrendAnalysisDto(balanceTrend),
      },
      highlights: {
        maxIncomeMonth: highlights.maxIncomeMonth,
        maxExpenseMonth: highlights.maxExpenseMonth,
        bestBalanceMonth: highlights.bestBalanceMonth,
        worstBalanceMonth: highlights.worstBalanceMonth,
      },
    };
  }

  /**
   * メモリ上で月別に集計
   * @param transactions 対象年全体の取引データ
   * @param year 年
   * @returns 月別サマリーの配列（12ヶ月分）
   */
  private aggregateByMonth(
    transactions: TransactionEntity[],
    year: number,
  ): MonthlySummary[] {
    const monthlySummaries: MonthlySummary[] = [];

    // 1月〜12月をループ
    for (let month = 1; month <= 12; month++) {
      const monthString = `${year}-${String(month).padStart(2, '0')}`;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // 月の最終日

      // 該当月の取引をフィルタリング
      const monthlyTransactions = transactions.filter(
        (t) => t.date >= startDate && t.date <= endDate,
      );

      // 収支計算
      const balance =
        this.monthlyBalanceDomainService.calculateBalance(monthlyTransactions);

      monthlySummaries.push({
        month: monthString,
        income: balance.income,
        expense: balance.expense,
        balance: balance.balance,
      });
    }

    return monthlySummaries;
  }

  /**
   * MonthlySummaryDtoを構築
   * @param summary 月別サマリー
   * @param allTransactions 対象年全体の取引データ（カテゴリ別・金融機関別集計用）
   * @returns MonthlyBalanceSummaryDto
   */
  private buildMonthlySummaryDto(
    summary: MonthlySummary,
    allTransactions: TransactionEntity[],
  ): MonthlyBalanceSummaryDto {
    const [year, month] = summary.month.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 該当月の取引をフィルタリング
    const monthlyTransactions = allTransactions.filter(
      (t) => t.date >= startDate && t.date <= endDate,
    );

    // 収入・支出を分離
    const { incomeTransactions, expenseTransactions } =
      monthlyTransactions.reduce(
        (acc, t) => {
          if (t.category.type === CategoryType.INCOME) {
            acc.incomeTransactions.push(t);
          } else if (t.category.type === CategoryType.EXPENSE) {
            acc.expenseTransactions.push(t);
          }
          return acc;
        },
        {
          incomeTransactions: [] as TransactionEntity[],
          expenseTransactions: [] as TransactionEntity[],
        },
      );

    // カテゴリ別集計
    const incomeCategoryAggregation =
      this.monthlyBalanceDomainService.aggregateByCategory(incomeTransactions);
    const expenseCategoryAggregation =
      this.monthlyBalanceDomainService.aggregateByCategory(expenseTransactions);

    // 金融機関別集計
    const incomeInstitutionAggregation =
      this.monthlyBalanceDomainService.aggregateByInstitution(
        incomeTransactions,
      );
    const expenseInstitutionAggregation =
      this.monthlyBalanceDomainService.aggregateByInstitution(
        expenseTransactions,
      );

    // DTOを構築
    const incomeTotal = summary.income;
    const expenseTotal = summary.expense;

    return {
      month: summary.month,
      income: {
        total: incomeTotal,
        count: incomeTransactions.length,
        byCategory: this.buildCategoryBreakdown(
          incomeCategoryAggregation,
          incomeTotal,
        ),
        byInstitution: this.buildInstitutionBreakdown(
          incomeInstitutionAggregation,
          incomeTotal,
        ),
        transactions: incomeTransactions.map((t) => this.toTransactionDto(t)),
      },
      expense: {
        total: expenseTotal,
        count: expenseTransactions.length,
        byCategory: this.buildCategoryBreakdown(
          expenseCategoryAggregation,
          expenseTotal,
        ),
        byInstitution: this.buildInstitutionBreakdown(
          expenseInstitutionAggregation,
          expenseTotal,
        ),
        transactions: expenseTransactions.map((t) => this.toTransactionDto(t)),
      },
      balance: summary.balance,
      savingsRate: this.monthlyBalanceDomainService.calculateSavingsRate(
        incomeTotal,
        expenseTotal,
      ),
    };
  }

  /**
   * CategoryBreakdownを構築
   */
  private buildCategoryBreakdown(
    aggregation: Map<string, { total: number; count: number }>,
    total: number,
  ): CategoryBreakdown[] {
    return Array.from(aggregation.entries()).map(([categoryId, data]) => ({
      categoryId,
      categoryName: `Category ${categoryId}`, // TODO: カテゴリ名を取得する実装が必要
      amount: data.total,
      count: data.count,
      percentage: total > 0 ? (data.total / total) * 100 : 0,
    }));
  }

  /**
   * InstitutionBreakdownを構築
   */
  private buildInstitutionBreakdown(
    aggregation: Map<string, { total: number; count: number }>,
    total: number,
  ): InstitutionBreakdown[] {
    return Array.from(aggregation.entries()).map(([institutionId, data]) => ({
      institutionId,
      institutionName: `Institution ${institutionId}`, // TODO: 金融機関名を取得する実装が必要
      amount: data.total,
      count: data.count,
      percentage: total > 0 ? (data.total / total) * 100 : 0,
    }));
  }

  /**
   * TransactionEntityをTransactionDtoに変換
   */
  private toTransactionDto(transaction: TransactionEntity): TransactionDto {
    return {
      id: transaction.id,
      date: transaction.date.toISOString(),
      amount: transaction.amount,
      categoryType: transaction.category.type,
      categoryId: transaction.category.id,
      institutionId: transaction.institutionId,
      accountId: transaction.accountId,
      description: transaction.description,
    };
  }

  /**
   * Domain層のTrendAnalysisをDTOに変換
   */
  private toTrendAnalysisDto(trend: TrendAnalysis): TrendAnalysisDto {
    return {
      direction: trend.direction,
      changeRate: trend.changeRate,
      standardDeviation: trend.standardDeviation,
    };
  }
}
