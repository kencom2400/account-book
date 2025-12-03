import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { CategoryType } from '@account-book/types';

/**
 * GetCategoryAggregationQueryDto
 * カテゴリ別集計取得リクエストDTO
 */
export class GetCategoryAggregationQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsEnum(CategoryType)
  categoryType?: CategoryType;
}

/**
 * TransactionDto
 * プレゼンテーション層用のDTO
 */
export interface TransactionDto {
  id: string;
  date: string; // ISO8601形式
  amount: number;
  categoryType: string; // CategoryTypeの文字列値
  categoryId: string;
  institutionId: string;
  accountId: string;
  description: string;
}

/**
 * SubcategoryAggregationResponseDto
 */
export interface SubcategoryAggregationResponseDto {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
  topTransactions: TransactionDto[];
}

/**
 * TrendDataResponseDto
 */
export interface TrendDataResponseDto {
  monthly: Array<{
    month: string; // YYYY-MM
    amount: number;
    count: number;
  }>;
}

/**
 * CategoryAggregationResponseDto
 */
export interface CategoryAggregationResponseDto {
  categoryType: CategoryType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalAmount: number;
  transactionCount: number;
  subcategories: SubcategoryAggregationResponseDto[];
  percentage: number;
  trend: TrendDataResponseDto;
}
