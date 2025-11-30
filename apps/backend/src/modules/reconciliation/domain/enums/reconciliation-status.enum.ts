/**
 * 照合ステータス Enum
 *
 * 照合結果の状態を表す
 */
export enum ReconciliationStatus {
  MATCHED = 'MATCHED', // 完全一致
  UNMATCHED = 'UNMATCHED', // 不一致
  PARTIAL = 'PARTIAL', // 部分一致（要確認）
  PENDING = 'PENDING', // 照合待ち
}
