import { CategoryType } from '@account-book/types';

/**
 * 費目レスポンスDTO
 */
export interface CategoryResponseDto {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  isSystemDefined: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 費目一覧レスポンスDTO（成功）
 */
export interface CategoryListSuccessDto {
  success: true;
  data: CategoryResponseDto[];
  total: number;
}

/**
 * エラーレスポンスDTO
 */
export interface CategoryErrorDto {
  success: false;
  error: string;
  message: string;
  details?: object;
}

/**
 * 費目一覧レスポンスDTO (Discriminated Union)
 */
export type CategoryListResponseDto = CategoryListSuccessDto | CategoryErrorDto;

/**
 * 費目削除レスポンスDTO（成功）
 */
export interface DeleteCategorySuccessDto {
  success: true;
  replacedCount: number;
  message: string;
}

/**
 * 費目削除レスポンスDTO (Discriminated Union)
 */
export type DeleteCategoryResponseDto =
  | DeleteCategorySuccessDto
  | CategoryErrorDto;

/**
 * 取引サンプルDTO
 */
export interface TransactionSampleDto {
  id: string;
  date: string;
  name: string;
  amount: number;
}

/**
 * 費目使用状況レスポンスDTO
 */
export interface CategoryUsageResponseDto {
  isUsed: boolean;
  usageCount: number;
  transactionSamples: TransactionSampleDto[];
}
