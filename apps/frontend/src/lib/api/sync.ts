import { apiClient } from './client';

/**
 * 同期API
 */

export interface SyncAllTransactionsRequest {
  forceFullSync?: boolean;
  institutionIds?: string[];
}

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

/**
 * 手動同期を開始
 */
export async function startSync(
  request?: SyncAllTransactionsRequest
): Promise<SyncAllTransactionsResponse> {
  return await apiClient.post<SyncAllTransactionsResponse>('/api/sync/start', request || {});
}
