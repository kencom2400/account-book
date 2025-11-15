export class CurrencyUtils {
  static formatJPY(amount: number): string {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  }

  static parseAmount(value: string): number {
    return parseFloat(value.replace(/[^0-9.-]/g, ''));
  }

  static formatAmount(amount: number, decimals = 0): string {
    return new Intl.NumberFormat('ja-JP', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  }
}
