import { Injectable, Inject } from '@nestjs/common';
import type { ISubcategoryRepository } from '../../domain/repositories/subcategory.repository.interface';
import { SUB_CATEGORY_REPOSITORY } from '../../domain/repositories/subcategory.repository.interface';
import { SubcategoryTreeBuilderService } from '../../domain/services/subcategory-tree-builder.service';
import type { SubcategoryTreeItem } from '../../domain/services/subcategory-tree-builder.service';

export interface GetSubcategoriesResult {
  subcategories: SubcategoryTreeItem[];
  total: number;
}

/**
 * 全サブカテゴリ取得ユースケース
 * FR-009: 詳細費目分類機能
 *
 * 全サブカテゴリ一覧を取得し、階層構造に整形する
 */
@Injectable()
export class GetSubcategoriesUseCase {
  constructor(
    @Inject(SUB_CATEGORY_REPOSITORY)
    private readonly subcategoryRepository: ISubcategoryRepository,
    private readonly treeBuilderService: SubcategoryTreeBuilderService,
  ) {}

  /**
   * 全サブカテゴリ一覧を取得し、階層構造に整形
   *
   * @returns サブカテゴリ一覧（階層構造）
   */
  async execute(): Promise<GetSubcategoriesResult> {
    // 全サブカテゴリを取得
    const allSubcategories = await this.subcategoryRepository.findAll();

    // 階層構造に整形
    const tree = this.treeBuilderService.buildTree(allSubcategories);

    return {
      subcategories: tree,
      total: allSubcategories.length,
    };
  }
}
