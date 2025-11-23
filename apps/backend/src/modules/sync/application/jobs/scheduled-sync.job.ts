import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SyncAllTransactionsUseCase } from '../use-cases/sync-all-transactions.use-case';

/**
 * スケジュール同期ジョブのメトリクス
 */
interface SyncMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecutionTime: Date | null;
  lastSuccessTime: Date | null;
  lastFailureTime: Date | null;
}

/**
 * スケジュール同期ジョブ
 *
 * @description
 * 定期的に全金融機関の取引履歴を自動同期します。
 * - デフォルト: 毎日午前4時に実行
 * - 重複実行チェック
 * - メトリクス収集
 * - エラー通知
 *
 * @infrastructure
 * @layer Infrastructure
 */
@Injectable()
export class ScheduledSyncJob {
  private readonly logger = new Logger(ScheduledSyncJob.name);
  private isRunning = false;
  private currentSchedule = '0 4 * * *'; // デフォルト: 毎日午前4時
  private timezone = 'Asia/Tokyo';
  private enabled = true;

  // メトリクス
  private metrics: SyncMetrics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageDuration: 0,
    lastExecutionTime: null,
    lastSuccessTime: null,
    lastFailureTime: null,
  };

  constructor(
    private readonly syncAllTransactionsUseCase: SyncAllTransactionsUseCase,
  ) {}

  /**
   * デフォルトの定期実行（毎日午前4時）
   */
  @Cron('0 4 * * *', {
    name: 'scheduled-sync',
    timeZone: 'Asia/Tokyo',
  })
  async handleCron(): Promise<void> {
    if (!this.enabled) {
      this.logger.log('スケジュール同期は無効化されています');
      return;
    }

    await this.executeSyncJob();
  }

  /**
   * 同期ジョブを実行
   */
  private async executeSyncJob(): Promise<void> {
    // 重複実行チェック
    if (this.isRunning) {
      this.logger.warn(
        '⚠️  前回の同期がまだ実行中です。今回の実行をスキップします。',
      );
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    this.metrics.lastExecutionTime = new Date();
    this.metrics.totalExecutions++;

    this.logger.log('=== 自動同期開始 ===');

    try {
      // 全金融機関を同期
      const result = await this.syncAllTransactionsUseCase.execute({
        forceFullSync: false,
      });

      const duration = Date.now() - startTime;
      const durationSec = (duration / 1000).toFixed(2);

      // メトリクス更新
      this.updateMetrics(true, duration);

      if (result.summary.failureCount === 0) {
        // 全成功
        this.logger.log(
          `=== 自動同期完了 ===\n` +
            `  対象金融機関: ${result.summary.totalInstitutions}件\n` +
            `  新規データ: ${result.summary.totalNew}件\n` +
            `  重複データ: ${result.summary.totalDuplicate}件\n` +
            `  処理時間: ${durationSec}秒`,
        );
      } else {
        // 一部失敗
        this.logger.error(
          `=== 自動同期完了（エラーあり） ===\n` +
            `  対象金融機関: ${result.summary.totalInstitutions}件\n` +
            `  成功: ${result.summary.successCount}件\n` +
            `  失敗: ${result.summary.failureCount}件\n` +
            `  新規データ: ${result.summary.totalNew}件\n` +
            `  処理時間: ${durationSec}秒`,
        );

        // エラー通知（TODO: 実装）
        this.notifyErrors(result);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(false, duration);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ 自動同期失敗: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // 致命的エラーの通知（TODO: 実装）
      this.notifyCriticalError(error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * メトリクスを更新
   */
  private updateMetrics(success: boolean, duration: number): void {
    if (success) {
      this.metrics.successfulExecutions++;
      this.metrics.lastSuccessTime = new Date();
    } else {
      this.metrics.failedExecutions++;
      this.metrics.lastFailureTime = new Date();
    }

    // 移動平均で計算
    this.metrics.averageDuration =
      (this.metrics.averageDuration * (this.metrics.totalExecutions - 1) +
        duration) /
      this.metrics.totalExecutions;
  }

  /**
   * エラー通知（一部失敗）
   */
  private notifyErrors(result: {
    results: Array<{ success: boolean; errorMessage: string | null }>;
    summary: { failureCount: number };
  }): void {
    // TODO: 通知サービスの実装
    // 例: Slackへの通知、メール送信など
    const failedInstitutions = result.results.filter((r) => !r.success);
    this.logger.warn(
      `通知: ${result.summary.failureCount}件の金融機関で同期が失敗しました`,
    );
    this.logger.debug('失敗した金融機関:', failedInstitutions);
  }

  /**
   * 致命的エラーの通知（全失敗）
   */
  private notifyCriticalError(error: unknown): void {
    // TODO: 緊急通知の実装
    // 例: PagerDuty、管理者への直接通知など
    this.logger.error('致命的エラーが発生しました:', error);
  }

  /**
   * スケジュールを動的に更新
   *
   * @param cronExpression - cron式
   * @param timezone - タイムゾーン
   */
  updateSchedule(cronExpression: string, timezone?: string): void {
    this.logger.log(
      `スケジュール更新: ${cronExpression} (${timezone || this.timezone})`,
    );

    this.currentSchedule = cronExpression;
    if (timezone) {
      this.timezone = timezone;
    }

    // TODO: 動的スケジュール更新の実装
    // NestJSのSchedulerRegistryを使用した実装が必要
    this.logger.warn(
      '動的スケジュール更新は未実装です。アプリケーション再起動が必要です。',
    );

    this.logger.log('スケジュール更新完了');
  }

  /**
   * スケジュールを有効化/無効化
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.logger.log(`スケジュール同期: ${enabled ? '有効化' : '無効化'}`);
  }

  /**
   * 同期が実行中かどうか
   */
  isRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 現在のスケジュール設定を取得
   */
  getSchedule(): {
    cronExpression: string;
    timezone: string;
    enabled: boolean;
  } {
    return {
      cronExpression: this.currentSchedule,
      timezone: this.timezone,
      enabled: this.enabled,
    };
  }

  /**
   * メトリクスを取得
   */
  getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  /**
   * メトリクスをリセット
   */
  resetMetrics(): void {
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageDuration: 0,
      lastExecutionTime: null,
      lastSuccessTime: null,
      lastFailureTime: null,
    };
    this.logger.log('メトリクスをリセットしました');
  }
}
