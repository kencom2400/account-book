import { Injectable, Logger } from '@nestjs/common';
import type { SyncHistory } from '../../domain/entities/sync-history.entity';

/**
 * 差分同期戦略
 *
 * @description
 * 前回の成功した同期以降のデータのみを取得する戦略パターン実装。
 * 重複データを防ぎ、効率的な同期を実現します。
 *
 * @strategy
 * @layer Domain
 */
@Injectable()
export class IncrementalSyncStrategy {
  private readonly logger = new Logger(IncrementalSyncStrategy.name);
  private readonly DEFAULT_LOOKBACK_DAYS = 90; // デフォルト: 過去90日

  /**
   * 同期開始日を決定
   *
   * @param institutionId - 金融機関ID
   * @param lastSuccessfulSync - 最後の成功した同期履歴
   * @param forceFullSync - 全件同期を強制するか
   * @returns 同期開始日
   */
  determineStartDate(
    institutionId: string,
    lastSuccessfulSync: SyncHistory | null,
    forceFullSync = false,
  ): Date {
    // 全件同期が強制されている場合
    if (forceFullSync) {
      const startDate = this.getDefaultStartDate();
      this.logger.log(
        `${institutionId}: 全件同期モード - ${startDate.toISOString()}から取得`,
      );
      return startDate;
    }

    // 前回の成功した同期がある場合
    if (lastSuccessfulSync && lastSuccessfulSync.completedAt) {
      // 安全のため、前回の完了日時から1日前から取得
      // （境界データの取りこぼしを防ぐため）
      const startDate = new Date(lastSuccessfulSync.completedAt);
      startDate.setDate(startDate.getDate() - 1);

      this.logger.log(
        `${institutionId}: 差分同期 - ${startDate.toISOString()}から取得`,
      );
      return startDate;
    }

    // 初回同期の場合
    const startDate = this.getDefaultStartDate();
    this.logger.log(
      `${institutionId}: 初回同期 - ${startDate.toISOString()}から取得`,
    );
    return startDate;
  }

  /**
   * 重複データをフィルタリング
   *
   * @param newTransactions - 新規取得したトランザクション
   * @param existingTransactionIds - 既存のトランザクションIDセット
   * @returns フィルタリング後のトランザクションと統計
   */
  filterDuplicates<T extends { id?: string }>(
    newTransactions: T[],
    existingTransactionIds: Set<string>,
  ): {
    newRecords: T[];
    duplicateRecords: T[];
    stats: {
      total: number;
      new: number;
      duplicate: number;
    };
  } {
    const newRecords: T[] = [];
    const duplicateRecords: T[] = [];

    for (const transaction of newTransactions) {
      if (!transaction.id) {
        // IDがない場合は新規として扱う
        newRecords.push(transaction);
        continue;
      }

      if (existingTransactionIds.has(transaction.id)) {
        duplicateRecords.push(transaction);
      } else {
        newRecords.push(transaction);
      }
    }

    const stats = {
      total: newTransactions.length,
      new: newRecords.length,
      duplicate: duplicateRecords.length,
    };

    this.logger.log(
      `フィルタリング結果: 合計${stats.total}件 (新規${stats.new}件, 重複${stats.duplicate}件)`,
    );

    return { newRecords, duplicateRecords, stats };
  }

  /**
   * 同期期間が適切かどうかを検証
   *
   * @param startDate - 開始日
   * @param endDate - 終了日
   * @returns 検証結果
   */
  validateSyncPeriod(
    startDate: Date,
    endDate: Date,
  ): {
    valid: boolean;
    reason?: string;
  } {
    // 開始日が終了日より後
    if (startDate > endDate) {
      return {
        valid: false,
        reason: '開始日が終了日より後になっています',
      };
    }

    // 期間が長すぎる（365日以上）
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff > 365) {
      return {
        valid: false,
        reason: `同期期間が長すぎます（${daysDiff}日）。最大365日まで。`,
      };
    }

    // 未来の日付
    const now = new Date();
    if (endDate > now) {
      return {
        valid: false,
        reason: '終了日が未来の日付です',
      };
    }

    return { valid: true };
  }

  /**
   * デフォルトの開始日を取得（過去90日）
   */
  private getDefaultStartDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() - this.DEFAULT_LOOKBACK_DAYS);
    return date;
  }

  /**
   * 同期期間を最適化
   *
   * @param startDate - 開始日
   * @param endDate - 終了日
   * @param maxDays - 最大日数（デフォルト: 90日）
   * @returns 最適化された期間
   */
  optimizeSyncPeriod(
    startDate: Date,
    endDate: Date,
    maxDays = 90,
  ): { startDate: Date; endDate: Date; adjusted: boolean } {
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff <= maxDays) {
      return { startDate, endDate, adjusted: false };
    }

    // 期間が長すぎる場合、最近のデータを優先
    const optimizedStartDate = new Date(endDate);
    optimizedStartDate.setDate(optimizedStartDate.getDate() - maxDays);

    this.logger.warn(
      `同期期間を最適化: ${daysDiff}日 → ${maxDays}日 (${optimizedStartDate.toISOString()} - ${endDate.toISOString()})`,
    );

    return {
      startDate: optimizedStartDate,
      endDate,
      adjusted: true,
    };
  }
}
