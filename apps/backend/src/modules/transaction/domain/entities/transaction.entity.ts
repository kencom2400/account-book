import { CategoryType, TransactionStatus } from '@account-book/types';

/**
 * Transactionエンティティ
 * 取引情報を表すドメインエンティティ
 */
export class TransactionEntity {
  constructor(
    public readonly id: string,
    public readonly date: Date,
    public readonly amount: number,
    public readonly category: {
      id: string;
      name: string;
      type: CategoryType;
    },
    public readonly description: string,
    public readonly institutionId: string,
    public readonly accountId: string,
    public readonly status: TransactionStatus,
    public readonly isReconciled: boolean,
    public readonly relatedTransactionId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * エンティティのバリデーション
   */
  private validate(): void {
    if (!this.id) {
      throw new Error('Transaction ID is required');
    }

    if (!this.date) {
      throw new Error('Transaction date is required');
    }

    if (this.amount === undefined || this.amount === null) {
      throw new Error('Transaction amount is required');
    }

    if (!this.category || !this.category.id) {
      throw new Error('Transaction category is required');
    }

    if (!this.description) {
      throw new Error('Transaction description is required');
    }

    if (!this.institutionId) {
      throw new Error('Institution ID is required');
    }

    if (!this.accountId) {
      throw new Error('Account ID is required');
    }
  }

  /**
   * 収入かどうか
   */
  isIncome(): boolean {
    return this.category.type === CategoryType.INCOME;
  }

  /**
   * 支出かどうか
   */
  isExpense(): boolean {
    return this.category.type === CategoryType.EXPENSE;
  }

  /**
   * 振替かどうか
   */
  isTransfer(): boolean {
    return this.category.type === CategoryType.TRANSFER;
  }

  /**
   * 照合済みかどうか
   */
  isReconciliated(): boolean {
    return this.isReconciled;
  }

  /**
   * 取引を照合済みにする
   */
  reconcile(): TransactionEntity {
    return new TransactionEntity(
      this.id,
      this.date,
      this.amount,
      this.category,
      this.description,
      this.institutionId,
      this.accountId,
      this.status,
      true,
      this.relatedTransactionId,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * カテゴリを更新する
   */
  updateCategory(category: {
    id: string;
    name: string;
    type: CategoryType;
  }): TransactionEntity {
    return new TransactionEntity(
      this.id,
      this.date,
      this.amount,
      category,
      this.description,
      this.institutionId,
      this.accountId,
      this.status,
      this.isReconciled,
      this.relatedTransactionId,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 取引ステータスを更新する
   */
  updateStatus(status: TransactionStatus): TransactionEntity {
    return new TransactionEntity(
      this.id,
      this.date,
      this.amount,
      this.category,
      this.description,
      this.institutionId,
      this.accountId,
      status,
      this.isReconciled,
      this.relatedTransactionId,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * プレーンオブジェクトに変換
   */
  toJSON(): any {
    return {
      id: this.id,
      date: this.date,
      amount: this.amount,
      category: this.category,
      description: this.description,
      institutionId: this.institutionId,
      accountId: this.accountId,
      status: this.status,
      isReconciled: this.isReconciled,
      relatedTransactionId: this.relatedTransactionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

