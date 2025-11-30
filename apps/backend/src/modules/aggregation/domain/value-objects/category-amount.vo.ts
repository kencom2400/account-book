/**
 * カテゴリ別金額 Value Object
 *
 * カテゴリ別の集計金額を保持する値オブジェクト
 * 不変（immutable）として扱う
 */
export class CategoryAmount {
  constructor(
    public readonly category: string,
    public readonly amount: number,
    public readonly count: number,
  ) {
    if (!category) {
      throw new Error('Category is required');
    }
    if (amount < 0) {
      throw new Error('Amount must be non-negative');
    }
    if (count < 0) {
      throw new Error('Count must be non-negative');
    }
    // 金額は整数（円単位）であることを保証
    if (!Number.isInteger(amount)) {
      throw new Error('Amount must be an integer (yen unit)');
    }
    if (!Number.isInteger(count)) {
      throw new Error('Count must be an integer');
    }
  }

  /**
   * プレーンオブジェクトに変換
   */
  toPlain(): {
    category: string;
    amount: number;
    count: number;
  } {
    return {
      category: this.category,
      amount: this.amount,
      count: this.count,
    };
  }

  /**
   * プレーンオブジェクトから生成
   */
  static fromPlain(plain: {
    category: string;
    amount: number;
    count: number;
  }): CategoryAmount {
    return new CategoryAmount(plain.category, plain.amount, plain.count);
  }
}
