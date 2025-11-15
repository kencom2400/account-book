export interface SyncStatus {
  institutionId: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncedAt?: Date;
  errorMessage?: string;
}

export interface SyncResult {
  institutionId: string;
  success: boolean;
  transactionsAdded: number;
  transactionsUpdated: number;
  error?: string;
}

