import { Inject, Injectable } from '@nestjs/common';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ICategoryRepository } from '../../../category/domain/repositories/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../../../category/domain/repositories/category.repository.interface';
import {
  SubcategoryAggregationDomainService,
  type SubcategoryAggregationResult,
} from '../../domain/services/subcategory-aggregation-domain.service';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { CategoryType } from '@account-book/types';
import type { CategoryEntity } from '../../../category/domain/entities/category.entity';
import type {
  SubcategoryAggregationResponseDto,
  ExpenseItemSummary,
  TransactionDto,
} from '../../presentation/dto/get-subcategory-aggregation.dto';

/**
 * CalculateSubcategoryAggregationUseCase
 * 費目別集計のユースケース
 */
@Injectable()
export class CalculateSubcategoryAggregationUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    private readonly subcategoryAggregationDomainService: SubcategoryAggregationDomainService,
  ) {}

  /**
   * 費目別集計を実行
   */
  async execute(
    startDate: Date,
    endDate: Date,
    categoryType?: CategoryType,
    itemId?: string,
  ): Promise<SubcategoryAggregationResponseDto> {
    // カテゴリ情報を取得（取引取得前に取得して再利用）
    let categories: CategoryEntity[];
    if (itemId) {
      // 特定費目IDが指定された場合、該当カテゴリとその子カテゴリのみ取得
      const category = await this.categoryRepository.findById(itemId);
      if (!category) {
        // 存在しない場合は空データを返す（200 OK）
        return this.createEmptyResponse(startDate, endDate);
      }
      const children = await this.categoryRepository.findByParentId(itemId);
      categories = [category, ...children];
    } else if (categoryType) {
      // 特定カテゴリタイプが指定された場合
      categories = await this.categoryRepository.findByType(categoryType);
    } else {
      // 全費目集計の場合、すべてのカテゴリを取得（N+1問題回避）
      categories = await this.categoryRepository.findAll();
    }

    // 取引データを取得
    let transactions: TransactionEntity[];
    if (itemId) {
      // 特定費目IDが指定された場合
      const categoryIds = categories.map((c) => c.id);
      transactions =
        await this.transactionRepository.findByCategoryIdsAndDateRange(
          categoryIds,
          startDate,
          endDate,
        );
    } else if (categoryType) {
      // 特定カテゴリタイプが指定された場合
      transactions = await this.transactionRepository.findByCategoryType(
        categoryType,
        startDate,
        endDate,
      );
    } else {
      // 全費目集計の場合
      transactions = await this.transactionRepository.findByDateRange(
        startDate,
        endDate,
      );
    }

    // 費目別集計（階層構造を考慮）
    const aggregationResults =
      this.subcategoryAggregationDomainService.aggregateHierarchy(
        transactions,
        categories,
      );

    // 階層構造を構築してDTOに変換
    const items = this.buildHierarchy(
      aggregationResults,
      categories,
      transactions,
      startDate,
      endDate,
    );

    // 全体の合計金額と取引件数を計算
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalTransactionCount = transactions.length;

    return {
      items,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      totalAmount,
      totalTransactionCount,
    };
  }

  /**
   * 階層構造を構築してDTOに変換
   */
  private buildHierarchy(
    aggregationResults: SubcategoryAggregationResult[],
    categories: CategoryEntity[],
    transactions: TransactionEntity[],
    startDate: Date,
    endDate: Date,
  ): ExpenseItemSummary[] {
    // カテゴリIDとカテゴリエンティティのマップを作成
    const categoryMap = new Map<string, CategoryEntity>();
    for (const category of categories) {
      categoryMap.set(category.id, category);
    }

    // カテゴリIDごとの取引をマッピング
    const transactionsByCategoryId = new Map<string, TransactionEntity[]>();
    for (const transaction of transactions) {
      const categoryId = transaction.category.id;
      if (!transactionsByCategoryId.has(categoryId)) {
        transactionsByCategoryId.set(categoryId, []);
      }
      transactionsByCategoryId.get(categoryId)!.push(transaction);
    }

    // 階層構造を再帰的に構築
    const buildItem = (
      result: SubcategoryAggregationResult,
      parentId: string | null,
    ): ExpenseItemSummary => {
      // categoryMapはaggregationResultsの元となったcategoriesから作成されているため、
      // categoryがundefinedになることはない（非nullアサーションを使用）
      const category = categoryMap.get(result.itemId)!;
      const categoryTransactions =
        transactionsByCategoryId.get(result.itemId) || [];

      // 推移データを計算（期間内の取引のみ）
      // 注意: この時点では既に期間でフィルタリング済みのtransactionsを使用
      const trend = this.subcategoryAggregationDomainService.calculateTrend(
        categoryTransactions,
        startDate,
        endDate,
      );

      // 主要取引を取得
      const topTransactions =
        this.subcategoryAggregationDomainService.getTopTransactions(
          categoryTransactions,
          5,
        );

      return {
        itemName: category.name,
        itemCode: category.id,
        itemId: result.itemId,
        parent: parentId,
        totalAmount: result.totalAmount,
        transactionCount: result.transactionCount,
        averageAmount: result.averageAmount,
        budget: null, // 将来対応
        budgetUsage: null, // 将来対応
        children: result.children.map((child) =>
          buildItem(child, result.itemId),
        ),
        monthlyTrend: trend.monthly,
        topTransactions: topTransactions.map((t) => this.toTransactionDto(t)),
      };
    };

    return aggregationResults.map((result) => buildItem(result, null));
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
      categoryName: entity.category.name,
      institutionId: entity.institutionId,
      accountId: entity.accountId,
      description: entity.description,
    };
  }

  /**
   * 空のレスポンスを作成
   */
  private createEmptyResponse(
    startDate: Date,
    endDate: Date,
  ): SubcategoryAggregationResponseDto {
    return {
      items: [],
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      totalAmount: 0,
      totalTransactionCount: 0,
    };
  }
}
