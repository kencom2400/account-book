import { CategoryType } from '@account-book/types';

/**
 * CreditCardTransactionエンティティ
 * クレジットカードの利用明細を表すドメインエンティティ
 */
export class CreditCardTransactionEntity {
  constructor(
    public readonly id: string,
    public readonly creditCardId: string,
    public readonly transactionDate: Date,
    public readonly postingDate: Date, // 計上日
    public readonly amount: number,
    public readonly merchantName: string, // 店舗名
    public readonly merchantCategory: string, // 店舗カテゴリ
    public readonly description: string,
    public readonly category: CategoryType,
    public readonly isInstallment: boolean, // 分割払いかどうか
    public readonly installmentCount: number | null, // 分割回数
    public readonly installmentNumber: number | null, // 現在の回数（例: 3/12）
    public readonly isPaid: boolean, // 支払済みかどうか
    public readonly paymentScheduledDate: Date | null, // 支払予定日
    public readonly paidDate: Date | null, // 実際の支払日
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id) {
      throw new Error('Transaction ID is required');
    }

    if (!this.creditCardId) {
      throw new Error('Credit card ID is required');
    }

    if (!this.transactionDate) {
      throw new Error('Transaction date is required');
    }

    if (!this.postingDate) {
      throw new Error('Posting date is required');
    }

    if (this.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (!this.merchantName) {
      throw new Error('Merchant name is required');
    }

    if (!this.category) {
      throw new Error('Category is required');
    }

    if (this.isInstallment) {
      if (!this.installmentCount || this.installmentCount < 2) {
        throw new Error('Installment count must be at least 2');
      }

      if (!this.installmentNumber || this.installmentNumber < 1) {
        throw new Error('Installment number must be at least 1');
      }

      if (this.installmentNumber > this.installmentCount) {
        throw new Error('Installment number cannot exceed installment count');
      }
    }

    if (this.isPaid && !this.paidDate) {
      throw new Error('Paid date is required when transaction is paid');
    }
  }

  /**
   * 一括払いかどうか
   */
  isOneTimePayment(): boolean {
    return !this.isInstallment;
  }

  /**
   * 分割払いの月額を計算（概算値）
   *
   * @returns 月額の目安（端数は四捨五入）
   *
   * @remarks
   * このメソッドは表示用の概算値を返します。
   * 実際の分割払い計算では、端数処理による累積誤差を避けるため、
   * 最後の支払い額で調整するなどの対応が必要です。
   *
   * 例: 10,000円を3回払い
   * - この計算: 3,333円 × 3回 = 9,999円（1円の誤差）
   * - 正確な計算: 3,333円 + 3,333円 + 3,334円 = 10,000円
   */
  getMonthlyInstallmentAmount(): number {
    if (!this.isInstallment || !this.installmentCount) {
      return this.amount;
    }

    return Math.round(this.amount / this.installmentCount);
  }

  /**
   * 分割払いの各回の支払額を正確に計算
   *
   * @returns 各回の支払額の配列（端数は最後の回で調整）
   *
   * @remarks
   * 累積誤差を避けるため、最後の支払い額で端数を調整します。
   *
   * 例: 10,000円を3回払い
   * - 結果: [3,333, 3,333, 3,334] = 10,000円（誤差なし）
   */
  getAccurateInstallmentAmounts(): number[] {
    if (!this.isInstallment || !this.installmentCount) {
      return [this.amount];
    }

    const baseAmount = Math.floor(this.amount / this.installmentCount);
    const remainder = this.amount - baseAmount * this.installmentCount;

    const amounts: number[] = [];
    for (let i = 0; i < this.installmentCount; i++) {
      // 最後の回に端数を加算
      if (i === this.installmentCount - 1) {
        amounts.push(baseAmount + remainder);
      } else {
        amounts.push(baseAmount);
      }
    }

    return amounts;
  }

  /**
   * 支払い予定かどうか
   */
  isScheduledForPayment(): boolean {
    return !this.isPaid && this.paymentScheduledDate !== null;
  }

  /**
   * 支払い済みにする
   */
  markAsPaid(paidDate: Date): CreditCardTransactionEntity {
    return new CreditCardTransactionEntity(
      this.id,
      this.creditCardId,
      this.transactionDate,
      this.postingDate,
      this.amount,
      this.merchantName,
      this.merchantCategory,
      this.description,
      this.category,
      this.isInstallment,
      this.installmentCount,
      this.installmentNumber,
      true,
      this.paymentScheduledDate,
      paidDate,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 支払予定日を設定
   */
  setPaymentScheduledDate(date: Date): CreditCardTransactionEntity {
    return new CreditCardTransactionEntity(
      this.id,
      this.creditCardId,
      this.transactionDate,
      this.postingDate,
      this.amount,
      this.merchantName,
      this.merchantCategory,
      this.description,
      this.category,
      this.isInstallment,
      this.installmentCount,
      this.installmentNumber,
      this.isPaid,
      date,
      this.paidDate,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * カテゴリを更新
   */
  updateCategory(category: CategoryType): CreditCardTransactionEntity {
    return new CreditCardTransactionEntity(
      this.id,
      this.creditCardId,
      this.transactionDate,
      this.postingDate,
      this.amount,
      this.merchantName,
      this.merchantCategory,
      this.description,
      category,
      this.isInstallment,
      this.installmentCount,
      this.installmentNumber,
      this.isPaid,
      this.paymentScheduledDate,
      this.paidDate,
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
      creditCardId: this.creditCardId,
      transactionDate: this.transactionDate,
      postingDate: this.postingDate,
      amount: this.amount,
      merchantName: this.merchantName,
      merchantCategory: this.merchantCategory,
      description: this.description,
      category: this.category,
      isInstallment: this.isInstallment,
      installmentCount: this.installmentCount,
      installmentNumber: this.installmentNumber,
      monthlyInstallmentAmount: this.getMonthlyInstallmentAmount(),
      isPaid: this.isPaid,
      paymentScheduledDate: this.paymentScheduledDate,
      paidDate: this.paidDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
