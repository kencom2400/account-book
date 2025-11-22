/**
 * 同期ステータス列挙型
 */
export enum SyncStatus {
  /** 同期待機中 */
  PENDING = 'pending',
  /** 同期実行中 */
  IN_PROGRESS = 'in_progress',
  /** 同期成功 */
  SUCCESS = 'success',
  /** 同期失敗 */
  FAILED = 'failed',
  /** 部分的成功（一部の金融機関が失敗） */
  PARTIAL_SUCCESS = 'partial_success',
}
