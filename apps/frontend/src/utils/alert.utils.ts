/**
 * アラート関連のユーティリティ関数
 */

import { AlertLevel, AlertStatus } from '@/lib/api/alerts';

/**
 * アラートレベルの表示名を取得
 */
export function formatAlertLevel(level: AlertLevel): string {
  switch (level) {
    case AlertLevel.INFO:
      return '情報';
    case AlertLevel.WARNING:
      return '警告';
    case AlertLevel.ERROR:
      return 'エラー';
    case AlertLevel.CRITICAL:
      return '緊急';
    default:
      return level;
  }
}

/**
 * アラートレベルの色を取得
 */
export function getAlertLevelColor(level: AlertLevel): string {
  switch (level) {
    case AlertLevel.INFO:
      return 'bg-blue-100 text-blue-800';
    case AlertLevel.WARNING:
      return 'bg-yellow-100 text-yellow-800';
    case AlertLevel.ERROR:
      return 'bg-orange-100 text-orange-800';
    case AlertLevel.CRITICAL:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * アラートステータスの表示名を取得
 */
export function formatAlertStatus(status: AlertStatus): string {
  switch (status) {
    case AlertStatus.UNREAD:
      return '未読';
    case AlertStatus.READ:
      return '既読';
    case AlertStatus.RESOLVED:
      return '解決済み';
    default:
      return status;
  }
}

/**
 * アラートタイプの表示名を取得
 */
import { AlertType } from '@/lib/api/alerts';

export function formatAlertType(type: AlertType): string {
  switch (type) {
    case AlertType.AMOUNT_MISMATCH:
      return '金額不一致';
    case AlertType.PAYMENT_NOT_FOUND:
      return '引落未検出';
    case AlertType.OVERDUE:
      return '延滞';
    case AlertType.MULTIPLE_CANDIDATES:
      return '複数候補';
    default:
      return type;
  }
}
