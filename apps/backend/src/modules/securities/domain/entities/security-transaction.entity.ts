export interface SecurityTransactionJSONResponse {
  id: string;
  securitiesAccountId: string;
  securityCode: string;
  securityName: string;
  transactionDate: Date;
  transactionType:
    | 'buy'
    | 'sell'
    | 'dividend'
    | 'distribution'
    | 'split'
    | 'other';
  quantity: number;
  price: number;
  amount: number;
  fee: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

/**
 * SecurityTransactionエンティティ
 * 証券取引履歴を表すドメインエンティティ
 */
export class SecurityTransactionEntity {
  constructor(
    public readonly id: string,
    public readonly securitiesAccountId: string,
    public readonly securityCode: string, // 銘柄コード
    public readonly securityName: string, // 銘柄名
    public readonly transactionDate: Date, // 取引日
    public readonly transactionType:
      | 'buy'
      | 'sell'
      | 'dividend'
      | 'distribution'
      | 'split'
      | 'other',
    public readonly quantity: number, // 数量
    public readonly price: number, // 単価
    public readonly fee: number, // 手数料
    public readonly status: 'pending' | 'completed' | 'cancelled',
    public readonly createdAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id) {
      throw new Error('Transaction ID is required');
    }

    if (!this.securitiesAccountId) {
      throw new Error('Securities account ID is required');
    }

    if (!this.transactionDate) {
      throw new Error('Transaction date is required');
    }

    const validTransactionTypes = [
      'buy',
      'sell',
      'dividend',
      'distribution',
      'split',
      'other',
    ];
    if (!validTransactionTypes.includes(this.transactionType)) {
      throw new Error(`Invalid transaction type: ${this.transactionType}`);
    }

    if (this.quantity < 0) {
      throw new Error('Quantity must be non-negative');
    }

    if (this.price < 0) {
      throw new Error('Price must be non-negative');
    }

    if (this.fee < 0) {
      throw new Error('Fee must be non-negative');
    }

    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(this.status)) {
      throw new Error(`Invalid status: ${this.status}`);
    }

    // 買付・売却の場合は銘柄コードと銘柄名が必須
    if (
      (this.transactionType === 'buy' || this.transactionType === 'sell') &&
      (!this.securityCode || !this.securityName)
    ) {
      throw new Error(
        'Security code and name are required for buy/sell transactions',
      );
    }
  }

  /**
   * 金額を計算（単価 × 数量）
   */
  getAmount(): number {
    return this.quantity * this.price;
  }

  /**
   * 合計金額を計算（買付の場合は金額+手数料、売却の場合は金額-手数料）
   */
  getTotalAmount(): number {
    const amount = this.getAmount();
    if (this.transactionType === 'buy') {
      return amount + this.fee;
    } else if (this.transactionType === 'sell') {
      return amount - this.fee;
    }
    return amount;
  }

  /**
   * 買付取引かどうか
   */
  isBuy(): boolean {
    return this.transactionType === 'buy';
  }

  /**
   * 売却取引かどうか
   */
  isSell(): boolean {
    return this.transactionType === 'sell';
  }

  /**
   * 配当・分配金取引かどうか
   */
  isIncome(): boolean {
    return (
      this.transactionType === 'dividend' ||
      this.transactionType === 'distribution'
    );
  }

  /**
   * 取引完了とマークする
   */
  markAsCompleted(): SecurityTransactionEntity {
    return new SecurityTransactionEntity(
      this.id,
      this.securitiesAccountId,
      this.securityCode,
      this.securityName,
      this.transactionDate,
      this.transactionType,
      this.quantity,
      this.price,
      this.fee,
      'completed',
      this.createdAt,
    );
  }

  /**
   * 取引キャンセルとマークする
   */
  markAsCancelled(): SecurityTransactionEntity {
    return new SecurityTransactionEntity(
      this.id,
      this.securitiesAccountId,
      this.securityCode,
      this.securityName,
      this.transactionDate,
      this.transactionType,
      this.quantity,
      this.price,
      this.fee,
      'cancelled',
      this.createdAt,
    );
  }

  /**
   * プレーンオブジェクトに変換
   */
  toJSON(): SecurityTransactionJSONResponse {
    return {
      id: this.id,
      securitiesAccountId: this.securitiesAccountId,
      securityCode: this.securityCode,
      securityName: this.securityName,
      transactionDate: this.transactionDate,
      transactionType: this.transactionType,
      quantity: this.quantity,
      price: this.price,
      amount: this.getAmount(),
      fee: this.fee,
      totalAmount: this.getTotalAmount(),
      status: this.status,
      createdAt: this.createdAt,
    };
  }
}
