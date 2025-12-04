export interface SyncStatus {
  institutionId: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncedAt?: Date;
  error?: string;
}

export interface SyncResult {
  institutionId: string;
  success: boolean;
  transactionsAdded: number;
  transactionsUpdated: number;
  error?: string;
  syncedAt: Date;
}

export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // minutes
  syncTime?: string; // HH:mm format
}

/**
 * 同期APIリクエスト
 */
export interface SyncAllTransactionsRequest {
  forceFullSync?: boolean;
  institutionIds?: string[];
}

/**
 * 同期履歴
 */
export interface SyncHistory {
  id: string;
  institutionId: string;
  institutionName: string;
  institutionType: string;
  status: 'success' | 'failure' | 'partial';
  startedAt: string;
  completedAt: string | null;
  totalFetched: number;
  newRecords: number;
  duplicateRecords: number;
  errorMessage?: string;
  retryCount: number;
}

/**
 * 同期APIレスポンス
 */
export interface SyncAllTransactionsResponse {
  success: boolean;
  data: SyncHistory[];
  summary: {
    totalInstitutions: number;
    successCount: number;
    failureCount: number;
    totalFetched: number;
    totalNew: number;
    totalDuplicate: number;
    duration: number;
  };
}
