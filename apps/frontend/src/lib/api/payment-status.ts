/**
 * 支払いステータス管理APIクライアント
 * FR-014: 支払いステータス管理
 */

import { apiClient } from './client';

// PaymentStatusは文字列リテラル型として扱う
export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'OVERDUE'
  | 'PARTIAL'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'MANUAL_CONFIRMED';

/**
 * ステータス更新リクエスト
 */
export interface UpdatePaymentStatusRequest {
  newStatus: PaymentStatus;
  notes?: string;
}

/**
 * ステータス記録
 */
export interface PaymentStatusRecord {
  id: string;
  cardSummaryId: string;
  status: PaymentStatus;
  previousStatus?: PaymentStatus;
  updatedAt: string; // ISO date string
  updatedBy: 'system' | 'user';
  reason?: string;
  reconciliationId?: string;
  notes?: string;
}

/**
 * ステータス履歴
 */
export interface PaymentStatusHistory {
  recordId: string;
  statusChanges: PaymentStatusRecord[];
}

/**
 * 支払いステータス管理APIクライアント
 */
export const paymentStatusApi = {
  /**
   * ステータスを手動更新
   */
  updateStatus: async (
    cardSummaryId: string,
    request: UpdatePaymentStatusRequest
  ): Promise<PaymentStatusRecord> => {
    return await apiClient.put<PaymentStatusRecord>(
      `/api/payment-status/${cardSummaryId}`,
      request
    );
  },

  /**
   * 現在のステータスを取得
   */
  getStatus: async (cardSummaryId: string): Promise<PaymentStatusRecord> => {
    return await apiClient.get<PaymentStatusRecord>(`/api/payment-status/${cardSummaryId}`);
  },

  /**
   * 複数のカード集計IDに対応するステータス記録を一括取得
   */
  getStatuses: async (cardSummaryIds: string[]): Promise<PaymentStatusRecord[]> => {
    if (cardSummaryIds.length === 0) {
      return [];
    }

    const summaryIds = cardSummaryIds.join(',');
    return apiClient.get<PaymentStatusRecord[]>(
      `/api/payment-status?summaryIds=${encodeURIComponent(summaryIds)}`
    );
  },

  /**
   * ステータス変更履歴を取得
   */
  getHistory: async (cardSummaryId: string): Promise<PaymentStatusHistory> => {
    return await apiClient.get<PaymentStatusHistory>(
      `/api/payment-status/${cardSummaryId}/history`
    );
  },
};
