/**
 * 月別集計APIクライアント
 * FR-012: クレジットカード月別集計
 * FR-016: 月別収支集計
 * FR-020: 年間収支集計
 */

import { CategoryAmount } from '@account-book/types';
import { apiClient } from './client';

/**
 * 月別集計詳細（APIレスポンス用）
 */
export interface MonthlyCardSummary {
  id: string;
  cardId: string;
  cardName: string;
  billingMonth: string; // YYYY-MM
  closingDate: string; // ISO date string
  paymentDate: string; // ISO date string
  totalAmount: number;
  transactionCount: number;
  categoryBreakdown: CategoryAmount[];
  transactionIds: string[];
  netPaymentAmount: number;
  status: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * 集計リクエスト
 */
export interface AggregateCardTransactionsRequest {
  cardId: string;
  startMonth: string; // YYYY-MM
  endMonth: string; // YYYY-MM
}

/**
 * 月別集計一覧項目（簡略版）
 */
export interface MonthlyCardSummaryListItem {
  id: string;
  cardId: string;
  cardName: string;
  billingMonth: string; // YYYY-MM
  totalAmount: number;
  netPaymentAmount: number;
  transactionCount: number;
  status: string;
}

/**
 * 月別収支集計レスポンス（FR-016）
 */

// 取引情報
interface MonthlyBalanceTransaction {
  id: string;
  date: string; // ISO8601形式
  amount: number;
  categoryType: string;
  categoryId: string;
  institutionId: string;
  accountId: string;
  description: string;
}

// 内訳項目の基本情報
interface MonthlyBalanceBreakdownItem {
  amount: number;
  count: number;
  percentage: number;
}

// カテゴリ別内訳
interface MonthlyBalanceCategoryBreakdown extends MonthlyBalanceBreakdownItem {
  categoryId: string;
  categoryName: string;
}

// 金融機関別内訳
interface MonthlyBalanceInstitutionBreakdown extends MonthlyBalanceBreakdownItem {
  institutionId: string;
  institutionName: string;
}

// 収入・支出の詳細情報
interface MonthlyBalanceDetails {
  total: number;
  count: number;
  byCategory: MonthlyBalanceCategoryBreakdown[];
  byInstitution: MonthlyBalanceInstitutionBreakdown[];
  transactions: MonthlyBalanceTransaction[];
}

// 比較データ
interface MonthlyComparison {
  incomeDiff: number;
  expenseDiff: number;
  balanceDiff: number;
  incomeChangeRate: number;
  expenseChangeRate: number;
}

export interface MonthlyBalanceResponse {
  month: string; // YYYY-MM
  income: MonthlyBalanceDetails;
  expense: MonthlyBalanceDetails;
  balance: number;
  savingsRate: number;
  comparison: {
    previousMonth: MonthlyComparison | null;
    sameMonthLastYear: MonthlyComparison | null;
  };
}

/**
 * 年間収支集計レスポンス（FR-020）
 */

// 月別サマリー（年間集計用の簡略版）
export interface YearlyMonthlyBalanceSummary {
  month: string; // YYYY-MM
  income: MonthlyBalanceDetails;
  expense: MonthlyBalanceDetails;
  balance: number;
  savingsRate: number;
}

// トレンド分析
export interface TrendAnalysisDto {
  direction: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  standardDeviation: number;
}

// 年間サマリー
export interface AnnualSummaryData {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  averageIncome: number;
  averageExpense: number;
  savingsRate: number;
}

// トレンドデータ
export interface TrendData {
  incomeProgression: TrendAnalysisDto;
  expenseProgression: TrendAnalysisDto;
  balanceProgression: TrendAnalysisDto;
}

// ハイライトデータ
export interface HighlightsData {
  maxIncomeMonth: string | null;
  maxExpenseMonth: string | null;
  bestBalanceMonth: string | null;
  worstBalanceMonth: string | null;
}

export interface YearlyBalanceResponse {
  year: number;
  months: YearlyMonthlyBalanceSummary[];
  annual: AnnualSummaryData;
  trend: TrendData;
  highlights: HighlightsData;
}

/**
 * 月別集計APIクライアント
 */
export const aggregationApi = {
  /**
   * カード利用明細を月別に集計
   */
  aggregate: async (request: AggregateCardTransactionsRequest): Promise<MonthlyCardSummary[]> => {
    return await apiClient.post<MonthlyCardSummary[]>('/api/aggregation/card/monthly', request);
  },

  /**
   * 月別集計の一覧を取得
   */
  getAll: async (): Promise<MonthlyCardSummaryListItem[]> => {
    return await apiClient.get<MonthlyCardSummaryListItem[]>('/api/aggregation/card/monthly');
  },

  /**
   * カードIDで月別集計の詳細を一括取得（N+1問題回避用）
   */
  getByCardId: async (cardId: string): Promise<MonthlyCardSummary[]> => {
    return await apiClient.get<MonthlyCardSummary[]>(
      `/api/aggregation/card/monthly/card/${cardId}`
    );
  },

  /**
   * 月別集計の詳細を取得
   */
  getById: async (id: string): Promise<MonthlyCardSummary> => {
    return await apiClient.get<MonthlyCardSummary>(`/api/aggregation/card/monthly/${id}`);
  },

  /**
   * 月別集計を削除
   */
  delete: async (id: string): Promise<void> => {
    return await apiClient.delete(`/api/aggregation/card/monthly/${id}`);
  },

  /**
   * 月別収支集計情報を取得（FR-016）
   */
  getMonthlyBalance: async (year: number, month: number): Promise<MonthlyBalanceResponse> => {
    return await apiClient.get<MonthlyBalanceResponse>(
      `/api/aggregation/monthly-balance?year=${year}&month=${month}`
    );
  },

  /**
   * 年間収支集計情報を取得（FR-020）
   */
  getYearlyBalance: async (year: number): Promise<YearlyBalanceResponse> => {
    return await apiClient.get<YearlyBalanceResponse>(
      `/api/aggregation/yearly-balance?year=${year}`
    );
  },
};
