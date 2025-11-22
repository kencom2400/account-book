import { SyncStatus } from '../enums/sync-status.enum';
import { randomUUID } from 'crypto';

/**
 * 同期履歴エンティティ
 */
export class SyncHistoryEntity {
  constructor(
    /** 同期履歴ID */
    public readonly id: string,
    /** 同期ステータス */
    public readonly status: SyncStatus,
    /** 同期開始日時 */
    public readonly startedAt: Date,
    /** 同期終了日時 */
    public readonly completedAt: Date | null,
    /** 同期対象金融機関数 */
    public readonly totalInstitutions: number,
    /** 成功した金融機関数 */
    public readonly successCount: number,
    /** 失敗した金融機関数 */
    public readonly failureCount: number,
    /** 取得した新規取引数 */
    public readonly newTransactionsCount: number,
    /** エラーメッセージ（失敗時） */
    public readonly errorMessage: string | null,
    /** 詳細エラー情報（JSON） */
    public readonly errorDetails: Record<string, unknown> | null,
    /** 作成日時 */
    public readonly createdAt: Date,
    /** 更新日時 */
    public readonly updatedAt: Date,
  ) {}

  /**
   * 同期履歴を作成
   */
  static create(totalInstitutions: number): SyncHistoryEntity {
    const now = new Date();
    return new SyncHistoryEntity(
      `sync_${randomUUID()}`,
      SyncStatus.PENDING,
      now,
      null,
      totalInstitutions,
      0,
      0,
      0,
      null,
      null,
      now,
      now,
    );
  }

  /**
   * 同期を開始
   */
  start(): SyncHistoryEntity {
    return new SyncHistoryEntity(
      this.id,
      SyncStatus.IN_PROGRESS,
      this.startedAt,
      this.completedAt,
      this.totalInstitutions,
      this.successCount,
      this.failureCount,
      this.newTransactionsCount,
      this.errorMessage,
      this.errorDetails,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 同期を成功として完了
   */
  complete(
    successCount: number,
    failureCount: number,
    newTransactionsCount: number,
  ): SyncHistoryEntity {
    const status =
      failureCount === 0
        ? SyncStatus.SUCCESS
        : successCount === 0
          ? SyncStatus.FAILED
          : SyncStatus.PARTIAL_SUCCESS;

    return new SyncHistoryEntity(
      this.id,
      status,
      this.startedAt,
      new Date(),
      this.totalInstitutions,
      successCount,
      failureCount,
      newTransactionsCount,
      this.errorMessage,
      this.errorDetails,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 同期を失敗として完了
   */
  fail(
    errorMessage: string,
    errorDetails?: Record<string, unknown>,
  ): SyncHistoryEntity {
    return new SyncHistoryEntity(
      this.id,
      SyncStatus.FAILED,
      this.startedAt,
      new Date(),
      this.totalInstitutions,
      this.successCount,
      this.failureCount,
      this.newTransactionsCount,
      errorMessage,
      errorDetails || null,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 新規取引数を更新
   */
  addNewTransactions(count: number): SyncHistoryEntity {
    return new SyncHistoryEntity(
      this.id,
      this.status,
      this.startedAt,
      this.completedAt,
      this.totalInstitutions,
      this.successCount,
      this.failureCount,
      this.newTransactionsCount + count,
      this.errorMessage,
      this.errorDetails,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 同期が完了しているか
   */
  isCompleted(): boolean {
    return this.completedAt !== null;
  }

  /**
   * 同期が成功したか
   */
  isSuccess(): boolean {
    return this.status === SyncStatus.SUCCESS;
  }

  /**
   * 同期が失敗したか
   */
  isFailed(): boolean {
    return this.status === SyncStatus.FAILED;
  }
}
