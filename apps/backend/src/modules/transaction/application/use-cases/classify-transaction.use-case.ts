import { Injectable, Inject } from '@nestjs/common';
import { CategoryClassificationService } from '../../domain/services/category-classification.service';
import { CategoryType } from '@account-book/types';
import { CATEGORY_REPOSITORY } from '../../../category/domain/repositories/category.repository.interface';
import type { ICategoryRepository } from '../../../category/domain/repositories/category.repository.interface';

/**
 * ClassifyTransactionUseCase
 * FR-008: 取引データのカテゴリ自動分類ユースケース
 *
 * 取引データを分析し、最適なカテゴリを自動的に割り当てる
 */
@Injectable()
export class ClassifyTransactionUseCase {
  constructor(
    private readonly classificationService: CategoryClassificationService,
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  /**
   * 取引データを自動分類し、カテゴリ情報を返す
   *
   * @param dto 取引データ
   * @returns カテゴリ情報（id, name, type）と分類信頼度
   */
  async execute(dto: {
    amount: number;
    description: string;
    institutionId?: string;
    institutionType?: string;
  }): Promise<{
    category: {
      id: string;
      name: string;
      type: CategoryType;
    };
    confidence: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    reason: string;
  }> {
    // 自動分類を実行
    const classification = this.classificationService.classifyTransaction(
      {
        amount: dto.amount,
        description: dto.description,
        institutionId: dto.institutionId,
      },
      dto.institutionType,
    );

    // 分類されたカテゴリタイプに対応するデフォルトカテゴリを取得
    const defaultCategory = await this.getDefaultCategoryForType(
      classification.category,
    );

    return {
      category: defaultCategory,
      confidence: classification.confidence,
      confidenceLevel: classification.confidenceLevel,
      reason: classification.reason,
    };
  }

  /**
   * カテゴリタイプに対応するデフォルトカテゴリを取得
   */
  private async getDefaultCategoryForType(type: CategoryType): Promise<{
    id: string;
    name: string;
    type: CategoryType;
  }> {
    // カテゴリタイプに対応するトップレベルカテゴリを取得
    const categories = await this.categoryRepository.findByType(type);

    // トップレベルカテゴリ（親カテゴリがnull）を優先
    const topLevelCategories = categories.filter((c) => c.parentId === null);

    if (topLevelCategories.length > 0) {
      // 最初のトップレベルカテゴリを返す（orderの最小値）
      topLevelCategories.sort((a, b) => a.order - b.order);
      const category = topLevelCategories[0];
      return {
        id: category.id,
        name: category.name,
        type: category.type,
      };
    }

    // トップレベルカテゴリがない場合は、orderでソートして最初のカテゴリを返す
    if (categories.length > 0) {
      categories.sort((a, b) => a.order - b.order);
      const category = categories[0];
      return {
        id: category.id,
        name: category.name,
        type: category.type,
      };
    }

    // カテゴリが見つからない場合はデフォルト値を返す
    // （本来はここに到達しないはず）
    return {
      id: `default-${type}`,
      name: this.getDefaultCategoryName(type),
      type,
    };
  }

  /**
   * カテゴリタイプに対応するデフォルトカテゴリ名を取得
   */
  private getDefaultCategoryName(type: CategoryType): string {
    const names: Record<CategoryType, string> = {
      [CategoryType.INCOME]: '収入',
      [CategoryType.EXPENSE]: '支出',
      [CategoryType.TRANSFER]: '振替',
      [CategoryType.REPAYMENT]: '返済',
      [CategoryType.INVESTMENT]: '投資',
    };
    return names[type] || '未分類';
  }
}
