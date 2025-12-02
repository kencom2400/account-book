import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GetMonthlyBalanceDto
 * 月別収支集計取得リクエストDTO
 */
export class GetMonthlyBalanceDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;
}
