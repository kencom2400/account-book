/**
 * 同期結果DTO（Application層内部で使用）
 *
 * @description
 * 1つの金融機関の同期結果を表します。
 * UseCaseからOrchestratorへの結果受け渡しに使用します。
 */
export interface SyncResult {
  institutionId: string;
  institutionName: string;
  institutionType: string;
  success: boolean;
  totalFetched: number;
  newRecords: number;
  duplicateRecords: number;
  errorMessage: string | null;
  duration: number;
}

/**
 * 全金融機関の同期結果DTO
 *
 * @description
 * すべての金融機関の同期結果をまとめたもの。
 */
export interface SyncAllTransactionsResult {
  results: SyncResult[];
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
 * 同期対象金融機関DTO
 *
 * @description
 * 同期処理で使用する金融機関情報
 */
export interface SyncTarget {
  institutionId: string;
  institutionName: string;
  institutionType: 'bank' | 'credit-card' | 'securities';
  lastSyncDate: Date | null;
}
