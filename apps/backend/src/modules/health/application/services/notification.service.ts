import { Injectable, Logger } from '@nestjs/common';
import type { ConnectionStatusResult } from '../../domain/types/connection-status-result.type';

/**
 * 通知サービス
 * Application層に配置され、通知作成の責務を担う
 * FR-005: 通知機能の実装
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * 接続エラー通知を作成
   * @param errors 接続エラーが発生した金融機関の情報
   * @note 将来的に非同期処理（通知エンティティの保存、WebSocket送信等）を追加する予定のため、
   *       呼び出し側ではawaitで呼び出すことを推奨
   */
  createConnectionErrorNotifications(errors: ConnectionStatusResult[]): void {
    this.logger.log(
      `接続エラー通知を作成: ${errors.length}件の金融機関でエラーが発生`,
    );

    // TODO: FR-005 実装時に以下を実装
    // - 通知エンティティの作成
    // - 通知リポジトリへの保存
    // - フロントエンドへの通知送信（WebSocket/SSE等）

    for (const error of errors) {
      this.logger.warn(
        `金融機関接続エラー: ${error.institutionName} (${error.institutionId}) - ${error.errorMessage ?? '不明なエラー'}`,
      );
    }
  }
}
