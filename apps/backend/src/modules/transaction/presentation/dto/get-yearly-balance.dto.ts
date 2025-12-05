import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GetYearlyBalanceDto
 * 年間収支集計取得リクエストDTO
 */
export class GetYearlyBalanceDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year!: number;
}
