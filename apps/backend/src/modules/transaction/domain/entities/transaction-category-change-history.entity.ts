import { Category } from '@account-book/types';

/**
 * 取引カテゴリ変更履歴エンティティ
 * FR-010: 費目の手動修正機能
 */
export class TransactionCategoryChangeHistoryEntity {
  constructor(
    public readonly id: string,
    public readonly transactionId: string,
    public readonly oldCategory: Category,
    public readonly newCategory: Category,
    public readonly changedAt: Date,
    public readonly changedBy?: string, // 将来的にユーザー認証実装時に使用
  ) {}

  /**
   * 変更内容を人間が読みやすい形式で取得
   */
  getChangeDescription(): string {
    return `「${this.oldCategory.name}」から「${this.newCategory.name}」に変更`;
  }

  /**
   * カテゴリタイプが変更されたかどうか
   */
  isCategoryTypeChanged(): boolean {
    return this.oldCategory.type !== this.newCategory.type;
  }
}
