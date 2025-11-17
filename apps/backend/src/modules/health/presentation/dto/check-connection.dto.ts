import { IsOptional, IsString } from 'class-validator';

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
export class ConnectionStatusDto {
  institutionId: string;
  institutionName: string;
  institutionType: 'bank' | 'credit-card' | 'securities';
  status: string;
  checkedAt: string;
  responseTime: number;
  errorMessage?: string;
  errorCode?: string;
}

/**
 * 接続チェックレスポンスDTO
 */
export class CheckConnectionResponseDto {
  results: ConnectionStatusDto[];
  totalCount: number;
  successCount: number;
  errorCount: number;
  checkedAt: string;
}
