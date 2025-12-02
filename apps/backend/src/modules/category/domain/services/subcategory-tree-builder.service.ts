import { Injectable } from '@nestjs/common';
import { Subcategory } from '../entities/subcategory.entity';

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

/**
 * サブカテゴリツリービルダーサービス
 * サブカテゴリ配列を階層構造に変換する共通ロジックを提供
 */
@Injectable()
export class SubcategoryTreeBuilderService {
  /**
   * サブカテゴリ配列を階層構造に変換
   *
   * @param subcategories サブカテゴリ配列
   * @returns 階層構造のサブカテゴリ配列
   */
  buildTree(subcategories: Subcategory[]): SubcategoryTreeItem[] {
    // 親IDをキーとする子のMapを作成（O(n)）
    const childrenMap = new Map<string | null, Subcategory[]>();
    for (const sub of subcategories) {
      const parentId = sub.parentId;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(sub);
    }

    // 階層構造を構築（Mapを使用してO(1)参照）
    const buildSubTree = (items: Subcategory[]): SubcategoryTreeItem[] => {
      return items
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((item) => {
          const children = buildSubTree(childrenMap.get(item.id) || []);
          const treeItem: SubcategoryTreeItem = {
            id: item.id,
            categoryType: item.categoryType,
            name: item.name,
            parentId: item.parentId,
            displayOrder: item.displayOrder,
            icon: item.icon,
            color: item.color,
            isDefault: item.isDefault,
            isActive: item.isActive,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          };

          // 子要素が存在する場合のみchildrenプロパティを追加
          if (children.length > 0) {
            treeItem.children = children;
          }

          return treeItem;
        });
    };

    return buildSubTree(childrenMap.get(null) || []);
  }
}
