/**
 * 同期間隔タイプ列挙型
 *
 * @description
 * データ同期間隔のタイプを定義します。
 * FR-030: データ同期間隔の設定
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
