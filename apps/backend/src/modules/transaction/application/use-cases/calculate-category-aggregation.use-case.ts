import { Inject, Injectable } from '@nestjs/common';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ICategoryRepository } from '../../../category/domain/repositories/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../../../category/domain/repositories/category.repository.interface';
import {
  CategoryAggregationDomainService,
  type SubcategoryAggregationData,
  type TrendData,
} from '../../domain/services/category-aggregation-domain.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { CategoryType } from '@account-book/types';
import type { CategoryEntity } from '../../../category/domain/entities/category.entity';

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
 * SubcategoryAggregationResponseDto
 */
export interface SubcategoryAggregationResponseDto {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
  topTransactions: TransactionDto[];
}

/**
 * TrendDataResponseDto
 */
export interface TrendDataResponseDto {
  monthly: Array<{
    month: string; // YYYY-MM
    amount: number;
    count: number;
  }>;
}

/**
 * CategoryAggregationResponseDto
 */
export interface CategoryAggregationResponseDto {
  categoryType: CategoryType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalAmount: number;
  transactionCount: number;
  subcategories: SubcategoryAggregationResponseDto[];
  percentage: number;
  trend: TrendDataResponseDto;
}

/**
 * CalculateCategoryAggregationUseCase
 * カテゴリ別集計のユースケース
 */
@Injectable()
export class CalculateCategoryAggregationUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    private readonly categoryAggregationDomainService: CategoryAggregationDomainService,
  ) {}

  /**
   * カテゴリ別集計を実行
   */
  async execute(
    startDate: Date,
    endDate: Date,
    categoryType?: CategoryType,
  ): Promise<CategoryAggregationResponseDto[]> {
    // 期間内の取引データを取得
    const transactions = await this.transactionRepository.findByDateRange(
      startDate,
      endDate,
    );

    // categoryTypeが指定されている場合は該当カテゴリのみ、指定されていない場合は全カテゴリ
    const targetCategoryTypes = categoryType
      ? [categoryType]
      : Object.values(CategoryType);

    const results: CategoryAggregationResponseDto[] = [];

    for (const type of targetCategoryTypes) {
      // カテゴリ別集計
      const aggregationResult =
        this.categoryAggregationDomainService.aggregateByCategoryType(
          transactions,
          type,
        );

      // サブカテゴリ別集計
      const subcategoryAggregation =
        this.categoryAggregationDomainService.aggregateBySubcategory(
          transactions,
          type,
        );

      // 推移データ計算
      const trend = this.categoryAggregationDomainService.calculateTrend(
        transactions,
        type,
      );

      // サブカテゴリ内訳構築
      const subcategories = await this.buildSubcategoryAggregation(
        subcategoryAggregation,
        transactions,
        type,
      );

      // レスポンスDTO構築
      results.push({
        categoryType: type,
        startDate: this.formatDate(startDate),
        endDate: this.formatDate(endDate),
        totalAmount: aggregationResult.totalAmount,
        transactionCount: aggregationResult.transactionCount,
        subcategories,
        percentage: aggregationResult.percentage,
        trend: this.toTrendDataResponseDto(trend),
      });
    }

    return results;
  }

  /**
   * サブカテゴリ内訳を構築
   */
  private async buildSubcategoryAggregation(
    aggregation: Map<string, SubcategoryAggregationData>,
    transactions: TransactionEntity[],
    categoryType: CategoryType,
  ): Promise<SubcategoryAggregationResponseDto[]> {
    if (aggregation.size === 0) {
      return [];
    }

    // 必要なcategoryIdをすべて収集
    const categoryIds = Array.from(aggregation.keys());

    // 一括取得（N+1問題対策）
    const categories = await this.categoryRepository.findByIds(categoryIds);

    // カテゴリIDとカテゴリ名のマップを作成
    const categoryMap = new Map<string, CategoryEntity>();
    for (const category of categories) {
      categoryMap.set(category.id, category);
    }

    // 該当カテゴリタイプの取引をサブカテゴリIDでグルーピング
    const transactionsBySubcategory = new Map<string, TransactionEntity[]>();
    transactions
      .filter((t) => t.category.type === categoryType)
      .forEach((t) => {
        const subcategoryId = t.category.id;
        if (!transactionsBySubcategory.has(subcategoryId)) {
          transactionsBySubcategory.set(subcategoryId, []);
        }
        transactionsBySubcategory.get(subcategoryId)!.push(t);
      });

    const result: SubcategoryAggregationResponseDto[] = [];

    for (const [categoryId, data] of Array.from(aggregation.entries())) {
      const category = categoryMap.get(categoryId);
      const categoryName = category?.name || '';

      const subcategoryTransactions =
        transactionsBySubcategory.get(categoryId) || [];

      // 上位取引を取得（最大5件）
      const topTransactions =
        this.categoryAggregationDomainService.getTopTransactions(
          subcategoryTransactions,
          5,
        );

      result.push({
        categoryId,
        categoryName,
        amount: data.amount,
        count: data.count,
        percentage: data.percentage,
        topTransactions: topTransactions.map((t) => this.toTransactionDto(t)),
      });
    }

    // 金額の大きい順にソート
    return result.sort((a, b) => b.amount - a.amount);
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

  /**
   * TrendDataをTrendDataResponseDtoに変換
   */
  private toTrendDataResponseDto(trend: TrendData): TrendDataResponseDto {
    return {
      monthly: trend.monthly.map((m) => ({
        month: m.month,
        amount: m.amount,
        count: m.count,
      })),
    };
  }

  /**
   * DateをYYYY-MM-DD形式の文字列に変換
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
