import { apiClient } from './client';
import { SyncAllTransactionsRequest, SyncAllTransactionsResponse } from '@account-book/types';

/**
 * 同期API
 */

/**
 * 手動同期を開始
 */
export async function startSync(
  request?: SyncAllTransactionsRequest
): Promise<SyncAllTransactionsResponse> {
  return await apiClient.post<SyncAllTransactionsResponse>('/api/sync/start', request || {});
}
