import { Reconciliation } from '../entities/reconciliation.entity';

/**
 * 照合データリポジトリ インターフェース
 *
 * 照合データの永続化を担当
 */
export interface ReconciliationRepository {
  /**
   * 照合データを保存
   * 既存データがある場合は更新
   */
  save(reconciliation: Reconciliation): Promise<Reconciliation>;

  /**
   * IDで照合データを検索
   */
  findById(id: string): Promise<Reconciliation | null>;

  /**
   * カードIDと請求月で検索
   */
  findByCardAndMonth(
    cardId: string,
    billingMonth: string,
  ): Promise<Reconciliation | null>;

  /**
   * カードIDと期間で複数の照合データを取得
   */
  findByCard(
    cardId: string,
    startMonth: string,
    endMonth: string,
  ): Promise<Reconciliation[]>;

  /**
   * すべての照合データを取得
   */
  findAll(): Promise<Reconciliation[]>;

  /**
   * 照合データを削除
   */
  delete(id: string): Promise<void>;
}
