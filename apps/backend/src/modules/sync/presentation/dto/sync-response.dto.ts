import { SyncStatus } from '../../domain/enums/sync-status.enum';

/**
 * 同期履歴DTO
 */
export interface SyncHistoryDto {
  id: string;
  institutionId: string;
  institutionName: string;
  institutionType: string;
  status: SyncStatus;
  startedAt: string;
  completedAt: string | null;
  totalFetched: number;
  newRecords: number;
  duplicateRecords: number;
  errorMessage: string | null;
}

/**
 * 同期サマリーDTO
 */
export interface SyncSummaryDto {
  totalInstitutions: number;
  successCount: number;
  failureCount: number;
  totalFetched: number;
  totalNew: number;
  totalDuplicate: number;
  duration: number;
}

/**
 * 手動同期開始レスポンスDTO
 */
export interface SyncAllTransactionsResponseDto {
  success: boolean;
  data: SyncHistoryDto[];
  summary: SyncSummaryDto;
}

/**
 * 同期ステータスDTO
 */
export interface SyncStatusDto {
  isRunning: boolean;
  currentSyncId: string | null;
  startedAt: string | null;
  progress: SyncProgressDto | null;
}

/**
 * 同期進捗DTO
 */
export interface SyncProgressDto {
  totalInstitutions: number;
  completedInstitutions: number;
  currentInstitution: string;
  percentage: number;
}

/**
 * 同期ステータスレスポンスDTO
 */
export interface SyncStatusResponseDto {
  success: boolean;
  data: SyncStatusDto;
}

/**
 * ページネーションメタ情報
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 同期履歴一覧レスポンスDTO
 */
export interface SyncHistoryResponseDto {
  success: boolean;
  data: SyncHistoryDto[];
  meta: PaginationMeta;
}

/**
 * 同期キャンセルレスポンスDTO
 */
export interface CancelSyncResponseDto {
  success: boolean;
  message: string;
}

/**
 * 同期スケジュール情報DTO
 */
export interface SyncScheduleDto {
  enabled: boolean;
  cronExpression: string;
  timezone: string;
  nextRun: string;
}

/**
 * 同期スケジュール取得レスポンスDTO
 */
export interface SyncScheduleResponseDto {
  success: boolean;
  data: SyncScheduleDto;
}

/**
 * エラーレスポンスDTO
 */
export interface ErrorResponseDto {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
