import {
  Subcategory,
  CategoryType,
  ClassificationRequest,
  ClassificationResult,
  BatchClassificationRequest,
  BatchClassificationResponse,
} from '@account-book/types';
import { apiClient } from './client';

/**
 * サブカテゴリAPI
 * FR-009: 詳細費目分類機能
 */

/**
 * サブカテゴリ一覧取得のレスポンス
 */
export interface SubcategoryListResponse {
  success: boolean;
  data: Subcategory[];
  total?: number;
}

/**
 * サブカテゴリAPIクライアント
 */
export const subcategoryApi = {
  /**
   * 全サブカテゴリ取得
   */
  getAll: async (): Promise<Subcategory[]> => {
    return await apiClient.get<Subcategory[]>('/api/subcategories');
  },

  /**
   * カテゴリタイプ別取得
   */
  getByCategory: async (categoryType: CategoryType): Promise<Subcategory[]> => {
    return await apiClient.get<Subcategory[]>(`/api/subcategories/category/${categoryType}`);
  },

  /**
   * サブカテゴリ詳細取得
   */
  getById: async (id: string): Promise<Subcategory> => {
    return await apiClient.get<Subcategory>(`/api/subcategories/${id}`);
  },

  /**
   * 子サブカテゴリ取得（階層化）
   */
  getChildren: async (parentId: string): Promise<Subcategory[]> => {
    return await apiClient.get<Subcategory[]>(`/api/subcategories/${parentId}/children`);
  },

  /**
   * 最近使用したサブカテゴリ取得
   */
  getRecent: async (): Promise<Subcategory[]> => {
    return await apiClient.get<Subcategory[]>('/api/subcategories/recent');
  },

  /**
   * よく使われるサブカテゴリ取得
   */
  getPopular: async (): Promise<Subcategory[]> => {
    return await apiClient.get<Subcategory[]>('/api/subcategories/popular');
  },

  /**
   * 自動分類
   */
  classify: async (request: ClassificationRequest): Promise<ClassificationResult> => {
    return await apiClient.post<ClassificationResult>('/api/subcategories/classify', request);
  },

  /**
   * バッチ分類
   */
  batchClassify: async (
    request: BatchClassificationRequest
  ): Promise<BatchClassificationResponse> => {
    return await apiClient.post<BatchClassificationResponse>(
      '/api/subcategories/batch-classify',
      request
    );
  },
};
