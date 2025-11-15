export interface MonthlyReport {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface YearlyReport {
  year: number;
  monthlyData: MonthlyReport[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

