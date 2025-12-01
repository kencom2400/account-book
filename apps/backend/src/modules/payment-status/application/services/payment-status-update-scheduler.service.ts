import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { AggregationRepository } from '../../../aggregation/domain/repositories/aggregation.repository.interface';
import { AGGREGATION_REPOSITORY } from '../../../aggregation/aggregation.tokens';
import { MonthlyCardSummary } from '../../../aggregation/domain/entities/monthly-card-summary.entity';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import type { PaymentStatusRepository } from '../../domain/repositories/payment-status.repository.interface';
import { PAYMENT_STATUS_REPOSITORY } from '../../payment-status.tokens';
import { UpdatePaymentStatusUseCase } from '../use-cases/update-payment-status.use-case';

/**
 * バッチ処理結果
 */
interface BatchResult {
  success: number;
  failure: number;
  total: number;
  duration: number;
  timestamp: Date;
}

/**
 * 支払いステータス更新スケジューラー
 *
 * 日次バッチ処理により、引落予定日に基づいて自動的にステータスを更新する
 */
@Injectable()
export class PaymentStatusUpdateScheduler {
  private readonly logger = new Logger(PaymentStatusUpdateScheduler.name);

  constructor(
    private readonly updateUseCase: UpdatePaymentStatusUseCase,
    @Inject(AGGREGATION_REPOSITORY)
    private readonly summaryRepository: AggregationRepository,
    @Inject(PAYMENT_STATUS_REPOSITORY)
    private readonly statusRepository: PaymentStatusRepository,
  ) {}

  /**
   * 日次バッチ処理: 自動ステータス更新
   * 毎日深夜0時に実行
   */
  @Cron('0 0 * * *', {
    name: 'PaymentStatusUpdateBatch',
    timeZone: 'Asia/Tokyo',
  })
  async scheduleDailyUpdate(): Promise<void> {
    this.logger.log('PaymentStatusUpdateBatch started');

    try {
      // PENDING → PROCESSING の更新
      const pendingResult = await this.updatePendingToProcessing();

      // PROCESSING → OVERDUE の更新
      const overdueResult = await this.updateProcessingToOverdue();

      this.logger.log(
        `PaymentStatusUpdateBatch completed: ${pendingResult.success + overdueResult.success} succeeded, ${pendingResult.failure + overdueResult.failure} failed`,
      );
    } catch (error) {
      this.logger.error('PaymentStatusUpdateBatch failed', error);
      throw error;
    }
  }

  /**
   * PENDING → PROCESSING の更新
   * 引落予定日の3日前の請求を抽出
   * @returns 更新結果（成功件数、失敗件数、総件数）
   */
  async updatePendingToProcessing(): Promise<{
    success: number;
    failure: number;
    total: number;
  }> {
    return this.processStatusUpdates(
      PaymentStatus.PENDING,
      PaymentStatus.PROCESSING,
      (summary) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const threeDaysBefore = new Date(summary.paymentDate);
        threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
        threeDaysBefore.setHours(0, 0, 0, 0);
        return today >= threeDaysBefore;
      },
      '引落予定日の3日前',
    );
  }

  /**
   * PROCESSING → OVERDUE の更新
   * 引落予定日+7日経過の請求を抽出
   * @returns 更新結果（成功件数、失敗件数、総件数）
   */
  async updateProcessingToOverdue(): Promise<{
    success: number;
    failure: number;
    total: number;
  }> {
    return this.processStatusUpdates(
      PaymentStatus.PROCESSING,
      PaymentStatus.OVERDUE,
      (summary) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAfter = new Date(summary.paymentDate);
        sevenDaysAfter.setDate(sevenDaysAfter.getDate() + 7);
        sevenDaysAfter.setHours(0, 0, 0, 0);
        return today > sevenDaysAfter;
      },
      '引落予定日+7日経過',
    );
  }

  /**
   * ステータス更新の共通処理
   * @param fromStatus 更新元のステータス
   * @param toStatus 更新先のステータス
   * @param updateCondition 更新条件（MonthlyCardSummaryを受け取り、更新すべきかどうかを返す）
   * @param reason ステータス変更理由
   * @returns 更新結果（成功件数、失敗件数、総件数）
   */
  private async processStatusUpdates(
    fromStatus: PaymentStatus,
    toStatus: PaymentStatus,
    updateCondition: (summary: MonthlyCardSummary) => boolean,
    reason: string,
  ): Promise<{ success: number; failure: number; total: number }> {
    this.logger.log(`Updating ${fromStatus} to ${toStatus}...`);

    const records = await this.statusRepository.findAllByStatus(fromStatus);

    if (records.length === 0) {
      this.logger.log(`No ${fromStatus} records found`);
      return { success: 0, failure: 0, total: 0 };
    }

    // N+1問題を回避: 必要なMonthlyCardSummaryを一括取得
    const cardSummaryIds = records.map((r) => r.cardSummaryId);
    const summaries = await this.summaryRepository.findByIds(cardSummaryIds);
    const summaryMap = new Map(summaries.map((s) => [s.id, s]));

    // 並列処理用のタスクを作成
    const updateTasks = records
      .map((record) => {
        const summary = summaryMap.get(record.cardSummaryId);

        if (!summary) {
          this.logger.warn(
            `MonthlyCardSummary not found: ${record.cardSummaryId}`,
          );
          return null;
        }

        // 更新条件をチェック
        if (updateCondition(summary)) {
          return {
            cardSummaryId: record.cardSummaryId,
            promise: this.updateUseCase.executeAutomatically(
              record.cardSummaryId,
              toStatus,
              reason,
            ),
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // 並列処理を実行
    const results = await Promise.allSettled(updateTasks.map((t) => t.promise));

    let successCount = 0;
    let failureCount = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        failureCount++;
        this.logger.error(
          `Failed to update status for ${updateTasks[index].cardSummaryId}`,
          result.reason,
        );
      }
    });

    this.logger.log(
      `${fromStatus} → ${toStatus}: ${successCount}/${records.length} updated (${failureCount} failed)`,
    );

    return {
      success: successCount,
      failure: failureCount,
      total: records.length,
    };
  }

  /**
   * 手動実行用メソッド（テスト・デバッグ用）
   */
  async executeManually(): Promise<BatchResult> {
    const startTime = Date.now();

    try {
      const pendingResult = await this.updatePendingToProcessing();
      const overdueResult = await this.updateProcessingToOverdue();

      const success = pendingResult.success + overdueResult.success;
      const failure = pendingResult.failure + overdueResult.failure;
      const total = pendingResult.total + overdueResult.total;

      return {
        success,
        failure,
        total,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Manual execution failed', error);
      throw error;
    }
  }
}
