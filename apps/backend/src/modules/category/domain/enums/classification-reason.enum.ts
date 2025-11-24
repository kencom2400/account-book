/**
 * 分類理由
 * サブカテゴリの自動分類がどのロジックで行われたかを示すEnum
 */
export enum ClassificationReason {
  /** 店舗マスタ一致 */
  MERCHANT_MATCH = 'MERCHANT_MATCH',
  /** キーワード一致 */
  KEYWORD_MATCH = 'KEYWORD_MATCH',
  /** 金額推測 */
  AMOUNT_INFERENCE = 'AMOUNT_INFERENCE',
  /** 定期性判定 */
  RECURRING_PATTERN = 'RECURRING_PATTERN',
  /** デフォルト（その他） */
  DEFAULT = 'DEFAULT',
  /** 手動設定 */
  MANUAL = 'MANUAL',
}
