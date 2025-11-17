/**
 * Money Value Object
 * 金額を表す値オブジェクト
 */
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'JPY',
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.amount === undefined || this.amount === null) {
      throw new Error('Amount is required');
    }

    if (!this.currency) {
      throw new Error('Currency is required');
    }
  }

  /**
   * 金額を加算する
   */
  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  /**
   * 金額を減算する
   */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  /**
   * 金額を乗算する
   */
  multiply(multiplier: number): Money {
    return new Money(this.amount * multiplier, this.currency);
  }

  /**
   * 正の値かどうか
   */
  isPositive(): boolean {
    return this.amount > 0;
  }

  /**
   * 負の値かどうか
   */
  isNegative(): boolean {
    return this.amount < 0;
  }

  /**
   * ゼロかどうか
   */
  isZero(): boolean {
    return this.amount === 0;
  }

  /**
   * 等価性の判定
   */
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  /**
   * 通貨が同じかどうかをチェック
   */
  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: ${this.currency} vs ${other.currency}`,
      );
    }
  }

  /**
   * フォーマットされた文字列を返す
   */
  format(): string {
    return `${this.currency} ${this.amount.toLocaleString()}`;
  }
}
