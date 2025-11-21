import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConnectionFailedEvent } from '../../domain/events/connection-failed.event';
import { NotificationService } from '../services/notification.service';

/**
 * 接続失敗イベントハンドラー
 * Application層に配置され、接続失敗時に通知を作成する責務を担う
 */
@Injectable()
export class ConnectionFailedHandler {
  private readonly logger = new Logger(ConnectionFailedHandler.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 接続失敗イベントを処理
   * @param event 接続失敗イベント
   */
  @OnEvent('connection.failed')
  handleConnectionFailed(event: ConnectionFailedEvent): void {
    this.logger.log(`接続失敗イベントを受信: ${event.errors.length}件のエラー`);

    try {
      this.notificationService.createConnectionErrorNotifications(event.errors);
    } catch (error) {
      this.logger.error(
        '通知作成中にエラーが発生しました',
        error instanceof Error ? error.stack : String(error),
      );
      // エラーが発生してもイベント処理は継続
    }
  }
}
