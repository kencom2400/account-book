import type { NotificationType } from '@/stores/notification.store';

/**
 * NotificationTypeをAlertVariantに変換する
 */
export function getAlertVariant(type: NotificationType): 'warning' | 'error' {
  switch (type) {
    case 'warning':
      return 'warning';
    case 'error':
    case 'critical':
      return 'error';
    default: {
      const _exhaustiveCheck: never = type;
      return 'error';
    }
  }
}

/**
 * NotificationTypeからタイトルを取得する
 */
export function getNotificationTitle(type: NotificationType): string {
  switch (type) {
    case 'warning':
      return '警告';
    case 'error':
      return 'エラー';
    case 'critical':
      return '重大なエラー';
    default: {
      const _exhaustiveCheck: never = type;
      return 'エラー';
    }
  }
}
