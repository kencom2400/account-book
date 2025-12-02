/**
 * 月別集計APIクライアント
 * FR-012: クレジットカード月別集計
 */

import { CategoryAmount } from '@account-book/types';

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
import { apiClient } from './client';

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
};
