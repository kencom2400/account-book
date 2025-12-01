/**
 * アラート詳細情報 Value Object
 *
 * アラートの詳細情報を保持する不変オブジェクト
 */
export class AlertDetails {
  constructor(
    public readonly cardId: string,
    public readonly cardName: string,
    public readonly billingMonth: string, // YYYY-MM
    public readonly expectedAmount: number,
    public readonly actualAmount: number | null,
    public readonly discrepancy: number | null,
    public readonly paymentDate: Date | null,
    public readonly daysElapsed: number | null,
    public readonly relatedTransactions: string[],
    public readonly reconciliationId: string | null,
  ) {
    this.validate();
  }

  /**
   * バリデーション
   */
  private validate(): void {
    if (!this.cardId) {
      throw new Error('Card ID is required');
    }
    if (!this.cardName) {
      throw new Error('Card name is required');
    }
    if (!this.billingMonth) {
      throw new Error('Billing month is required');
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(this.billingMonth)) {
      throw new Error('Billing month must be in YYYY-MM format');
    }
    if (this.expectedAmount < 0) {
      throw new Error('Expected amount must be non-negative');
    }
    if (this.actualAmount !== null && this.actualAmount < 0) {
      throw new Error('Actual amount must be non-negative');
    }
    if (this.daysElapsed !== null && this.daysElapsed < 0) {
      throw new Error('Days elapsed must be non-negative');
    }
    if (!Array.isArray(this.relatedTransactions)) {
      throw new Error('Related transactions must be an array');
    }
  }

  /**
   * プレーンオブジェクトに変換
   */
  toPlain(): {
    cardId: string;
    cardName: string;
    billingMonth: string;
    expectedAmount: number;
    actualAmount: number | null;
    discrepancy: number | null;
    paymentDate: Date | null;
    daysElapsed: number | null;
    relatedTransactions: string[];
    reconciliationId: string | null;
  } {
    return {
      cardId: this.cardId,
      cardName: this.cardName,
      billingMonth: this.billingMonth,
      expectedAmount: this.expectedAmount,
      actualAmount: this.actualAmount,
      discrepancy: this.discrepancy,
      paymentDate: this.paymentDate,
      daysElapsed: this.daysElapsed,
      relatedTransactions: this.relatedTransactions,
      reconciliationId: this.reconciliationId,
    };
  }

  /**
   * プレーンオブジェクトから生成
   */
  static fromPlain(plain: {
    cardId: string;
    cardName: string;
    billingMonth: string;
    expectedAmount: number;
    actualAmount: number | null;
    discrepancy: number | null;
    paymentDate: Date | null;
    daysElapsed: number | null;
    relatedTransactions: string[];
    reconciliationId: string | null;
  }): AlertDetails {
    return new AlertDetails(
      plain.cardId,
      plain.cardName,
      plain.billingMonth,
      plain.expectedAmount,
      plain.actualAmount,
      plain.discrepancy,
      plain.paymentDate,
      plain.daysElapsed,
      plain.relatedTransactions,
      plain.reconciliationId,
    );
  }
}
