import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CheckConnectionStatusUseCase } from './check-connection-status.use-case';
import type { IInstitutionInfo } from '../../domain/adapters/api-client.interface';

// Application Services
import { InstitutionAggregationService } from '../services/institution-aggregation.service';

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
    private readonly institutionAggregationService: InstitutionAggregationService,
  ) {}

  /**
   * 1時間ごとに実行される定期チェック
   * Cronパターン: 毎時0分に実行
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleScheduledCheck(): Promise<void> {
    // 既に実行中の場合はスキップ（二重実行防止）
    if (this.isRunning) {
      this.logger.warn('前回のチェックがまだ実行中のため、スキップします');
      return;
    }

    try {
      this.isRunning = true;
      this.logger.log('定期接続チェックを開始します');

      // 金融機関リストを取得（InstitutionAggregationServiceを使用）
      const institutions =
        await this.institutionAggregationService.getAllInstitutions();

      if (institutions.length === 0) {
        this.logger.warn(
          '登録されている金融機関がありません。チェックをスキップします。',
        );
        return;
      }

      // 全金融機関をチェック
      const results = await this.checkConnectionStatusUseCase.execute(
        {},
        institutions,
      );

      const errorCount = results.filter((r) => r.errorMessage).length;

      if (errorCount > 0) {
        this.logger.warn(
          `定期接続チェック完了: ${errorCount}/${results.length}件で問題が検出されました`,
        );
        // TODO: FR-005 (通知機能) を実装後に通知を送信
      } else {
        this.logger.log(
          `定期接続チェック完了: 全${results.length}件の金融機関は正常です`,
        );
      }
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
  async triggerManualCheck(institutions: IInstitutionInfo[]): Promise<void> {
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
