import { PaymentStatus } from '../enums/payment-status.enum';
import { CategoryAmount } from '../value-objects/category-amount.vo';

/**
 * 月別カード集計 Entity
 *
 * クレジットカード利用明細の月別集計データを保持し、支払額計算を行う
 */
export class MonthlyCardSummary {
  constructor(
    public readonly id: string,
    public readonly cardId: string,
    public readonly cardName: string,
    public readonly billingMonth: string,
    public readonly closingDate: Date,
    public readonly paymentDate: Date,
    public readonly totalAmount: number,
    public readonly transactionCount: number,
    public readonly categoryBreakdown: CategoryAmount[],
    public readonly transactionIds: string[],
    public readonly netPaymentAmount: number,
    public readonly status: PaymentStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * バリデーション
   */
  private validate(): void {
    if (!this.id) {
      throw new Error('ID is required');
    }
    if (!this.cardId) {
      throw new Error('Card ID is required');
    }
    if (!this.cardName) {
      throw new Error('Card name is required');
    }
    if (!this.billingMonth) {
      throw new Error('Billing month is required');
    }
    // YYYY-MM形式チェック
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(this.billingMonth)) {
      throw new Error('Billing month must be in YYYY-MM format');
    }
    if (!this.closingDate) {
      throw new Error('Closing date is required');
    }
    if (!this.paymentDate) {
      throw new Error('Payment date is required');
    }
    if (this.totalAmount < 0) {
      throw new Error('Total amount must be non-negative');
    }
    // 金額は整数（円単位）であることを保証
    if (!Number.isInteger(this.totalAmount)) {
      throw new Error('Total amount must be an integer (yen unit)');
    }
    if (this.transactionCount < 0) {
      throw new Error('Transaction count must be non-negative');
    }
    if (!Number.isInteger(this.transactionCount)) {
      throw new Error('Transaction count must be an integer');
    }
    if (!Array.isArray(this.categoryBreakdown)) {
      throw new Error('Category breakdown must be an array');
    }
    if (!Array.isArray(this.transactionIds)) {
      throw new Error('Transaction IDs must be an array');
    }
    if (this.netPaymentAmount < 0) {
      throw new Error('Net payment amount must be non-negative');
    }
    if (!Number.isInteger(this.netPaymentAmount)) {
      throw new Error('Net payment amount must be an integer (yen unit)');
    }
    if (!Object.values(PaymentStatus).includes(this.status)) {
      throw new Error('Invalid payment status');
    }
    if (!this.createdAt) {
      throw new Error('Created at is required');
    }
    if (!this.updatedAt) {
      throw new Error('Updated at is required');
    }
  }

  /**
   * 最終支払額を計算
   *
   * FR-012では割引未実装のため、totalAmountをそのまま返す
   * FR-013で割引機能実装時に、割引を控除したロジックに変更予定
   */
  calculateNetPayment(): number {
    return this.totalAmount;
  }

  /**
   * プレーンオブジェクトに変換
   */
  toPlain(): {
    id: string;
    cardId: string;
    cardName: string;
    billingMonth: string;
    closingDate: Date;
    paymentDate: Date;
    totalAmount: number;
    transactionCount: number;
    categoryBreakdown: Array<{
      category: string;
      amount: number;
      count: number;
    }>;
    transactionIds: string[];
    netPaymentAmount: number;
    status: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      cardId: this.cardId,
      cardName: this.cardName,
      billingMonth: this.billingMonth,
      closingDate: this.closingDate,
      paymentDate: this.paymentDate,
      totalAmount: this.totalAmount,
      transactionCount: this.transactionCount,
      categoryBreakdown: this.categoryBreakdown.map((ca) => ca.toPlain()),
      transactionIds: [...this.transactionIds],
      netPaymentAmount: this.netPaymentAmount,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * プレーンオブジェクトから生成
   */
  static fromPlain(plain: {
    id: string;
    cardId: string;
    cardName: string;
    billingMonth: string;
    closingDate: Date;
    paymentDate: Date;
    totalAmount: number;
    transactionCount: number;
    categoryBreakdown: Array<{
      category: string;
      amount: number;
      count: number;
    }>;
    transactionIds: string[];
    netPaymentAmount: number;
    status: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
  }): MonthlyCardSummary {
    return new MonthlyCardSummary(
      plain.id,
      plain.cardId,
      plain.cardName,
      plain.billingMonth,
      plain.closingDate,
      plain.paymentDate,
      plain.totalAmount,
      plain.transactionCount,
      plain.categoryBreakdown.map((ca) => CategoryAmount.fromPlain(ca)),
      plain.transactionIds,
      plain.netPaymentAmount,
      plain.status,
      plain.createdAt,
      plain.updatedAt,
    );
  }
}
