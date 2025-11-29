import { Category, CategoryType } from '@account-book/types';
import { apiClient } from './client';

/**
 * Category API
 */

export interface GetCategoriesParams {
  type?: CategoryType;
  parentId?: string;
  isTopLevel?: boolean;
  asTree?: boolean;
}

export interface CategoryNode {
  category: Category;
  children: CategoryNode[];
}

export interface CreateCategoryRequest {
  name: string;
  type: CategoryType;
  parentId?: string | null;
  icon?: string | null;
  color?: string | null;
}

export interface UpdateCategoryRequest {
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface DeleteCategoryResponse {
  success: boolean;
  replacedCount: number;
  message: string;
}

export interface TransactionSample {
  id: string;
  date: string;
  name: string;
  amount: number;
}

export interface CategoryUsageResponse {
  isUsed: boolean;
  usageCount: number;
  transactionSamples: TransactionSample[];
}

/**
 * カテゴリを初期化
 */
export async function initializeCategories(): Promise<Category[]> {
  return await apiClient.post<Category[]>('/categories/initialize', {});
}

/**
 * カテゴリ一覧を取得
 */
export async function getCategories(
  params?: GetCategoriesParams,
): Promise<Category[] | CategoryNode[]> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    if (params.type) searchParams.append('type', params.type);
    if (params.parentId) searchParams.append('parentId', params.parentId);
    if (params.isTopLevel) searchParams.append('isTopLevel', 'true');
    if (params.asTree) searchParams.append('asTree', 'true');
  }

  const endpoint = `/categories${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return await apiClient.get<Category[] | CategoryNode[]>(endpoint);
}

/**
 * カテゴリを作成
 */
export async function createCategory(
  request: CreateCategoryRequest,
): Promise<Category> {
  return await apiClient.post<Category>('/categories', request);
}

/**
 * カテゴリを単一取得
 */
export async function getCategoryById(id: string): Promise<Category> {
  return await apiClient.get<Category>(`/categories/${id}`);
}

/**
 * カテゴリを更新
 */
export async function updateCategory(
  id: string,
  request: UpdateCategoryRequest,
): Promise<Category> {
  return await apiClient.put<Category>(`/categories/${id}`, request);
}

/**
 * カテゴリを削除
 */
export async function deleteCategory(
  id: string,
  replacementCategoryId?: string,
): Promise<DeleteCategoryResponse> {
  const params = replacementCategoryId
    ? `?replacementCategoryId=${replacementCategoryId}`
    : '';
  const result = await apiClient.delete<DeleteCategoryResponse>(
    `/categories/${id}${params}`,
  );
  return result;
}

/**
 * カテゴリの使用状況を確認
 */
export async function checkCategoryUsage(
  id: string,
): Promise<CategoryUsageResponse> {
  return await apiClient.get<CategoryUsageResponse>(`/categories/${id}/usage`);
}

