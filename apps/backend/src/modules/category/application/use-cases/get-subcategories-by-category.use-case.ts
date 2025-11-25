import { Injectable, Inject } from '@nestjs/common';
import { CategoryType } from '@account-book/types';
import type { ISubcategoryRepository } from '../../domain/repositories/subcategory.repository.interface';
import { SUB_CATEGORY_REPOSITORY } from '../../domain/repositories/subcategory.repository.interface';
import { Subcategory } from '../../domain/entities/subcategory.entity';

export interface SubcategoryTreeItem {
  id: string;
  categoryType: string;
  name: string;
  parentId: string | null;
  displayOrder: number;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: SubcategoryTreeItem[];
}

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
    const tree = this.buildTree(subcategories);

    return {
      subcategories: tree,
      total: subcategories.length,
    };
  }

  /**
   * サブカテゴリ配列を階層構造に変換
   *
   * @param subcategories サブカテゴリ配列
   * @returns 階層構造のサブカテゴリ配列
   */
  private buildTree(subcategories: Subcategory[]): SubcategoryTreeItem[] {
    // 親IDをキーとする子のMapを作成（O(n)）
    const childrenMap = new Map<string | null, Subcategory[]>();
    for (const sub of subcategories) {
      const parentId = sub.parentId;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(sub);
    }

    // 親カテゴリ（parentIdがnull）を取得
    const rootCategories = childrenMap.get(null) || [];

    // 階層構造を構築（Mapを使用してO(1)参照）
    const buildChildren = (parentId: string | null): SubcategoryTreeItem[] => {
      const children = childrenMap.get(parentId) || [];
      return children
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((child) => ({
          id: child.id,
          categoryType: child.categoryType,
          name: child.name,
          parentId: child.parentId,
          displayOrder: child.displayOrder,
          icon: child.icon,
          color: child.color,
          isDefault: child.isDefault,
          isActive: child.isActive,
          createdAt: child.createdAt.toISOString(),
          updatedAt: child.updatedAt.toISOString(),
          children: buildChildren(child.id),
        }));
    };

    return rootCategories
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((root) => ({
        id: root.id,
        categoryType: root.categoryType,
        name: root.name,
        parentId: root.parentId,
        displayOrder: root.displayOrder,
        icon: root.icon,
        color: root.color,
        isDefault: root.isDefault,
        isActive: root.isActive,
        createdAt: root.createdAt.toISOString(),
        updatedAt: root.updatedAt.toISOString(),
        children: buildChildren(root.id),
      }));
  }
}
