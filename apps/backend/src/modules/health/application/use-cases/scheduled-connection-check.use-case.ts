import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CheckConnectionStatusUseCase } from './check-connection-status.use-case';

/**
 * 定期的な接続チェックのユースケース
 * FR-004: バックグラウンド接続確認で使用
 * 要件: 1時間ごとに自動実行
 */
@Injectable()
export class ScheduledConnectionCheckUseCase {
  private readonly logger = new Logger(ScheduledConnectionCheckUseCase.name);
  private isRunning = false;

  constructor(
    private readonly checkConnectionStatusUseCase: CheckConnectionStatusUseCase,
  ) {}

  /**
   * 1時間ごとに実行される定期チェック
   * Cronパターン: 毎時0分に実行
   */
  @Cron(CronExpression.EVERY_HOUR)
  handleScheduledCheck(): void {
    // 既に実行中の場合はスキップ（二重実行防止）
    if (this.isRunning) {
      this.logger.warn('前回のチェックがまだ実行中のため、スキップします');
      return;
    }

    try {
      this.isRunning = true;
      this.logger.log('定期接続チェックを開始します');

      // 注意: 実際の金融機関リストは外部から取得する必要があります
      // この実装では、実際の金融機関データを取得するためのロジックが必要です
      // 現時点では、手動実行のみをサポートし、定期実行は将来的に実装します

      this.logger.log(
        '定期接続チェックの完全実装は、金融機関データの統合後に行います',
      );
    } catch (error) {
      this.logger.error(
        '定期接続チェック中にエラーが発生しました',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 手動で定期チェックをトリガー（テスト用）
   */
  async triggerManualCheck(
    institutions: Array<{
      id: string;
      name: string;
      type: 'bank' | 'credit-card' | 'securities';
      apiClient: any;
    }>,
  ): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('チェックが既に実行中です');
      return;
    }

    try {
      this.isRunning = true;
      this.logger.log('手動での接続チェックを開始します');

      // 全金融機関をチェック
      await this.checkConnectionStatusUseCase.execute({}, institutions);

      this.logger.log('手動での接続チェックが完了しました');
    } catch (error) {
      this.logger.error(
        '手動チェック中にエラーが発生しました',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 現在チェックが実行中かどうかを返す
   */
  isCheckRunning(): boolean {
    return this.isRunning;
  }
}
