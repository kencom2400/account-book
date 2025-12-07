import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SyncAllTransactionsUseCase } from '../use-cases/sync-all-transactions.use-case';
import { SyncAllTransactionsResult } from '../dto/sync-result.dto';
import type { ISchedulerService } from '../services/scheduler.service.interface';
import { SyncSettings } from '../../domain/entities/sync-settings.entity';
import { InstitutionSyncSettings } from '../../domain/entities/institution-sync-settings.entity';
import { SyncIntervalType } from '../../domain/enums/sync-interval-type.enum';
import type { ISyncSettingsRepository } from '../../domain/repositories/sync-settings.repository.interface';
import { SYNC_SETTINGS_REPOSITORY } from '../../sync.tokens';

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
export class ScheduledSyncJob implements ISchedulerService {
  private readonly logger = new Logger(ScheduledSyncJob.name);
  private isRunning = false;
  private currentSchedule = '0 4 * * *'; // デフォルト: 毎日午前4時
  private timezone = 'Asia/Tokyo';
  private enabled = true;
  private readonly jobName = 'scheduled-sync';

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
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(SYNC_SETTINGS_REPOSITORY)
    private readonly syncSettingsRepository: ISyncSettingsRepository,
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
        '前回の同期がまだ実行中です。今回の実行をスキップします。',
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

        // TODO: エラー通知機能の実装。詳細は未実装機能リストを参照。
        // 【参照】: docs/detailed-design/FR-006_auto-fetch-transactions/未実装機能リスト.md
        // 【実装方針】: NotificationServiceを使用してSlack/Email等に通知
        this.notifyErrors(result);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(false, duration);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `[ERROR] 自動同期失敗: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // TODO: 致命的エラーの緊急通知機能を実装。詳細は未実装機能リストを参照。
      // 【参照】: docs/detailed-design/FR-006_auto-fetch-transactions/未実装機能リスト.md
      // 【実装方針】: PagerDuty、管理者への直接通知などの緊急通知システムを導入
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
  private notifyErrors(result: SyncAllTransactionsResult): void {
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
   * 全体のスケジュールを更新（ISchedulerService実装）
   *
   * @param settings - 同期設定
   */
  updateSchedule(settings: SyncSettings): void {
    this.logger.log('全体のスケジュールを更新');

    // デフォルト同期間隔からCron式を取得
    const cronExpression = settings.defaultInterval.toCronExpression();
    if (!cronExpression) {
      this.logger.warn('Cron式が生成できませんでした（手動同期のみ）');
      return;
    }
    const timezone = this.timezone;

    this.updateCronJob(cronExpression, timezone);

    this.logger.log(`スケジュール更新完了: ${cronExpression}`);
  }

  /**
   * 特定金融機関のスケジュールを更新（ISchedulerService実装）
   *
   * @param institutionId - 金融機関ID
   * @param _settings - 金融機関同期設定（現在は使用しないが、インターフェースの互換性のため保持）
   */
  async updateInstitutionSchedule(
    institutionId: string,
    _settings: InstitutionSyncSettings,
  ): Promise<void> {
    this.logger.log(
      `金融機関のスケジュールを更新: institutionId=${institutionId}`,
    );

    // 金融機関ごとの個別スケジュールは、全体スケジュールとは別に管理
    // 現在の実装では、全体スケジュールのみをサポート
    // 将来的に金融機関ごとの個別スケジュールをサポートする場合は、
    // ジョブ名を`${this.jobName}-${institutionId}`のようにして管理

    // 全金融機関設定を取得して、最も頻繁な間隔を算出
    const allInstitutionSettings =
      await this.syncSettingsRepository.findAllInstitutionSettings();

    // 有効で、手動以外の設定のみを対象
    const validSettings = allInstitutionSettings.filter(
      (s) => s.enabled && s.interval.type !== SyncIntervalType.MANUAL,
    );

    if (validSettings.length === 0) {
      this.logger.warn(
        '有効な金融機関設定が存在しないため、スケジュールを更新しません',
      );
      return;
    }

    // 最も短い間隔（最も頻繁な間隔）を算出
    let shortestInterval = validSettings[0].interval;
    for (const s of validSettings) {
      if (s.interval.toMinutes() < shortestInterval.toMinutes()) {
        shortestInterval = s.interval;
      }
    }

    const cronExpression = shortestInterval.toCronExpression();
    if (cronExpression) {
      this.updateCronJob(cronExpression, this.timezone);
      this.logger.log(
        `金融機関スケジュール更新完了: institutionId=${institutionId}, 最も頻繁な間隔=${cronExpression}`,
      );
    }
  }

  /**
   * CronJobを動的に更新
   *
   * @param cronExpression - cron式
   * @param timezone - タイムゾーン
   */
  private updateCronJob(cronExpression: string, timezone: string): void {
    try {
      // 既存のジョブを削除
      const existingJob = this.schedulerRegistry
        .getCronJobs()
        .get(this.jobName);
      if (existingJob) {
        void existingJob.stop();
        this.schedulerRegistry.deleteCronJob(this.jobName);
      }

      // 新しいスケジュールでジョブを再登録

      const job = new CronJob(
        cronExpression,
        () => {
          void this.handleCron();
        },
        null,
        this.enabled,
        timezone,
      );

      this.schedulerRegistry.addCronJob(this.jobName, job);

      if (this.enabled) {
        void job.start();
      }

      this.currentSchedule = cronExpression;
      this.timezone = timezone;

      this.logger.log(
        `CronJobを動的に更新しました: ${cronExpression} (${timezone})`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`CronJob更新に失敗しました: ${errorMessage}`, error);
      throw error;
    }
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
  isSyncRunning(): boolean {
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
