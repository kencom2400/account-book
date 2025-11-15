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

