/**
 * Payment Status API Client Tests
 * FR-014: 支払いステータス管理
 */

import { apiClient } from '../client';
import { paymentStatusApi, type UpdatePaymentStatusRequest } from '../payment-status';

// apiClientをモック
jest.mock('../client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Payment Status API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateStatus', () => {
    it('ステータスを手動更新できる', async () => {
      const cardSummaryId = 'summary-1';
      const request: UpdatePaymentStatusRequest = {
        newStatus: 'PAID',
        notes: '手動で支払い済みに更新',
      };

      const mockRecord = {
        id: 'status-1',
        cardSummaryId: 'summary-1',
        status: 'PAID' as const,
        previousStatus: 'PENDING' as const,
        updatedAt: '2025-01-30T00:00:00.000Z',
        updatedBy: 'user' as const,
        reason: undefined,
        reconciliationId: undefined,
        notes: '手動で支払い済みに更新',
      };

      mockApiClient.put.mockResolvedValue(mockRecord);

      const result = await paymentStatusApi.updateStatus(cardSummaryId, request);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/payment-status/${cardSummaryId}`,
        request
      );
      expect(result).toEqual(mockRecord);
    });

    it('notesなしでステータスを更新できる', async () => {
      const cardSummaryId = 'summary-1';
      const request: UpdatePaymentStatusRequest = {
        newStatus: 'PAID',
      };

      const mockRecord = {
        id: 'status-1',
        cardSummaryId: 'summary-1',
        status: 'PAID' as const,
        previousStatus: 'PENDING' as const,
        updatedAt: '2025-01-30T00:00:00.000Z',
        updatedBy: 'user' as const,
        reason: undefined,
        reconciliationId: undefined,
        notes: undefined,
      };

      mockApiClient.put.mockResolvedValue(mockRecord);

      const result = await paymentStatusApi.updateStatus(cardSummaryId, request);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/api/payment-status/${cardSummaryId}`,
        request
      );
      expect(result).toEqual(mockRecord);
    });
  });

  describe('getStatus', () => {
    it('現在のステータスを取得できる', async () => {
      const cardSummaryId = 'summary-1';
      const mockRecord = {
        id: 'status-1',
        cardSummaryId: 'summary-1',
        status: 'PENDING' as const,
        previousStatus: undefined,
        updatedAt: '2025-01-30T00:00:00.000Z',
        updatedBy: 'system' as const,
        reason: '初期ステータス',
        reconciliationId: undefined,
        notes: undefined,
      };

      mockApiClient.get.mockResolvedValue(mockRecord);

      const result = await paymentStatusApi.getStatus(cardSummaryId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/payment-status/${cardSummaryId}`);
      expect(result).toEqual(mockRecord);
    });
  });

  describe('getStatuses', () => {
    it('複数のステータス記録を一括取得できる', async () => {
      const cardSummaryIds = ['summary-1', 'summary-2', 'summary-3'];
      const mockData = [
        {
          id: 'status-1',
          cardSummaryId: 'summary-1',
          status: 'PENDING' as const,
          previousStatus: undefined,
          updatedAt: '2025-01-30T00:00:00.000Z',
          updatedBy: 'system' as const,
          reason: '初期ステータス',
          reconciliationId: undefined,
          notes: undefined,
        },
        {
          id: 'status-2',
          cardSummaryId: 'summary-2',
          status: 'PROCESSING' as const,
          previousStatus: undefined,
          updatedAt: '2025-01-31T00:00:00.000Z',
          updatedBy: 'system' as const,
          reason: '初期ステータス',
          reconciliationId: undefined,
          notes: undefined,
        },
        {
          id: 'status-3',
          cardSummaryId: 'summary-3',
          status: 'PAID' as const,
          previousStatus: undefined,
          updatedAt: '2025-02-01T00:00:00.000Z',
          updatedBy: 'user' as const,
          reason: undefined,
          reconciliationId: undefined,
          notes: undefined,
        },
      ];

      // apiClient.get<T>()は既にdataプロパティを返すため、直接データを返す
      mockApiClient.get.mockResolvedValue(mockData);

      const result = await paymentStatusApi.getStatuses(cardSummaryIds);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/api/payment-status?summaryIds=summary-1%2Csummary-2%2Csummary-3'
      );
      expect(result).toEqual(mockData);
      expect(result).toHaveLength(3);
    });

    it('空の配列を渡した場合は空配列を返す', async () => {
      const result = await paymentStatusApi.getStatuses([]);

      expect(result).toEqual([]);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    it('ステータス変更履歴を取得できる', async () => {
      const cardSummaryId = 'summary-1';
      const mockHistory = {
        recordId: 'status-1',
        statusChanges: [
          {
            id: 'status-1',
            cardSummaryId: 'summary-1',
            status: 'PENDING' as const,
            previousStatus: undefined,
            updatedAt: '2025-01-30T00:00:00.000Z',
            updatedBy: 'system' as const,
            reason: '初期ステータス',
            reconciliationId: undefined,
            notes: undefined,
          },
          {
            id: 'status-2',
            cardSummaryId: 'summary-1',
            status: 'PAID' as const,
            previousStatus: 'PENDING' as const,
            updatedAt: '2025-02-01T00:00:00.000Z',
            updatedBy: 'user' as const,
            reason: undefined,
            reconciliationId: 'recon-1',
            notes: '手動で支払い済みに更新',
          },
        ],
      };

      mockApiClient.get.mockResolvedValue(mockHistory);

      const result = await paymentStatusApi.getHistory(cardSummaryId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/payment-status/${cardSummaryId}/history`
      );
      expect(result).toEqual(mockHistory);
    });
  });
});
