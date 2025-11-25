import { create } from 'zustand';
import { Subcategory, CategoryType } from '@account-book/types';
import { subcategoryApi } from '@/lib/api/subcategories';

/**
 * サブカテゴリストア
 * FR-009: 詳細費目分類機能
 */
interface SubcategoryStore {
  subcategories: Subcategory[];
  isLoading: boolean;
  error: string | null;

  /**
   * サブカテゴリ一覧を取得
   */
  fetchSubcategories: (categoryType?: CategoryType) => Promise<void>;

  /**
   * IDでサブカテゴリを取得
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
  isLoading: false,
  error: null,

  fetchSubcategories: async (categoryType?: CategoryType): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const data = categoryType
        ? await subcategoryApi.getByCategory(categoryType)
        : await subcategoryApi.getAll();
      set({ subcategories: data, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'サブカテゴリの取得に失敗しました';
      set({ error: errorMessage, isLoading: false });
    }
  },

  getSubcategoryById: (id: string): Subcategory | undefined => {
    return get().subcategories.find((sub) => sub.id === id);
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

    // 親カテゴリ（parentIdがnull）を取得
    const rootCategories = allSubcategories.filter((sub) => sub.parentId === null);

    // 階層構造を構築
    const buildChildren = (parentId: string | null): Subcategory[] => {
      const children = allSubcategories.filter((sub) => sub.parentId === parentId);
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
