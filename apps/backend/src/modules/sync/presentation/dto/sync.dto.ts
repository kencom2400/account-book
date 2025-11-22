import { IsBoolean, IsOptional, IsDateString } from 'class-validator';

/**
 * 同期実行DTO
 */
export class SyncTransactionsDto {
  @IsOptional()
  @IsBoolean()
  forceFullSync?: boolean;
}

/**
 * 同期履歴取得DTO
 */
export class GetSyncHistoryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * 同期実行レスポンスDTO
 */
export class SyncTransactionsResponseDto {
  success: boolean;
  data: {
    syncId: string;
    status: string;
    successCount: number;
    failureCount: number;
    newTransactionsCount: number;
    startedAt: Date;
    completedAt: Date | null;
  };
}

/**
 * 同期ステータスレスポンスDTO
 */
export class SyncStatusResponseDto {
  success: boolean;
  data: {
    isRunning: boolean;
    latestSync: {
      syncId: string;
      status: string;
      startedAt: Date;
      completedAt: Date | null;
      successCount: number;
      failureCount: number;
      newTransactionsCount: number;
    } | null;
  };
}

/**
 * 同期履歴一覧レスポンスDTO
 */
export class SyncHistoryResponseDto {
  success: boolean;
  data: Array<{
    syncId: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    totalInstitutions: number;
    successCount: number;
    failureCount: number;
    newTransactionsCount: number;
    errorMessage: string | null;
  }>;
}

/**
 * 同期履歴詳細レスポンスDTO
 */
export class SyncHistoryDetailResponseDto {
  success: boolean;
  data: {
    syncId: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    totalInstitutions: number;
    successCount: number;
    failureCount: number;
    newTransactionsCount: number;
    errorMessage: string | null;
    errorDetails: Record<string, unknown> | null;
  };
}
