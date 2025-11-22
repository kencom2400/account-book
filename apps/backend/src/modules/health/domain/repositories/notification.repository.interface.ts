import type { NotificationEntity } from '../entities/notification.entity';

/**
 * 通知リポジトリインターフェース
 * FR-005: 通知機能のデータ永続化
 */
export interface INotificationRepository {
  /**
   * 通知を保存
   */
  save(notification: NotificationEntity): Promise<NotificationEntity>;

  /**
   * IDで通知を取得
   */
  findById(id: string): Promise<NotificationEntity | null>;

  /**
   * すべての通知を取得
   */
  findAll(): Promise<NotificationEntity[]>;

  /**
   * 通知を削除
   */
  delete(id: string): Promise<void>;

  /**
   * 複数の通知を一括削除
   */
  deleteMany(ids: string[]): Promise<void>;
}
