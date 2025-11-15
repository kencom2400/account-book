import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

export class DateUtils {
  static formatDate(date: Date, formatStr = 'yyyy-MM-dd'): string {
    return format(date, formatStr, { locale: ja });
  }

  static getMonthRange(year: number, month: number): [Date, Date] {
    const date = new Date(year, month - 1);
    return [startOfMonth(date), endOfMonth(date)];
  }

  static getNextMonth(year: number, month: number): { year: number; month: number } {
    const date = addMonths(new Date(year, month - 1), 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };
  }

  static getPreviousMonth(year: number, month: number): { year: number; month: number } {
    const date = addMonths(new Date(year, month - 1), -1);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };
  }
}
