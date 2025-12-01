/**
 * 支払いステータス
 *
 * クレジットカード月別集計の支払い状況を表すEnum
 */
export enum PaymentStatus {
  /** 未払い（引落前） */
  PENDING = 'PENDING',

  /** 処理中（引落予定日前後） */
  PROCESSING = 'PROCESSING',

  /** 支払済（照合完了） */
  PAID = 'PAID',

  /** 延滞（引落日を過ぎても未払い） */
  OVERDUE = 'OVERDUE',

  /** 一部支払い */
  PARTIAL = 'PARTIAL',

  /** 不一致（要確認） */
  DISPUTED = 'DISPUTED',

  /** キャンセル */
  CANCELLED = 'CANCELLED',

  /** 手動確認済 */
  MANUAL_CONFIRMED = 'MANUAL_CONFIRMED',
}
