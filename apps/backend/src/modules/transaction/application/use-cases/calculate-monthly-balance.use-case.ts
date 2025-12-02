import { Inject, Injectable } from '@nestjs/common';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import {
  MonthlyBalanceDomainService,
  type BalanceResult,
  type MonthComparison,
} from '../../domain/services/monthly-balance-domain.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { CategoryType } from '@account-book/types';

/**
 * TransactionDto
 * プレゼンテーション層用のDTO
 */
export interface TransactionDto {
  id: string;
  date: string; // ISO8601形式
  amount: number;
  categoryType: string; // CategoryTypeの文字列値
  categoryId: string;
  institutionId: string;
  accountId: string;
  description: string;
}

/**
 * CategoryBreakdown
 */
export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

/**
 * InstitutionBreakdown
 */
export interface InstitutionBreakdown {
  institutionId: string;
  institutionName: string;
  amount: number;
  count: number;
  percentage: number;
}

/**
 * IncomeExpenseSummary
 */
export interface IncomeExpenseSummary {
  total: number;
  count: number;
  byCategory: CategoryBreakdown[];
  byInstitution: InstitutionBreakdown[];
  transactions: TransactionDto[];
}

/**
 * ComparisonData
 */
export interface ComparisonData {
  previousMonth: MonthComparison | null;
  sameMonthLastYear: MonthComparison | null;
}

/**
 * MonthlyBalanceResponseDto
 */
export interface MonthlyBalanceResponseDto {
  month: string; // YYYY-MM
  income: IncomeExpenseSummary;
  expense: IncomeExpenseSummary;
  balance: number;
  savingsRate: number;
  comparison: ComparisonData;
}

/**
 * CalculateMonthlyBalanceUseCase
 * 月別収支集計のユースケース
 */
@Injectable()
export class CalculateMonthlyBalanceUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    private readonly monthlyBalanceDomainService: MonthlyBalanceDomainService,
  ) {}

  /**
   * 月別収支集計を実行
   */
  async execute(
    year: number,
    month: number,
  ): Promise<MonthlyBalanceResponseDto> {
    // 当月データ取得
    const currentTransactions = await this.transactionRepository.findByMonth(
      year,
      month,
    );

    // 前月データ取得（比較用）
    const { year: prevYear, month: prevMonth } = this.getPreviousMonth(
      year,
      month,
    );
    const previousMonthTransactions =
      await this.transactionRepository.findByMonth(prevYear, prevMonth);

    // 前年同月データ取得（比較用）
    const { year: lastYearYear, month: lastYearMonth } =
      this.getSameMonthLastYear(year, month);
    const sameMonthLastYearTransactions =
      await this.transactionRepository.findByMonth(lastYearYear, lastYearMonth);

    // 収支計算
    const currentBalance =
      this.monthlyBalanceDomainService.calculateBalance(currentTransactions);

    // 収入・支出を分離
    const incomeTransactions = currentTransactions.filter(
      (t) => t.category.type === CategoryType.INCOME,
    );
    const expenseTransactions = currentTransactions.filter(
      (t) => t.category.type === CategoryType.EXPENSE,
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

    // 貯蓄率計算
    const savingsRate = this.monthlyBalanceDomainService.calculateSavingsRate(
      currentBalance.income,
      currentBalance.expense,
    );

    // 前月比計算
    const previousMonthComparison =
      previousMonthTransactions.length > 0
        ? this.calculateComparison(currentBalance, previousMonthTransactions)
        : null;

    // 前年同月比計算
    const sameMonthLastYearComparison =
      sameMonthLastYearTransactions.length > 0
        ? this.calculateComparison(
            currentBalance,
            sameMonthLastYearTransactions,
          )
        : null;

    // カテゴリ別内訳構築
    const incomeByCategory = this.buildCategoryBreakdown(
      incomeCategoryAggregation,
      incomeTransactions,
    );
    const expenseByCategory = this.buildCategoryBreakdown(
      expenseCategoryAggregation,
      expenseTransactions,
    );

    // 金融機関別内訳構築
    const incomeByInstitution = this.buildInstitutionBreakdown(
      incomeInstitutionAggregation,
      incomeTransactions,
    );
    const expenseByInstitution = this.buildInstitutionBreakdown(
      expenseInstitutionAggregation,
      expenseTransactions,
    );

    // 取引明細をDTOに変換
    const incomeTransactionDtos = incomeTransactions.map((t) =>
      this.toTransactionDto(t),
    );
    const expenseTransactionDtos = expenseTransactions.map((t) =>
      this.toTransactionDto(t),
    );

    // レスポンス構築
    const monthString = `${year}-${String(month).padStart(2, '0')}`;

    return {
      month: monthString,
      income: {
        total: currentBalance.income,
        count: incomeTransactions.length,
        byCategory: incomeByCategory,
        byInstitution: incomeByInstitution,
        transactions: incomeTransactionDtos,
      },
      expense: {
        total: currentBalance.expense,
        count: expenseTransactions.length,
        byCategory: expenseByCategory,
        byInstitution: expenseByInstitution,
        transactions: expenseTransactionDtos,
      },
      balance: currentBalance.balance,
      savingsRate,
      comparison: {
        previousMonth: previousMonthComparison,
        sameMonthLastYear: sameMonthLastYearComparison,
      },
    };
  }

  /**
   * 前月の年月を取得
   */
  private getPreviousMonth(
    year: number,
    month: number,
  ): {
    year: number;
    month: number;
  } {
    if (month === 1) {
      return { year: year - 1, month: 12 };
    }
    return { year, month: month - 1 };
  }

  /**
   * 前年同月の年月を取得
   */
  private getSameMonthLastYear(
    year: number,
    month: number,
  ): {
    year: number;
    month: number;
  } {
    return { year: year - 1, month };
  }

  /**
   * 比較データを計算
   */
  private calculateComparison(
    current: BalanceResult,
    previousTransactions: TransactionEntity[],
  ): MonthComparison {
    const previousBalance =
      this.monthlyBalanceDomainService.calculateBalance(previousTransactions);
    return this.monthlyBalanceDomainService.calculateMonthComparison(
      current,
      previousBalance,
    );
  }

  /**
   * カテゴリ別内訳を構築
   */
  private buildCategoryBreakdown(
    aggregation: Map<string, { total: number; count: number }>,
    transactions: TransactionEntity[],
  ): CategoryBreakdown[] {
    const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const breakdowns: CategoryBreakdown[] = [];

    for (const [categoryId, data] of aggregation.entries()) {
      // カテゴリ名を取得（最初の取引から取得）
      const categoryTransaction = transactions.find(
        (t) => t.category.id === categoryId,
      );
      const categoryName = categoryTransaction?.category.name || '';

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
   * 金融機関別内訳を構築
   */
  private buildInstitutionBreakdown(
    aggregation: Map<string, { total: number; count: number }>,
    transactions: TransactionEntity[],
  ): InstitutionBreakdown[] {
    const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const breakdowns: InstitutionBreakdown[] = [];

    for (const [institutionId, data] of aggregation.entries()) {
      // 金融機関名は現時点ではIDを使用（将来的にリポジトリから取得可能）
      const institutionName = institutionId;

      const percentage = total > 0 ? (Math.abs(data.total) / total) * 100 : 0;

      breakdowns.push({
        institutionId,
        institutionName,
        amount: Math.abs(data.total),
        count: data.count,
        percentage,
      });
    }

    // 金額の降順でソート
    return breakdowns.sort((a, b) => b.amount - a.amount);
  }

  /**
   * TransactionEntityをTransactionDtoに変換
   */
  private toTransactionDto(entity: TransactionEntity): TransactionDto {
    return {
      id: entity.id,
      date: entity.date.toISOString(),
      amount: entity.amount,
      categoryType: entity.category.type,
      categoryId: entity.category.id,
      institutionId: entity.institutionId,
      accountId: entity.accountId,
      description: entity.description,
    };
  }
}
