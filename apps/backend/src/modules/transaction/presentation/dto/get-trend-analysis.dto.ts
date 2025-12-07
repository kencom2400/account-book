import { IsInt, Min, Max, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 表示対象の種類
 */
export enum TrendTargetType {
  INCOME = 'income',
  EXPENSE = 'expense',
  BALANCE = 'balance',
}

/**
 * 移動平均の期間
 */
export enum MovingAveragePeriod {
  THREE_MONTHS = 3,
  SIX_MONTHS = 6,
  TWELVE_MONTHS = 12,
}

/**
 * GetTrendAnalysisDto
 * トレンド分析取得リクエストDTO
 * FR-027: 収支推移のトレンド表示
 */
export class GetTrendAnalysisDto {
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  startYear!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1900)
  endYear!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  endMonth!: number;

  @IsOptional()
  @IsEnum(TrendTargetType)
  targetType?: TrendTargetType;

  @IsOptional()
  @Type(() => Number)
  @IsEnum(MovingAveragePeriod)
  movingAveragePeriod?: MovingAveragePeriod;
}
