import { Injectable } from '@nestjs/common';
import { TransactionEntity } from '../entities/transaction.entity';
import type { CategoryEntity } from '../../../category/domain/entities/category.entity';
import { TrendData, MonthlyTrend } from './category-aggregation-domain.service';

/**
 * SubcategoryAggregationResult Value Object
 * 費目別集計結果を表現（階層構造を含む）
 */
export interface SubcategoryAggregationResult {
  itemId: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  percentage: number;
  children: SubcategoryAggregationResult[];
}

/**
 * SubcategoryAggregationDomainService
 * 費目別集計のドメインロジック
 */
@Injectable()
export class SubcategoryAggregationDomainService {
  /**
   * 費目別に集計
   * @param transactions 取引リスト（UseCaseで既にフィルタリング済み）
   * @returns カテゴリIDをキーとした集計データのMap
   */
  aggregateBySubcategory(
    transactions: TransactionEntity[],
  ): Map<string, SubcategoryAggregationResult> {
    const result = new Map<string, SubcategoryAggregationResult>();

    // 全体の合計金額を計算（割合計算用）
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    for (const transaction of transactions) {
      const categoryId = transaction.category.id;
      const existing = result.get(categoryId);

      if (existing) {
        existing.totalAmount += transaction.amount;
        existing.transactionCount += 1;
        existing.averageAmount = this.calculateAverage(
          existing.totalAmount,
          existing.transactionCount,
        );
        existing.percentage = this.calculatePercentage(
          existing.totalAmount,
          totalAmount,
        );
      } else {
        result.set(categoryId, {
          itemId: categoryId,
          totalAmount: transaction.amount,
          transactionCount: 1,
          averageAmount: transaction.amount,
          percentage: this.calculatePercentage(transaction.amount, totalAmount),
          children: [],
        });
      }
    }

    return result;
  }

  /**
   * 階層構造で集計（親子関係を考慮）
   * @param transactions 取引リスト
   * @param categories カテゴリエンティティの配列
   * @returns 階層構造を含む集計結果の配列
   */
  aggregateHierarchy(
    transactions: TransactionEntity[],
    categories: CategoryEntity[],
  ): SubcategoryAggregationResult[] {
    // カテゴリをMapに変換（IDで高速検索）
    const categoryMap = new Map<string, CategoryEntity>();
    for (const category of categories) {
      categoryMap.set(category.id, category);
    }

    // 費目別に集計
    const aggregation = this.aggregateBySubcategory(transactions);

    // 階層構造を構築
    const rootCategories: SubcategoryAggregationResult[] = [];
    const categoryResults = new Map<string, SubcategoryAggregationResult>();

    // まず、すべてのカテゴリの結果を作成
    for (const [categoryId] of categoryMap.entries()) {
      const aggregationData = aggregation.get(categoryId);
      const result: SubcategoryAggregationResult = {
        itemId: categoryId,
        totalAmount: aggregationData?.totalAmount ?? 0,
        transactionCount: aggregationData?.transactionCount ?? 0,
        averageAmount: aggregationData?.averageAmount ?? 0,
        percentage: aggregationData?.percentage ?? 0,
        children: [],
      };
      categoryResults.set(categoryId, result);
    }

    // 親子関係を構築
    for (const [categoryId, category] of categoryMap.entries()) {
      const result = categoryResults.get(categoryId)!;

      if (category.parentId === null) {
        // ルートカテゴリ
        rootCategories.push(result);
      } else {
        // 子カテゴリ
        const parentResult = categoryResults.get(category.parentId);
        if (parentResult) {
          parentResult.children.push(result);
          // 親の集計に子の集計を加算
          parentResult.totalAmount += result.totalAmount;
          parentResult.transactionCount += result.transactionCount;
        }
      }
    }

    // 親の平均金額と割合を再計算
    // totalAmountはループ内で変化しないため、ループの外で一度だけ計算
    const totalAmount = Array.from(aggregation.values()).reduce(
      (sum, data) => sum + data.totalAmount,
      0,
    );
    for (const result of categoryResults.values()) {
      if (result.children.length > 0) {
        result.averageAmount = this.calculateAverage(
          result.totalAmount,
          result.transactionCount,
        );
        result.percentage = this.calculatePercentage(
          result.totalAmount,
          totalAmount,
        );
      }
    }

    return rootCategories;
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
   * 平均金額を計算
   * @param amount 合計金額
   * @param count 取引件数
   * @returns 平均金額
   */
  calculateAverage(amount: number, count: number): number {
    if (count === 0) {
      return 0;
    }
    return Math.round(amount / count);
  }

  /**
   * 期間内の月次推移を計算
   * @param transactions 取引リスト（UseCaseで既に期間でフィルタリング済み）
   * @param _startDate 開始日（互換性のため保持、使用しない）
   * @param _endDate 終了日（互換性のため保持、使用しない）
   * @returns 推移データ
   */
  calculateTrend(
    transactions: TransactionEntity[],
    _startDate: Date,
    _endDate: Date,
  ): TrendData {
    // 期間内の取引は既にフィルタリング済み

    // 月ごとに集計
    const monthlyMap = new Map<string, { amount: number; count: number }>();

    for (const transaction of transactions) {
      const month = `${transaction.date.getFullYear()}-${String(
        transaction.date.getMonth() + 1,
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
