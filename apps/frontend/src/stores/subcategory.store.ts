import { create } from 'zustand';
import { Subcategory, CategoryType } from '@account-book/types';
import { subcategoryApi } from '@/lib/api/subcategories';

/**
 * サブカテゴリストア
 * FR-009: 詳細費目分類機能
 */
interface SubcategoryStore {
  subcategories: Subcategory[];
  subcategoryMap: Map<string, Subcategory>; // IDをキーとするMap（O(1)参照用）
  isLoading: boolean;
  error: string | null;

  /**
   * サブカテゴリ一覧を取得
   */
  fetchSubcategories: (categoryType?: CategoryType) => Promise<void>;

  /**
   * IDでサブカテゴリを取得（O(1)）
   */
  getSubcategoryById: (id: string) => Subcategory | undefined;

  /**
   * 親IDで子サブカテゴリを取得
   */
  getChildrenByParentId: (parentId: string | null) => Subcategory[];

  /**
   * カテゴリタイプでフィルタリング
   */
  getSubcategoriesByCategory: (categoryType: CategoryType) => Subcategory[];

  /**
   * 階層構造を構築
   */
  buildTree: (categoryType?: CategoryType) => Subcategory[];
}

export const useSubcategoryStore = create<SubcategoryStore>((set, get) => ({
  subcategories: [],
  subcategoryMap: new Map<string, Subcategory>(),
  isLoading: false,
  error: null,

  fetchSubcategories: async (categoryType?: CategoryType): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const data = categoryType
        ? await subcategoryApi.getByCategory(categoryType)
        : await subcategoryApi.getAll();
      // IDをキーとするMapを作成（O(1)参照用）
      const map = new Map<string, Subcategory>();
      for (const subcategory of data) {
        map.set(subcategory.id, subcategory);
      }
      set({ subcategories: data, subcategoryMap: map, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'サブカテゴリの取得に失敗しました';
      set({ error: errorMessage, isLoading: false, subcategoryMap: new Map() });
    }
  },

  getSubcategoryById: (id: string): Subcategory | undefined => {
    return get().subcategoryMap.get(id);
  },

  getChildrenByParentId: (parentId: string | null): Subcategory[] => {
    return get().subcategories.filter((sub) => sub.parentId === parentId);
  },

  getSubcategoriesByCategory: (categoryType: CategoryType): Subcategory[] => {
    return get().subcategories.filter((sub) => sub.categoryType === categoryType && sub.isActive);
  },

  buildTree: (categoryType?: CategoryType): Subcategory[] => {
    const allSubcategories = categoryType
      ? get().getSubcategoriesByCategory(categoryType)
      : get().subcategories.filter((sub) => sub.isActive);

    // 親IDをキーとする子のMapを作成（O(1)参照用）
    const childrenMap = new Map<string | null, Subcategory[]>();
    for (const sub of allSubcategories) {
      const parentId = sub.parentId;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(sub);
    }

    // 親カテゴリ（parentIdがnull）を取得
    const rootCategories = childrenMap.get(null) || [];

    // 階層構造を構築（Mapを使用してO(1)参照）
    const buildChildren = (parentId: string | null): Subcategory[] => {
      const children = childrenMap.get(parentId) || [];
      return children.map((child) => ({
        ...child,
        children: buildChildren(child.id),
      }));
    };

    return rootCategories.map((root) => ({
      ...root,
      children: buildChildren(root.id),
    }));
  },
}));
