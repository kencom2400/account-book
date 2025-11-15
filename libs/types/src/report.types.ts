import { CategoryType } from './transaction.types';

export interface MonthlyReport {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  categoryBreakdown: CategoryBreakdown[];
  dailyTotals: DailyTotal[];
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  type: CategoryType;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface DailyTotal {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface YearlyReport {
  year: number;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  monthlyTotals: MonthlyTotal[];
  categoryBreakdown: CategoryBreakdown[];
}

export interface MonthlyTotal {
  month: number;
  income: number;
  expense: number;
  net: number;
}
