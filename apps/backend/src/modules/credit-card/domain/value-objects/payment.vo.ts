/**
 * Payment Value Object
 * クレジットカードの支払い情報を表すValue Object
 */
export class PaymentVO {
  constructor(
    public readonly billingMonth: string, // YYYY-MM形式
    public readonly closingDate: Date, // 締め日
    public readonly paymentDueDate: Date, // 支払期限
    public readonly totalAmount: number, // 請求総額
    public readonly paidAmount: number, // 支払済み額
    public readonly remainingAmount: number, // 未払い額
    public readonly status: PaymentStatus,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.billingMonth || !/^\d{4}-\d{2}$/.test(this.billingMonth)) {
      throw new Error('Billing month must be in YYYY-MM format');
    }

    if (!this.closingDate) {
      throw new Error('Closing date is required');
    }

    if (!this.paymentDueDate) {
      throw new Error('Payment due date is required');
    }

    if (this.totalAmount < 0) {
      throw new Error('Total amount must be non-negative');
    }

    if (this.paidAmount < 0) {
      throw new Error('Paid amount must be non-negative');
    }

    if (this.remainingAmount < 0) {
      throw new Error('Remaining amount must be non-negative');
    }

    if (this.paidAmount + this.remainingAmount !== this.totalAmount) {
      throw new Error('Paid amount + remaining amount must equal total amount');
    }

    if (!this.status) {
      throw new Error('Payment status is required');
    }
  }

  /**
   * 支払い完了かどうか
   */
  isPaid(): boolean {
    return this.status === PaymentStatus.PAID;
  }

  /**
   * 支払い期限切れかどうか
   */
  isOverdue(): boolean {
    return (
      this.status === PaymentStatus.UNPAID && this.paymentDueDate < new Date()
    );
  }

  /**
   * 一部支払い済みかどうか
   */
  isPartiallyPaid(): boolean {
    return this.paidAmount > 0 && this.remainingAmount > 0;
  }

  /**
   * 支払い進捗率を計算（パーセンテージ）
   */
  getPaymentProgress(): number {
    if (this.totalAmount === 0) return 0; // 修正: 0円の場合は0%を返す
    return (this.paidAmount / this.totalAmount) * 100;
  }

  /**
   * 支払いを完了する
   */
  markAsPaid(paidDate: Date): PaymentVO {
    return new PaymentVO(
      this.billingMonth,
      this.closingDate,
      paidDate,
      this.totalAmount,
      this.totalAmount,
      0,
      PaymentStatus.PAID,
    );
  }

  /**
   * 一部支払いを記録
   */
  recordPartialPayment(amount: number): PaymentVO {
    if (amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    if (amount > this.remainingAmount) {
      throw new Error('Payment amount cannot exceed remaining amount');
    }

    const newPaidAmount = this.paidAmount + amount;
    const newRemainingAmount = this.totalAmount - newPaidAmount;
    const newStatus =
      newRemainingAmount === 0 ? PaymentStatus.PAID : PaymentStatus.UNPAID;

    return new PaymentVO(
      this.billingMonth,
      this.closingDate,
      this.paymentDueDate,
      this.totalAmount,
      newPaidAmount,
      newRemainingAmount,
      newStatus,
    );
  }

  /**
   * プレーンオブジェクトに変換
   */
  toJSON(): any {
    return {
      billingMonth: this.billingMonth,
      closingDate: this.closingDate,
      paymentDueDate: this.paymentDueDate,
      totalAmount: this.totalAmount,
      paidAmount: this.paidAmount,
      remainingAmount: this.remainingAmount,
      status: this.status,
      isPaid: this.isPaid(),
      isOverdue: this.isOverdue(),
      isPartiallyPaid: this.isPartiallyPaid(),
      paymentProgress: this.getPaymentProgress(),
    };
  }

  /**
   * 等価性チェック
   */
  equals(other: PaymentVO): boolean {
    return (
      this.billingMonth === other.billingMonth &&
      this.closingDate.getTime() === other.closingDate.getTime() &&
      this.paymentDueDate.getTime() === other.paymentDueDate.getTime() &&
      this.totalAmount === other.totalAmount &&
      this.paidAmount === other.paidAmount &&
      this.remainingAmount === other.remainingAmount &&
      this.status === other.status
    );
  }
}

/**
 * 支払いステータス
 */
export enum PaymentStatus {
  UNPAID = 'unpaid', // 未払い
  PAID = 'paid', // 支払済み
  OVERDUE = 'overdue', // 期限切れ
  PENDING = 'pending', // 処理中
}
