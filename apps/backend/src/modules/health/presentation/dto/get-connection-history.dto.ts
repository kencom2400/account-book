import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
  ConnectionStatusType,
  InstitutionType,
} from '../../domain/types/connection.types';

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
export interface ConnectionHistoryDto {
  id: string;
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  status: ConnectionStatusType;
  checkedAt: string;
  responseTime: number;
  errorMessage?: string;
  errorCode?: string;
}

/**
 * 接続履歴一覧レスポンスDTO
 */
export interface GetConnectionHistoryResponseDto {
  histories: ConnectionHistoryDto[];
  totalCount: number;
}
