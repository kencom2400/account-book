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

    // パフォーマンス最適化: 取引データを月ごとにグループ化（1回の走査で完了）
    const transactionsByMonth =
      this.groupTransactionsByMonth(yearlyTransactions);

    // 月別サマリーとDTOを一度に構築（非効率な繰り返し処理を回避）
    const monthlySummaries: MonthlySummary[] = [];
    const monthlyDtos: MonthlyBalanceSummaryDto[] = [];

    for (let month = 1; month <= 12; month++) {
      const monthString = `${year}-${String(month).padStart(2, '0')}`;
      const monthlyTransactions = transactionsByMonth.get(month) || [];

      // 収支計算
      const balance =
        this.monthlyBalanceDomainService.calculateBalance(monthlyTransactions);

      monthlySummaries.push({
        month: monthString,
        income: balance.income,
        expense: balance.expense,
        balance: balance.balance,
      });

      // DTOを構築（月ごとの取引データを使用）
      monthlyDtos.push(
        this.buildMonthlySummaryDto(monthString, monthlyTransactions),
      );
    }

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
      months: monthlyDtos,
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
   * 取引データを月ごとにグループ化（パフォーマンス最適化）
   * @param transactions 対象年全体の取引データ
   * @returns 月（1-12）をキーとした取引データのMap
   */
  private groupTransactionsByMonth(
    transactions: TransactionEntity[],
  ): Map<number, TransactionEntity[]> {
    const transactionsByMonth = new Map<number, TransactionEntity[]>();

    // 1月〜12月の初期化
    for (let month = 1; month <= 12; month++) {
      transactionsByMonth.set(month, []);
    }

    // 1回の走査で月ごとにグループ化
    for (const transaction of transactions) {
      const transactionMonth = transaction.date.getMonth() + 1; // getMonth()は0-11を返すため+1
      if (transactionMonth >= 1 && transactionMonth <= 12) {
        // 事前に初期化されているため、get()は必ず配列を返す
        transactionsByMonth.get(transactionMonth)!.push(transaction);
      }
    }

    return transactionsByMonth;
  }

  /**
   * MonthlySummaryDtoを構築
   * @param monthString 月（YYYY-MM形式）
   * @param monthlyTransactions 該当月の取引データ
   * @returns MonthlyBalanceSummaryDto
   */
  private buildMonthlySummaryDto(
    monthString: string,
    monthlyTransactions: TransactionEntity[],
  ): MonthlyBalanceSummaryDto {
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

    // 収支計算
    const balance =
      this.monthlyBalanceDomainService.calculateBalance(monthlyTransactions);

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
    const incomeTotal = balance.income;
    const expenseTotal = balance.expense;

    return {
      month: monthString,
      income: {
        total: incomeTotal,
        count: incomeTransactions.length,
        byCategory: this.buildCategoryBreakdown(
          incomeCategoryAggregation,
          incomeTransactions,
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
          expenseTransactions,
        ),
        byInstitution: this.buildInstitutionBreakdown(
          expenseInstitutionAggregation,
          expenseTotal,
        ),
        transactions: expenseTransactions.map((t) => this.toTransactionDto(t)),
      },
      balance: balance.balance,
      savingsRate: this.monthlyBalanceDomainService.calculateSavingsRate(
        incomeTotal,
        expenseTotal,
      ),
    };
  }

  /**
   * CategoryBreakdownを構築
   * @param aggregation カテゴリ別集計結果
   * @param transactions 取引データ（カテゴリ名取得用）
   */
  private buildCategoryBreakdown(
    aggregation: Map<string, { total: number; count: number }>,
    transactions: TransactionEntity[],
  ): CategoryBreakdown[] {
    const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // カテゴリIDとカテゴリ名のマップを事前に作成（O(N)）
    const categoryMap = new Map<string, string>();
    for (const t of transactions) {
      if (!categoryMap.has(t.category.id)) {
        categoryMap.set(t.category.id, t.category.name);
      }
    }

    const breakdowns: CategoryBreakdown[] = [];

    for (const [categoryId, data] of aggregation.entries()) {
      const categoryName = categoryMap.get(categoryId) || '';

      const percentage = total > 0 ? (Math.abs(data.total) / total) * 100 : 0;

      breakdowns.push({
        categoryId,
        categoryName,
        amount: Math.abs(data.total),
        count: data.count,
        percentage,
      });
    }

    // 金額の降順でソート
    return breakdowns.sort((a, b) => b.amount - a.amount);
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
