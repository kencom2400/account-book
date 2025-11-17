/**
 * 接続ステータスの列挙型
 * FR-004: バックグラウンド接続確認で使用
 */
export enum ConnectionStatus {
  /** 接続成功 */
  CONNECTED = 'CONNECTED',
  /** 接続失敗 */
  DISCONNECTED = 'DISCONNECTED',
  /** 再認証が必要 */
  NEED_REAUTH = 'NEED_REAUTH',
  /** 確認中 */
  CHECKING = 'CHECKING',
}
