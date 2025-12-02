/**
 * 照合APIクライアント
 * FR-013: 銀行引落額との自動照合
 */

import { ReconciliationReport, ReconciliationStatus } from '@account-book/types';
import { apiClient } from './client';

/**
 * 照合リクエスト
 */
export interface ReconcileCreditCardRequest {
  cardId: string;
  billingMonth: string; // YYYY-MM
}

/**
 * 照合サマリー
 */
export interface ReconciliationSummary {
  total: number;
  matched: number;
  unmatched: number;
  partial: number;
}

/**
 * 照合一覧項目（簡略版）
 */
export interface ReconciliationListItem {
  id: string;
  cardId: string;
  billingMonth: string; // YYYY-MM
  status: ReconciliationStatus;
  executedAt: string; // ISO date string
  summary: ReconciliationSummary;
  createdAt: string;
  updatedAt: string;
}

/**
 * 照合APIクライアント
 */
export const reconciliationApi = {
  /**
   * クレジットカード照合を実行
   */
  reconcile: async (request: ReconcileCreditCardRequest): Promise<ReconciliationReport> => {
    return await apiClient.post<ReconciliationReport>('/api/reconciliations', request);
  },

  /**
   * 照合結果一覧を取得
   */
  getAll: async (params?: {
    cardId?: string;
    billingMonth?: string;
    startMonth?: string;
    endMonth?: string;
  }): Promise<ReconciliationListItem[]> => {
    const searchParams = new URLSearchParams();
    if (params?.cardId) searchParams.append('cardId', params.cardId);
    if (params?.billingMonth) searchParams.append('billingMonth', params.billingMonth);
    if (params?.startMonth) searchParams.append('startMonth', params.startMonth);
    if (params?.endMonth) searchParams.append('endMonth', params.endMonth);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/reconciliations?${queryString}` : '/api/reconciliations';

    return await apiClient.get<ReconciliationListItem[]>(endpoint);
  },

  /**
   * 照合結果詳細を取得
   */
  getById: async (id: string): Promise<ReconciliationReport> => {
    return await apiClient.get<ReconciliationReport>(`/api/reconciliations/${id}`);
  },
};
