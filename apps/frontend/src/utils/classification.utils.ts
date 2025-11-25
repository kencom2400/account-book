import { ClassificationReason } from '@account-book/types';

/**
 * 分類理由の表示テキストを取得
 * FR-009: 詳細費目分類機能
 */
export function getClassificationReasonText(
  reason: ClassificationReason,
  merchantName?: string | null
): string {
  switch (reason) {
    case ClassificationReason.MERCHANT_MATCH:
      return merchantName ? `店舗マスタ一致: ${merchantName}` : '店舗マスタ一致';
    case ClassificationReason.KEYWORD_MATCH:
      return 'キーワード一致';
    case ClassificationReason.AMOUNT_INFERENCE:
      return '金額推測';
    case ClassificationReason.RECURRING_PATTERN:
      return '定期性判定';
    case ClassificationReason.DEFAULT:
      return 'デフォルト';
    default:
      return '不明';
  }
}
