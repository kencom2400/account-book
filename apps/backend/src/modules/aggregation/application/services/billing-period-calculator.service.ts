import { Injectable } from '@nestjs/common';

/**
 * 請求期間計算サービス
 *
 * 締め日に基づく請求月・支払日の計算を担当
 */
@Injectable()
export class BillingPeriodCalculator {
  /**
   * 取引日と締め日から請求月を判定
   *
   * @param transactionDate 取引日
   * @param closingDay 締め日（1-31、0または31は月末）
   * @returns 請求月（YYYY-MM形式）
   *
   * ロジック:
   * - 取引日 <= 締め日 → 当月請求
   * - 取引日 > 締め日 → 翌月請求
   * - 月末締め（0 or 31）の場合は各月の最終日を考慮
   * - エッジケース: 締め日が29/30で該当日が存在しない月は、その月の最終日を締め日として扱う
   */
  determineBillingMonth(transactionDate: Date, closingDay: number): string {
    const year = transactionDate.getFullYear();
    const month = transactionDate.getMonth(); // 0-11
    const day = transactionDate.getDate();

    // 月末締めの場合
    if (this.isLastDayOfMonth(closingDay)) {
      // 当月請求
      return this.formatYearMonth(year, month);
    }

    // カスタム締め日の場合（エッジケース処理含む）
    // 締め日がその月に存在しない場合（例: 2月30日）、その月の最終日を締め日として扱う
    const actualClosingDay = Math.min(
      closingDay,
      this.getLastDayOfMonth(year, month),
    );

    if (day <= actualClosingDay) {
      // 当月請求
      return this.formatYearMonth(year, month);
    } else {
      // 翌月請求
      return this.formatYearMonth(year, month + 1);
    }
  }

  /**
   * 請求月と締め日から締め日の日付を算出
   *
   * @param billingMonth 請求月（YYYY-MM形式）
   * @param closingDay 締め日（1-31、0または31は月末）
   * @returns 締め日の日付
   */
  calculateClosingDate(billingMonth: string, closingDay: number): Date {
    const [year, month] = this.parseBillingMonth(billingMonth);

    // 月末締めの場合
    if (this.isLastDayOfMonth(closingDay)) {
      const lastDay = this.getLastDayOfMonth(year, month);
      return new Date(year, month, lastDay);
    }

    // カスタム締め日の場合（エッジケース処理）
    const actualClosingDay = Math.min(
      closingDay,
      this.getLastDayOfMonth(year, month),
    );
    return new Date(year, month, actualClosingDay);
  }

  /**
   * 締め日と支払日から支払日の日付を算出
   *
   * @param closingDate 締め日
   * @param paymentDay 支払日（締め日からの日数、例: 翌月27日払いなら27）
   * @returns 支払日の日付
   */
  calculatePaymentDate(closingDate: Date, paymentDay: number): Date {
    const year = closingDate.getFullYear();
    const month = closingDate.getMonth();

    // 翌月の支払日を計算
    const nextMonth = month + 1;
    const nextYear = nextMonth > 11 ? year + 1 : year;
    const actualMonth = nextMonth > 11 ? 0 : nextMonth;

    // エッジケース処理: 支払日がその月に存在しない場合
    const actualPaymentDay = Math.min(
      paymentDay,
      this.getLastDayOfMonth(nextYear, actualMonth),
    );

    return new Date(nextYear, actualMonth, actualPaymentDay);
  }

  /**
   * 月末締めかどうか判定
   *
   * @param closingDay 締め日
   * @returns 月末締めならtrue
   */
  private isLastDayOfMonth(closingDay: number): boolean {
    return closingDay === 0 || closingDay === 31;
  }

  /**
   * 指定年月の最終日を取得（閏年対応）
   *
   * @param year 年
   * @param month 月（0-11）
   * @returns 最終日（1-31）
   */
  private getLastDayOfMonth(year: number, month: number): number {
    // 次の月の0日目 = 当月の最終日
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * 年月をYYYY-MM形式にフォーマット
   *
   * @param year 年
   * @param month 月（0-11）
   * @returns YYYY-MM形式の文字列
   */
  private formatYearMonth(year: number, month: number): string {
    // 12月を超えた場合の処理
    if (month > 11) {
      const yearOffset = Math.floor(month / 12);
      const actualMonth = month % 12;
      return `${year + yearOffset}-${String(actualMonth + 1).padStart(2, '0')}`;
    }

    // 0月未満の場合の処理（通常は発生しないが念のため）
    if (month < 0) {
      const yearOffset = Math.floor((month + 1) / 12) - 1;
      const actualMonth = ((month % 12) + 12) % 12;
      return `${year + yearOffset}-${String(actualMonth + 1).padStart(2, '0')}`;
    }

    return `${year}-${String(month + 1).padStart(2, '0')}`;
  }

  /**
   * YYYY-MM形式の請求月をパース
   *
   * @param billingMonth YYYY-MM形式の文字列
   * @returns [年, 月（0-11）]
   */
  private parseBillingMonth(billingMonth: string): [number, number] {
    const [yearStr, monthStr] = billingMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-11に変換
    return [year, month];
  }
}
