import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import type { NotificationEntity } from '../../domain/entities/notification.entity';
import { NOTIFICATION_REPOSITORY } from '../../health.tokens';

/**
 * 通知クリーンアップバッチサービス
 * FR-005: 古い通知の自動削除
 *
 * 削除ルール:
 * - ユーザー確認済み/アーカイブ: 30日経過後に削除
 * - 却下: 7日経過後に削除
 * - 未表示/表示中/後で確認: 削除しない（永続保持）
 *
 * 実行スケジュール: 毎日 AM 3:00
 */
@Injectable()
export class NotificationCleanupService {
  private readonly logger = new Logger(NotificationCleanupService.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  /**
   * 通知クリーンアップバッチを実行
   * 毎日 AM 3:00 に自動実行
   */
  @Cron('0 3 * * *')
  async executeNotificationCleanup(): Promise<void> {
    this.logger.log('通知クリーンアップバッチ開始');

    try {
      const { deletedCount, totalCount } = await this.cleanupNotifications();

      if (deletedCount === 0) {
        this.logger.log('削除対象の通知はありません');
        return;
      }

      this.logger.log(
        `通知クリーンアップバッチ完了: ${deletedCount}件削除（全${totalCount}件中）`,
      );
    } catch (error) {
      this.logger.error('通知クリーンアップバッチでエラーが発生しました', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 手動で通知クリーンアップを実行
   * テストや緊急時の手動実行用
   */
  async manualCleanup(): Promise<{
    deletedCount: number;
    totalCount: number;
  }> {
    this.logger.log('通知クリーンアップ手動実行開始');

    const { deletedCount, totalCount } = await this.cleanupNotifications();

    this.logger.log(
      `通知クリーンアップ手動実行完了: ${deletedCount}件削除（全${totalCount}件中）`,
    );

    return {
      deletedCount,
      totalCount,
    };
  }

  /**
   * 通知クリーンアップの共通ロジック
   * @private
   */
  private async cleanupNotifications(): Promise<{
    deletedCount: number;
    totalCount: number;
  }> {
    const notifications: NotificationEntity[] =
      await this.notificationRepository.findAll();
    const now: Date = new Date();

    const toDelete: NotificationEntity[] = notifications.filter(
      (n: NotificationEntity) => n.canBeDeleted(now),
    );

    if (toDelete.length > 0) {
      const idsToDelete: string[] = toDelete.map(
        (n: NotificationEntity) => n.id,
      );
      await this.notificationRepository.deleteMany(idsToDelete);
    }

    return {
      deletedCount: toDelete.length,
      totalCount: notifications.length,
    };
  }
}
