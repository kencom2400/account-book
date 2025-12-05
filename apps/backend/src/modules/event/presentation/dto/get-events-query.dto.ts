import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * GetEventsQueryDto
 * イベント一覧取得のクエリパラメータDTO
 */
export class GetEventsQueryDto {
  @ApiPropertyOptional({
    description: '取得件数（デフォルト: 100）',
    example: 100,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;

  @ApiPropertyOptional({
    description: 'オフセット（デフォルト: 0）',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;
}

/**
 * GetEventsByDateRangeQueryDto
 * 日付範囲でのイベント取得のクエリパラメータDTO
 */
export class GetEventsByDateRangeQueryDto {
  @ApiPropertyOptional({
    description: '開始日（ISO 8601形式: YYYY-MM-DD）',
    example: '2025-01-01',
  })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: '終了日（ISO 8601形式: YYYY-MM-DD）',
    example: '2025-12-31',
  })
  @IsOptional()
  endDate?: string;
}
