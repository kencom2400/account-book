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
