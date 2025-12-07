/**
 * 月別集計APIクライアント
 * FR-012: クレジットカード月別集計
 * FR-016: 月別収支集計
 * FR-020: 年間収支推移表示
 * FR-025: カテゴリ別円グラフ表示
 * FR-026: 金融機関別資産残高表示
 */

import { CategoryAmount, CategoryType, InstitutionType, AccountType } from '@account-book/types';
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

// トレンド分析
export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
  standardDeviation: number;
}

// トレンドデータ
export interface TrendData {
  incomeProgression: TrendAnalysis;
  expenseProgression: TrendAnalysis;
  balanceProgression: TrendAnalysis;
}

// 年間サマリー
export interface AnnualSummary {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  averageIncome: number;
  averageExpense: number;
  savingsRate: number;
}

// ハイライト情報
export interface Highlights {
  maxIncomeMonth: string | null; // YYYY-MM
  maxExpenseMonth: string | null; // YYYY-MM
  bestBalanceMonth: string | null; // YYYY-MM
  worstBalanceMonth: string | null; // YYYY-MM
}

// 月別サマリー（年間集計用の簡略版、comparisonフィールドなし）
export interface MonthlyBalanceSummary {
  month: string; // YYYY-MM
  income: MonthlyBalanceDetails;
  expense: MonthlyBalanceDetails;
  balance: number;
  savingsRate: number;
}

// 年間収支集計レスポンス
export interface YearlyBalanceResponse {
  year: number;
  months: MonthlyBalanceSummary[];
  annual: AnnualSummary;
  trend: TrendData;
  highlights: Highlights;
}

/**
 * 資産残高レスポンス（FR-026）
 */
export interface AccountAssetDto {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  balance: number;
  currency: string;
}

export interface InstitutionAssetDto {
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  icon: string;
  accounts: AccountAssetDto[];
  total: number;
  percentage: number;
}

export interface AssetComparisonDto {
  diff: number;
  rate: number;
}

export interface AssetBalanceResponse {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  institutions: InstitutionAssetDto[];
  asOfDate: string; // ISO8601形式
  previousMonth: AssetComparisonDto;
  previousYear: AssetComparisonDto;
}

/**
 * トレンド分析レスポンス（FR-027）
 */
export interface TrendAnalysisResponse {
  period: {
    start: string; // YYYY-MM
    end: string; // YYYY-MM
  };
  targetType: 'income' | 'expense' | 'balance';
  actual: Array<{
    date: string; // YYYY-MM
    value: number;
  }>;
  movingAverage: {
    period: number;
    data: Array<{
      date: string; // YYYY-MM
      value: number;
    }>;
  };
  trendLine: {
    slope: number;
    intercept: number;
    points: Array<{
      date: string; // YYYY-MM
      value: number;
    }>;
  };
  statistics: {
    mean: number;
    standardDeviation: number;
    coefficientOfVariation: number;
  };
  insights: Array<{
    type: 'trend' | 'pattern' | 'anomaly';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    recommendation?: string;
  }>;
}

/**
 * カテゴリ別集計レスポンス（FR-018, FR-025）
 */

// 取引DTO
export interface TransactionDto {
  id: string;
  date: string; // ISO8601形式
  amount: number;
  categoryType: string; // CategoryTypeの文字列値
  categoryId: string;
  institutionId: string;
  accountId: string;
  description: string;
}

// サブカテゴリ別集計DTO
export interface SubcategoryAggregationResponseDto {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
  topTransactions: TransactionDto[];
}

// 推移データDTO
export interface TrendDataResponseDto {
  monthly: Array<{
    month: string; // YYYY-MM
    amount: number;
    count: number;
  }>;
}

// カテゴリ別集計レスポンスDTO
export interface CategoryAggregationResponseDto {
  categoryType: CategoryType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalAmount: number;
  transactionCount: number;
  subcategories: SubcategoryAggregationResponseDto[];
  percentage: number;
  trend: TrendDataResponseDto;
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

  /**
   * カテゴリ別集計情報を取得（FR-018, FR-025）
   */
  getCategoryAggregation: async (
    startDate: string,
    endDate: string,
    categoryType?: CategoryType
  ): Promise<CategoryAggregationResponseDto[]> => {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    if (categoryType) {
      params.append('categoryType', categoryType);
    }
    const response = await apiClient.get<{
      success: boolean;
      data: CategoryAggregationResponseDto[];
    }>(`/api/aggregation/category?${params.toString()}`);
    return response.data;
  },

  /**
   * 資産残高情報を取得（FR-026）
   */
  getAssetBalance: async (asOfDate?: string): Promise<AssetBalanceResponse> => {
    const params = new URLSearchParams();
    if (asOfDate) {
      params.append('asOfDate', asOfDate);
    }
    const response = await apiClient.get<{
      success: boolean;
      data: AssetBalanceResponse;
    }>(`/api/aggregation/asset-balance?${params.toString()}`);
    return response.data;
  },

  /**
   * トレンド分析情報を取得（FR-027）
   */
  getTrendAnalysis: async (
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number,
    targetType?: 'income' | 'expense' | 'balance',
    movingAveragePeriod?: 3 | 6 | 12
  ): Promise<TrendAnalysisResponse> => {
    const params = new URLSearchParams({
      startYear: startYear.toString(),
      startMonth: startMonth.toString(),
      endYear: endYear.toString(),
      endMonth: endMonth.toString(),
    });
    if (targetType) {
      params.append('targetType', targetType);
    }
    if (movingAveragePeriod) {
      params.append('movingAveragePeriod', movingAveragePeriod.toString());
    }
    const response = await apiClient.get<{
      success: boolean;
      data: TrendAnalysisResponse;
    }>(`/api/aggregation/trend?${params.toString()}`);
    return response.data;
  },
};
