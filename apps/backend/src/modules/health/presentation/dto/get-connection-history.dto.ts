import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 接続履歴取得リクエストDTO
 */
export class GetConnectionHistoryQueryDto {
  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  latestOnly?: boolean;
}

/**
 * 接続履歴レスポンスDTO
 */
export class ConnectionHistoryDto {
  id!: string;
  institutionId!: string;
  institutionName!: string;
  institutionType!: string;
  status!: string;
  checkedAt!: string;
  responseTime!: number;
  errorMessage?: string;
  errorCode?: string;
}

/**
 * 接続履歴一覧レスポンスDTO
 */
export class GetConnectionHistoryResponseDto {
  histories!: ConnectionHistoryDto[];
  totalCount!: number;
}
