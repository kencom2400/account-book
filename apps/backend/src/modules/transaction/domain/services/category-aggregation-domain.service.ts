import { Injectable } from '@nestjs/common';
import { TransactionEntity } from '../entities/transaction.entity';
import { CategoryType } from '@account-book/types';

/**
 * CategoryAggregationResult Value Object
 */
export interface CategoryAggregationResult {
  category: CategoryType;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

/**
 * SubcategoryAggregationData Value Object
 */
export interface SubcategoryAggregationData {
  subcategoryId: string;
  amount: number;
  count: number;
  percentage: number;
}

/**
 * TrendData Value Object
 */
export interface TrendData {
  monthly: MonthlyTrend[];
}

/**
 * MonthlyTrend Value Object
 */
export interface MonthlyTrend {
  month: string; // YYYY-MM
  amount: number;
  count: number;
}

/**
 * CategoryAggregationDomainService
 * カテゴリ別集計のドメインロジック
 */
@Injectable()
export class CategoryAggregationDomainService {
  /**
   * 指定したカテゴリタイプで集計
   */
  aggregateByCategoryType(
    transactions: TransactionEntity[],
    categoryType: CategoryType,
  ): CategoryAggregationResult {
    const filteredTransactions = transactions.filter(
      (t) => t.category.type === categoryType,
    );

    const totalAmount = filteredTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );
    const transactionCount = filteredTransactions.length;

    // 全体の合計金額を計算（割合計算用）
    const allTotalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const percentage = this.calculatePercentage(totalAmount, allTotalAmount);

    return {
      category: categoryType,
      totalAmount,
      transactionCount,
      percentage,
    };
  }

  /**
   * サブカテゴリ（費目）別に集計
   * @param transactions 取引リスト
   * @param categoryType カテゴリタイプ
   * @returns カテゴリIDをキーとした集計データのMap
   */
  aggregateBySubcategory(
    transactions: TransactionEntity[],
    categoryType: CategoryType,
  ): Map<string, SubcategoryAggregationData> {
    const filteredTransactions = transactions.filter(
      (t) => t.category.type === categoryType,
    );

    const result = new Map<string, SubcategoryAggregationData>();

    // カテゴリタイプの合計金額を計算（割合計算用）
    const categoryTotalAmount = filteredTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );

    for (const transaction of filteredTransactions) {
      const categoryId = transaction.category.id;
      const existing = result.get(categoryId);

      if (existing) {
        existing.amount += transaction.amount;
        existing.count += 1;
      } else {
        result.set(categoryId, {
          subcategoryId: categoryId,
          amount: transaction.amount,
          count: 1,
          percentage: 0, // 後で計算
        });
      }
    }

    // 割合を計算
    for (const data of Array.from(result.values())) {
      data.percentage = this.calculatePercentage(
        data.amount,
        categoryTotalAmount,
      );
    }

    return result;
  }

  /**
   * 構成比を計算
   * @param amount 部分の金額
   * @param total 全体の金額
   * @returns 割合（%）
   */
  calculatePercentage(amount: number, total: number): number {
    if (total === 0) {
      return 0;
    }
    return Math.round((amount / total) * 100 * 10) / 10; // 小数点第1位まで
  }

  /**
   * 期間内の月次推移を計算
   */
  calculateTrend(
    transactions: TransactionEntity[],
    startDate: Date,
    endDate: Date,
  ): TrendData {
    const filteredTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // 月ごとに集計
    const monthlyMap = new Map<string, { amount: number; count: number }>();

    for (const transaction of filteredTransactions) {
      const transactionDate = new Date(transaction.date);
      const month = `${transactionDate.getFullYear()}-${String(
        transactionDate.getMonth() + 1,
      ).padStart(2, '0')}`;

      const existing = monthlyMap.get(month) || { amount: 0, count: 0 };
      existing.amount += transaction.amount;
      existing.count += 1;
      monthlyMap.set(month, existing);
    }

    // Mapを配列に変換してソート
    const monthly: MonthlyTrend[] = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return { monthly };
  }

  /**
   * 金額の大きい取引を取得
   * @param transactions 取引リスト
   * @param limit 取得件数（デフォルト: 5）
   * @returns 金額の大きい順にソートされた取引リスト
   */
  getTopTransactions(
    transactions: TransactionEntity[],
    limit = 5,
  ): TransactionEntity[] {
    return [...transactions]
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, limit);
  }
}
