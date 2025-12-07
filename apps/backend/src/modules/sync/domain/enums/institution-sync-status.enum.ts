/**
 * 金融機関同期ステータス列挙型
 *
 * @description
 * 金融機関ごとの同期設定のステータスを表します。
 * FR-030: データ同期間隔の設定
 *
 * @note
 * 既存のSyncStatus enum（pending, running, completed等）とは別に、
 * 設定管理用のステータスとして定義します。
 */
export enum InstitutionSyncStatus {
  /** 待機中 - 次回同期時刻を待っている */
  IDLE = 'idle',

  /** 同期中 - 現在同期処理を実行中 */
  SYNCING = 'syncing',

  /** エラー - 同期に失敗した */
  ERROR = 'error',
}
