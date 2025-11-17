import { ConnectionHistory } from '../entities/connection-history.entity';

/**
 * 接続履歴リポジトリのインターフェース
 */
export const CONNECTION_HISTORY_REPOSITORY = Symbol(
  'CONNECTION_HISTORY_REPOSITORY',
);

export interface IConnectionHistoryRepository {
  /**
   * 接続履歴を保存
   */
  save(history: ConnectionHistory): Promise<void>;

  /**
   * 複数の接続履歴を保存
   */
  saveMany(histories: ConnectionHistory[]): Promise<void>;

  /**
   * 特定の金融機関の最新の接続履歴を取得
   */
  findLatestByInstitutionId(
    institutionId: string,
  ): Promise<ConnectionHistory | null>;

  /**
   * 全金融機関の最新の接続履歴を取得
   */
  findAllLatest(): Promise<ConnectionHistory[]>;

  /**
   * 特定の金融機関の接続履歴を期間指定で取得
   */
  findByInstitutionIdAndDateRange(
    institutionId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ConnectionHistory[]>;

  /**
   * 全接続履歴を取得（制限付き）
   */
  findAll(limit?: number): Promise<ConnectionHistory[]>;

  /**
   * 古い接続履歴を削除（保持期間を過ぎたもの）
   */
  deleteOlderThan(date: Date): Promise<number>;
}
