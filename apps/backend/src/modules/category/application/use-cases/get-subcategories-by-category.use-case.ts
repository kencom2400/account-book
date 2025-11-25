import { Injectable, Inject } from '@nestjs/common';
import { CategoryType } from '@account-book/types';
import type { ISubcategoryRepository } from '../../domain/repositories/subcategory.repository.interface';
import { SUB_CATEGORY_REPOSITORY } from '../../domain/repositories/subcategory.repository.interface';
import { SubcategoryTreeBuilderService } from '../../domain/services/subcategory-tree-builder.service';
import type { SubcategoryTreeItem } from '../../domain/services/subcategory-tree-builder.service';

export interface GetSubcategoriesByCategoryResult {
  subcategories: SubcategoryTreeItem[];
  total: number;
}

/**
 * カテゴリ別サブカテゴリ取得ユースケース
 * FR-009: 詳細費目分類機能
 *
 * 主カテゴリ別にサブカテゴリを取得し、階層構造に整形する
 */
@Injectable()
export class GetSubcategoriesByCategoryUseCase {
  constructor(
    @Inject(SUB_CATEGORY_REPOSITORY)
    private readonly subcategoryRepository: ISubcategoryRepository,
    private readonly treeBuilderService: SubcategoryTreeBuilderService,
  ) {}

  /**
   * 主カテゴリ別にサブカテゴリを取得し、階層構造に整形
   *
   * @param categoryType カテゴリタイプ
   * @returns サブカテゴリ一覧（階層構造）
   */
  async execute(
    categoryType: CategoryType,
  ): Promise<GetSubcategoriesByCategoryResult> {
    // カテゴリタイプで絞り込んで取得
    const subcategories =
      await this.subcategoryRepository.findByCategory(categoryType);

    // 階層構造に整形
    const tree = this.treeBuilderService.buildTree(subcategories);

    return {
      subcategories: tree,
      total: subcategories.length,
    };
  }
}
