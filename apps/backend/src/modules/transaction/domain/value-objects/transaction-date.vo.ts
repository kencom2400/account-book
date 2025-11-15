/**
 * TransactionDate Value Object
 * 取引日を表す値オブジェクト
 */
export class TransactionDate {
  constructor(public readonly value: Date) {
    this.validate();
  }

  private validate(): void {
    if (!this.value) {
      throw new Error('Transaction date is required');
    }

    if (!(this.value instanceof Date) || isNaN(this.value.getTime())) {
      throw new Error('Invalid transaction date');
    }
  }

  /**
   * 未来の日付かどうか
   */
  isFuture(): boolean {
    return this.value > new Date();
  }

  /**
   * 過去の日付かどうか
   */
  isPast(): boolean {
    return this.value < new Date();
  }

  /**
   * 今日の日付かどうか
   */
  isToday(): boolean {
    const today = new Date();
    return (
      this.value.getFullYear() === today.getFullYear() &&
      this.value.getMonth() === today.getMonth() &&
      this.value.getDate() === today.getDate()
    );
  }

  /**
   * 指定された月に属するかどうか
   */
  isInMonth(year: number, month: number): boolean {
    return (
      this.value.getFullYear() === year &&
      this.value.getMonth() + 1 === month
    );
  }

  /**
   * 指定された年に属するかどうか
   */
  isInYear(year: number): boolean {
    return this.value.getFullYear() === year;
  }

  /**
   * 日付を文字列として返す (YYYY-MM-DD)
   */
  toDateString(): string {
    const year = this.value.getFullYear();
    const month = String(this.value.getMonth() + 1).padStart(2, '0');
    const day = String(this.value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 月を表す文字列を返す (YYYY-MM)
   */
  toMonthString(): string {
    const year = this.value.getFullYear();
    const month = String(this.value.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * 等価性の判定
   */
  equals(other: TransactionDate): boolean {
    return this.value.getTime() === other.value.getTime();
  }
}

