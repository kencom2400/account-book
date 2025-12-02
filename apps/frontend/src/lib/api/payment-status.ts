/**
 * 支払いステータス管理APIクライアント
 * FR-014: 支払いステータス管理
 */

// PaymentStatusは文字列リテラル型として扱う
type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'OVERDUE'
  | 'PARTIAL'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'MANUAL_CONFIRMED';
import { apiClient } from './client';

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
   * ステータス変更履歴を取得
   */
  getHistory: async (cardSummaryId: string): Promise<PaymentStatusHistory> => {
    return await apiClient.get<PaymentStatusHistory>(
      `/api/payment-status/${cardSummaryId}/history`
    );
  },
};
