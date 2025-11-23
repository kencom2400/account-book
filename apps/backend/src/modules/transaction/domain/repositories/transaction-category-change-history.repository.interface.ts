import { TransactionCategoryChangeHistoryEntity } from '../entities/transaction-category-change-history.entity';

/**
 * 取引カテゴリ変更履歴リポジトリインターフェース
 * FR-010: 費目の手動修正機能
 */
export interface ITransactionCategoryChangeHistoryRepository {
  /**
   * 変更履歴を保存
   */
  create(
    history: TransactionCategoryChangeHistoryEntity,
  ): Promise<TransactionCategoryChangeHistoryEntity>;

  /**
   * 取引IDで変更履歴を取得
   */
  findByTransactionId(
    transactionId: string,
  ): Promise<TransactionCategoryChangeHistoryEntity[]>;

  /**
   * すべての変更履歴を削除（テスト用）
   */
  deleteAll(): Promise<void>;
}

export const TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY =
  'TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY';
