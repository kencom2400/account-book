/**
 * アラートレベル Enum
 *
 * アラートの重要度を表す
 */
export enum AlertLevel {
  INFO = 'info', // 情報（軽微な差異）
  WARNING = 'warning', // 警告（要確認）
  ERROR = 'error', // エラー（重大な不一致）
  CRITICAL = 'critical', // 緊急（延滞等）
}
