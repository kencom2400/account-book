/**
 * 同期ステータス列挙型
 *
 * @description
 * 取引履歴の同期処理のステータスを表します。
 * 各金融機関の同期はこのステータスで管理されます。
 */
export enum SyncStatus {
  /** 同期待機中 - 同期がキューに入っているが、まだ開始されていない */
  PENDING = 'pending',

  /** 同期実行中 - 現在同期処理が実行中 */
  RUNNING = 'running',

  /** 同期完了 - すべての取引が正常に同期された */
  COMPLETED = 'completed',

  /** 同期失敗 - エラーにより同期が失敗した */
  FAILED = 'failed',

  /** 同期キャンセル - ユーザーにより同期がキャンセルされた */
  CANCELLED = 'cancelled',
}
