import { MonthlyCardSummary } from '../entities/monthly-card-summary.entity';

/**
 * 集計データリポジトリ インターフェース
 *
 * 月別カード集計データの永続化を担当
 */
export interface AggregationRepository {
  /**
   * 集計データを保存
   * 既存データがある場合は更新
   */
  save(summary: MonthlyCardSummary): Promise<MonthlyCardSummary>;

  /**
   * IDで集計データを検索
   */
  findById(id: string): Promise<MonthlyCardSummary | null>;

  /**
   * 複数のIDで集計データを一括取得（N+1問題回避用）
   */
  findByIds(ids: string[]): Promise<MonthlyCardSummary[]>;

  /**
   * カードIDと請求月で検索
   */
  findByCardAndMonth(
    cardId: string,
    billingMonth: string,
  ): Promise<MonthlyCardSummary | null>;

  /**
   * カードIDと期間で複数の集計データを取得
   */
  findByCard(
    cardId: string,
    startMonth: string,
    endMonth: string,
  ): Promise<MonthlyCardSummary[]>;

  /**
   * カードIDで集計データをすべて取得（N+1問題回避用）
   */
  findAllByCardId(cardId: string): Promise<MonthlyCardSummary[]>;

  /**
   * すべての集計データを取得
   */
  findAll(): Promise<MonthlyCardSummary[]>;

  /**
   * 集計データを削除
   */
  delete(id: string): Promise<void>;
}
