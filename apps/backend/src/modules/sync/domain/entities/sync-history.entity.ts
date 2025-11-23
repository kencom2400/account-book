import { SyncStatus } from '../enums/sync-status.enum';
import { randomUUID } from 'crypto';

/**
 * 同期履歴エンティティ
 *
 * @description
 * 各金融機関の取引履歴同期の実行記録を管理します。
 * 同期の開始、進行、完了、失敗を追跡し、詳細な統計情報を保持します。
 *
 * @domain Sync
 * @layer Domain
 */
export class SyncHistory {
  constructor(
    /** 同期履歴ID（UUID） */
    public readonly id: string,

    /** 金融機関ID */
    public readonly institutionId: string,

    /** 金融機関名 */
    public readonly institutionName: string,

    /** 金融機関種別（bank/credit-card/securities） */
    public readonly institutionType: string,

    /** 同期ステータス */
    public readonly status: SyncStatus,

    /** 開始日時 */
    public readonly startedAt: Date,

    /** 完了日時 */
    public readonly completedAt: Date | null,

    /** 取得件数 */
    public readonly totalFetched: number,

    /** 新規データ件数 */
    public readonly newRecords: number,

    /** 重複データ件数 */
    public readonly duplicateRecords: number,

    /** エラーメッセージ（失敗時） */
    public readonly errorMessage: string | null,

    /** リトライ回数 */
    public readonly retryCount: number,

    /** 作成日時 */
    public readonly createdAt: Date,

    /** 更新日時 */
    public readonly updatedAt: Date,
  ) {}

  /**
   * 同期履歴を作成（新規）
   *
   * @param institutionId - 金融機関ID
   * @param institutionName - 金融機関名
   * @param institutionType - 金融機関種別
   * @returns 新規SyncHistoryインスタンス
   */
  static create(
    institutionId: string,
    institutionName: string,
    institutionType: string,
  ): SyncHistory {
    const now = new Date();
    return new SyncHistory(
      randomUUID(),
      institutionId,
      institutionName,
      institutionType,
      SyncStatus.PENDING,
      now,
      null,
      0,
      0,
      0,
      null,
      0,
      now,
      now,
    );
  }

  /**
   * 同期を開始状態にする
   *
   * @returns 更新されたSyncHistoryインスタンス
   */
  markAsRunning(): SyncHistory {
    return new SyncHistory(
      this.id,
      this.institutionId,
      this.institutionName,
      this.institutionType,
      SyncStatus.RUNNING,
      this.startedAt,
      this.completedAt,
      this.totalFetched,
      this.newRecords,
      this.duplicateRecords,
      this.errorMessage,
      this.retryCount,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 同期を完了状態にする
   *
   * @param totalFetched - 取得件数
   * @param newRecords - 新規データ件数
   * @param duplicateRecords - 重複データ件数
   * @returns 更新されたSyncHistoryインスタンス
   */
  markAsCompleted(
    totalFetched: number,
    newRecords: number,
    duplicateRecords: number,
  ): SyncHistory {
    const now = new Date();
    return new SyncHistory(
      this.id,
      this.institutionId,
      this.institutionName,
      this.institutionType,
      SyncStatus.COMPLETED,
      this.startedAt,
      now,
      totalFetched,
      newRecords,
      duplicateRecords,
      this.errorMessage,
      this.retryCount,
      this.createdAt,
      now,
    );
  }

  /**
   * 同期を失敗状態にする
   *
   * @param errorMessage - エラーメッセージ
   * @returns 更新されたSyncHistoryインスタンス
   */
  markAsFailed(errorMessage: string): SyncHistory {
    const now = new Date();
    return new SyncHistory(
      this.id,
      this.institutionId,
      this.institutionName,
      this.institutionType,
      SyncStatus.FAILED,
      this.startedAt,
      now,
      this.totalFetched,
      this.newRecords,
      this.duplicateRecords,
      errorMessage,
      this.retryCount,
      this.createdAt,
      now,
    );
  }

  /**
   * 同期をキャンセル状態にする
   *
   * @returns 更新されたSyncHistoryインスタンス
   */
  markAsCancelled(): SyncHistory {
    const now = new Date();
    return new SyncHistory(
      this.id,
      this.institutionId,
      this.institutionName,
      this.institutionType,
      SyncStatus.CANCELLED,
      this.startedAt,
      now,
      this.totalFetched,
      this.newRecords,
      this.duplicateRecords,
      this.errorMessage,
      this.retryCount,
      this.createdAt,
      now,
    );
  }

  /**
   * リトライ回数を増やす
   *
   * @returns 更新されたSyncHistoryインスタンス
   */
  incrementRetryCount(): SyncHistory {
    return new SyncHistory(
      this.id,
      this.institutionId,
      this.institutionName,
      this.institutionType,
      this.status,
      this.startedAt,
      this.completedAt,
      this.totalFetched,
      this.newRecords,
      this.duplicateRecords,
      this.errorMessage,
      this.retryCount + 1,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 同期が完了しているか
   *
   * @returns 完了している場合true
   */
  isCompleted(): boolean {
    return this.status === SyncStatus.COMPLETED;
  }

  /**
   * 同期が実行中かどうか
   *
   * @returns 実行中の場合true
   */
  isRunning(): boolean {
    return this.status === SyncStatus.RUNNING;
  }

  /**
   * 同期が失敗したか
   *
   * @returns 失敗している場合true
   */
  isFailed(): boolean {
    return this.status === SyncStatus.FAILED;
  }

  /**
   * 同期がキャンセルされたか
   *
   * @returns キャンセルされている場合true
   */
  isCancelled(): boolean {
    return this.status === SyncStatus.CANCELLED;
  }

  /**
   * 処理時間を計算（ミリ秒）
   *
   * @returns 処理時間（ミリ秒）、完了していない場合はnull
   */
  getDuration(): number | null {
    if (!this.completedAt) {
      return null;
    }
    return this.completedAt.getTime() - this.startedAt.getTime();
  }
}
