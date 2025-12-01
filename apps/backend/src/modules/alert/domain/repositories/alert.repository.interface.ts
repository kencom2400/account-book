import { Alert } from '../entities/alert.entity';

/**
 * アラートデータリポジトリ インターフェース
 *
 * アラートデータの永続化を担当
 */
export interface AlertRepository {
  /**
   * アラートデータを保存
   * 既存データがある場合は更新
   */
  save(alert: Alert): Promise<Alert>;

  /**
   * IDでアラートデータを検索
   */
  findById(id: string): Promise<Alert | null>;

  /**
   * 照合結果IDでアラートデータを検索（重複チェック用）
   */
  findByReconciliationId(reconciliationId: string): Promise<Alert | null>;

  /**
   * カードIDと請求月で複数のアラートを取得
   */
  findByCardAndMonth(cardId: string, billingMonth: string): Promise<Alert[]>;

  /**
   * 未解決のアラートを取得
   */
  findUnresolved(): Promise<Alert[]>;

  /**
   * 未読のアラートを取得
   */
  findUnread(): Promise<Alert[]>;

  /**
   * クエリパラメータに基づいてアラートを取得
   */
  findAll(query: {
    level?: string;
    status?: string;
    type?: string;
    cardId?: string;
    billingMonth?: string;
    page?: number;
    limit?: number;
  }): Promise<Alert[]>;

  /**
   * アラートデータを削除
   */
  delete(id: string): Promise<void>;
}
