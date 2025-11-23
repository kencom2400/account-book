import { IsOptional, IsString } from 'class-validator';
import type {
  ConnectionStatusType,
  InstitutionType,
} from '../../domain/types/connection.types';

/**
 * 接続チェックリクエストDTO
 */
export class CheckConnectionRequestDto {
  @IsOptional()
  @IsString()
  institutionId?: string;
}

/**
 * 接続状態レスポンスDTO
 */
export interface ConnectionStatusDto {
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
 * 接続チェックレスポンスDTO
 */
export interface CheckConnectionResponseDto {
  results: ConnectionStatusDto[];
  totalCount: number;
  successCount: number;
  errorCount: number;
  checkedAt: string;
}
