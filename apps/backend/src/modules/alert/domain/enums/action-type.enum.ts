/**
 * アクションタイプ Enum
 *
 * アラートに対するアクションの種類を表す
 */
export enum ActionType {
  VIEW_DETAILS = 'view_details', // 詳細を確認
  MANUAL_MATCH = 'manual_match', // 手動で照合
  MARK_RESOLVED = 'mark_resolved', // 解決済みにする
  CONTACT_BANK = 'contact_bank', // カード会社に問い合わせ
  IGNORE = 'ignore', // 無視する
}
