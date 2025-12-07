/**
 * 同期設定関連の型定義
 * FR-030: データ同期間隔の設定
 */

/**
 * 同期間隔タイプ
 */
export enum SyncIntervalType {
  /** リアルタイム - 5分ごと */
  REALTIME = 'realtime',
  /** 高頻度 - 1時間ごと */
  FREQUENT = 'frequent',
  /** 標準 - 6時間ごと */
  STANDARD = 'standard',
  /** 低頻度 - 1日1回 */
  INFREQUENT = 'infrequent',
  /** 手動のみ - 自動同期なし */
  MANUAL = 'manual',
  /** カスタム間隔 - ユーザー指定の間隔 */
  CUSTOM = 'custom',
}

/**
 * 時間単位
 */
export enum TimeUnit {
  /** 分 */
  MINUTES = 'minutes',
  /** 時間 */
  HOURS = 'hours',
  /** 日 */
  DAYS = 'days',
}

/**
 * 金融機関同期ステータス
 */
export enum InstitutionSyncStatus {
  /** 待機中 - 次回同期時刻を待っている */
  IDLE = 'idle',
  /** 同期中 - 現在同期処理を実行中 */
  SYNCING = 'syncing',
  /** エラー - 同期に失敗した */
  ERROR = 'error',
}

/**
 * 同期間隔DTO
 */
export interface SyncIntervalDto {
  type: SyncIntervalType;
  value?: number;
  unit?: TimeUnit;
  customSchedule?: string;
}

/**
 * 同期設定データDTO
 */
export interface SyncSettingsDataDto {
  defaultInterval: SyncIntervalDto;
  wifiOnly: boolean;
  batterySavingMode: boolean;
  autoRetry: boolean;
  maxRetryCount: number;
  nightModeSuspend: boolean;
  nightModeStart: string;
  nightModeEnd: string;
}

/**
 * 同期設定更新リクエストDTO
 */
export interface UpdateSyncSettingsRequestDto {
  defaultInterval?: SyncIntervalDto;
  wifiOnly?: boolean;
  batterySavingMode?: boolean;
  autoRetry?: boolean;
  maxRetryCount?: number;
  nightModeSuspend?: boolean;
  nightModeStart?: string;
  nightModeEnd?: string;
}

/**
 * 金融機関同期設定レスポンスDTO
 */
export interface InstitutionSyncSettingsResponseDto {
  id: string;
  institutionId: string;
  interval: SyncIntervalDto;
  enabled: boolean;
  lastSyncedAt: string | null;
  nextSyncAt: string | null;
  syncStatus: InstitutionSyncStatus;
  errorCount: number;
  lastError: string | null;
}

/**
 * 金融機関同期設定更新リクエストDTO
 */
export interface UpdateInstitutionSyncSettingsRequestDto {
  interval?: SyncIntervalDto;
  enabled?: boolean;
}
