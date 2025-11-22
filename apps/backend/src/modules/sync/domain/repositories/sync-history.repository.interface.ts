import { SyncHistoryEntity } from '../entities/sync-history.entity';

/**
 * 同期履歴リポジトリインターフェース
 */
export interface ISyncHistoryRepository {
  /**
   * 同期履歴を作成
   */
  create(syncHistory: SyncHistoryEntity): Promise<SyncHistoryEntity>;

  /**
   * 同期履歴を更新
   */
  update(syncHistory: SyncHistoryEntity): Promise<SyncHistoryEntity>;

  /**
   * IDで同期履歴を取得
   */
  findById(id: string): Promise<SyncHistoryEntity | null>;

  /**
   * すべての同期履歴を取得（最新順）
   */
  findAll(limit?: number): Promise<SyncHistoryEntity[]>;

  /**
   * 最新の同期履歴を取得
   */
  findLatest(): Promise<SyncHistoryEntity | null>;

  /**
   * 指定期間の同期履歴を取得
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<SyncHistoryEntity[]>;
}
