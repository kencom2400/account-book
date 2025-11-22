import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncTransactionsUseCase } from '../use-cases/sync-transactions.use-case';

/**
 * スケジュール同期ジョブ
 * 定期的に取引履歴を自動同期する
 */
@Injectable()
export class ScheduledSyncJob {
  private readonly logger = new Logger(ScheduledSyncJob.name);
  private isRunning = false;

  constructor(
    private readonly syncTransactionsUseCase: SyncTransactionsUseCase,
  ) {}

  /**
   * 1日1回（午前3時）に自動同期を実行
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailySync(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Sync is already running. Skipping this execution.');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting scheduled daily sync...');

    try {
      const result = await this.syncTransactionsUseCase.execute({});

      this.logger.log(
        `Scheduled sync completed successfully: ${result.successCount} success, ${result.failureCount} failed, ${result.newTransactionsCount} new transactions`,
      );
    } catch (error) {
      this.logger.error(
        `Scheduled sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 同期が実行中かどうかを確認
   */
  isSyncRunning(): boolean {
    return this.isRunning;
  }
}
