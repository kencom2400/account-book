import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { CategoryType } from '@account-book/types';

/**
 * GetSubcategoryAggregationQueryDto
 * 費目別集計取得リクエストDTO
 */
export class GetSubcategoryAggregationQueryDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsEnum(CategoryType)
  categoryType?: CategoryType;

  @IsOptional()
  @IsString()
  itemId?: string;
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
  categoryName: string;
  institutionId: string;
  accountId: string;
  description: string;
}

/**
 * MonthlyTrend
 * 月次推移データ
 */
export interface MonthlyTrend {
  month: string; // YYYY-MM
  amount: number;
  count: number;
}

/**
 * ExpenseItemSummary
 * 費目別のサマリー情報（階層構造を含む）
 */
export interface ExpenseItemSummary {
  itemName: string;
  itemCode: string;
  itemId: string;
  parent: string | null;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  budget?: number | null;
  budgetUsage?: number | null;
  children: ExpenseItemSummary[];
  monthlyTrend: MonthlyTrend[];
  topTransactions: TransactionDto[];
}

/**
 * Period
 * 集計期間
 */
export interface Period {
  start: string; // ISO8601形式
  end: string; // ISO8601形式
}

/**
 * SubcategoryAggregationResponseDto
 * 費目別集計のレスポンスDTO
 */
export interface SubcategoryAggregationResponseDto {
  items: ExpenseItemSummary[];
  period: Period;
  totalAmount: number;
  totalTransactionCount: number;
}
