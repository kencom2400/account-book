import { SyncHistory } from '../entities/sync-history.entity';
import { SyncStatus } from '../enums/sync-status.enum';

/**
 * 同期履歴リポジトリインターフェース
 *
 * @description
 * 同期履歴の永続化と取得を担当します。
 * Infrastructure層で実装されます。
 *
 * @domain Sync
 * @layer Domain
 */
export interface ISyncHistoryRepository {
  /**
   * 同期履歴を作成
   *
   * @param syncHistory - 同期履歴エンティティ
   * @returns 作成された同期履歴
   */
  create(syncHistory: SyncHistory): Promise<SyncHistory>;

  /**
   * 同期履歴を更新
   *
   * @param syncHistory - 同期履歴エンティティ
   * @returns 更新された同期履歴
   */
  update(syncHistory: SyncHistory): Promise<SyncHistory>;

  /**
   * IDで同期履歴を取得
   *
   * @param id - 同期履歴ID
   * @returns 同期履歴、見つからない場合はnull
   */
  findById(id: string): Promise<SyncHistory | null>;

  /**
   * 金融機関IDで同期履歴を取得（最新順）
   *
   * @param institutionId - 金融機関ID
   * @param limit - 取得件数制限（デフォルト: 10）
   * @returns 同期履歴の配列
   */
  findByInstitutionId(
    institutionId: string,
    limit?: number,
  ): Promise<SyncHistory[]>;

  /**
   * ステータスで同期履歴を取得
   *
   * @param status - 同期ステータス
   * @returns 同期履歴の配列
   */
  findByStatus(status: SyncStatus): Promise<SyncHistory[]>;

  /**
   * すべての同期履歴を取得（最新順、ページネーション対応）
   *
   * @param limit - 取得件数制限（デフォルト: 20）
   * @param offset - オフセット（デフォルト: 0）
   * @returns 同期履歴の配列
   */
  findAll(limit?: number, offset?: number): Promise<SyncHistory[]>;

  /**
   * フィルタリングされた同期履歴を取得
   *
   * @param filters - フィルタ条件
   * @param limit - 取得件数制限
   * @param offset - オフセット
   * @returns 同期履歴の配列
   */
  findWithFilters(
    filters: {
      institutionId?: string;
      status?: SyncStatus;
      startDate?: Date;
      endDate?: Date;
    },
    limit?: number,
    offset?: number,
  ): Promise<SyncHistory[]>;

  /**
   * フィルタリングされた同期履歴の総数を取得
   *
   * @param filters - フィルタ条件
   * @returns 総数
   */
  countWithFilters(filters: {
    institutionId?: string;
    status?: SyncStatus;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number>;

  /**
   * 最新の同期履歴を取得
   *
   * @returns 最新の同期履歴、存在しない場合はnull
   */
  findLatest(): Promise<SyncHistory | null>;

  /**
   * 実行中の同期を取得
   *
   * @returns 実行中の同期履歴の配列
   */
  findRunning(): Promise<SyncHistory[]>;

  /**
   * 金融機関の最後の成功した同期を取得
   *
   * @param institutionId - 金融機関ID
   * @returns 最後の成功した同期履歴、存在しない場合はnull
   */
  findLastSuccessfulSync(institutionId: string): Promise<SyncHistory | null>;
}
