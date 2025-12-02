/**
 * アラートタイプ Enum
 *
 * アラートの種別を表す
 */
export enum AlertType {
  AMOUNT_MISMATCH = 'amount_mismatch', // 金額不一致
  PAYMENT_NOT_FOUND = 'payment_not_found', // 引落未検出
  OVERDUE = 'overdue', // 延滞
  MULTIPLE_CANDIDATES = 'multiple_candidates', // 複数候補
}
