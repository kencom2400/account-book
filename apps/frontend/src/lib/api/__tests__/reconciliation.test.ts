/**
 * Reconciliation API Client Tests
 * FR-013: 銀行引落額との自動照合
 */

import { ReconciliationStatus } from '@account-book/types';
import { apiClient } from '../client';
import { reconciliationApi, type ReconcileCreditCardRequest } from '../reconciliation';

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

describe('Reconciliation API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reconcile', () => {
    it('クレジットカード照合を実行できる', async () => {
      const request: ReconcileCreditCardRequest = {
        cardId: 'card-1',
        billingMonth: '2025-01',
      };

      const mockReport = {
        reconciliationId: 'recon-1',
        executedAt: '2025-01-30T00:00:00.000Z',
        cardId: 'card-1',
        billingMonth: '2025-01',
        status: ReconciliationStatus.MATCHED,
        results: [
          {
            isMatched: true,
            confidence: 100,
            bankTransactionId: 'bank-tx-1',
            cardSummaryId: 'summary-1',
            matchedAt: '2025-01-30T00:00:00.000Z',
            discrepancy: null,
          },
        ],
        summary: {
          total: 1,
          matched: 1,
          unmatched: 0,
          partial: 0,
        },
      };

      mockApiClient.post.mockResolvedValue(mockReport);

      const result = await reconciliationApi.reconcile(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/reconciliations', request);
      expect(result).toEqual(mockReport);
    });
  });

  describe('getAll', () => {
    it('パラメータなしで照合結果一覧を取得できる', async () => {
      const mockListItems = [
        {
          id: 'recon-1',
          cardId: 'card-1',
          billingMonth: '2025-01',
          status: ReconciliationStatus.MATCHED,
          executedAt: '2025-01-30T00:00:00.000Z',
          summary: {
            total: 1,
            matched: 1,
            unmatched: 0,
            partial: 0,
          },
          createdAt: '2025-01-30T00:00:00.000Z',
          updatedAt: '2025-01-30T00:00:00.000Z',
        },
      ];

      mockApiClient.get.mockResolvedValue(mockListItems);

      const result = await reconciliationApi.getAll();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/reconciliations');
      expect(result).toEqual(mockListItems);
    });

    it('cardIdを指定して照合結果一覧を取得できる', async () => {
      const params = {
        cardId: 'card-1',
      };

      mockApiClient.get.mockResolvedValue([]);

      await reconciliationApi.getAll(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/reconciliations?cardId=card-1');
    });

    it('billingMonthを指定して照合結果一覧を取得できる', async () => {
      const params = {
        billingMonth: '2025-01',
      };

      mockApiClient.get.mockResolvedValue([]);

      await reconciliationApi.getAll(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/reconciliations?billingMonth=2025-01');
    });

    it('startMonth/endMonthを指定して照合結果一覧を取得できる', async () => {
      const params = {
        startMonth: '2025-01',
        endMonth: '2025-03',
      };

      mockApiClient.get.mockResolvedValue([]);

      await reconciliationApi.getAll(params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/api/reconciliations?startMonth=2025-01&endMonth=2025-03'
      );
    });

    it('複数のパラメータを組み合わせて照合結果一覧を取得できる', async () => {
      const params = {
        cardId: 'card-1',
        billingMonth: '2025-01',
      };

      mockApiClient.get.mockResolvedValue([]);

      await reconciliationApi.getAll(params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/api/reconciliations?cardId=card-1&billingMonth=2025-01'
      );
    });
  });

  describe('getById', () => {
    it('照合結果詳細を取得できる', async () => {
      const id = 'recon-1';
      const mockReport = {
        reconciliationId: 'recon-1',
        executedAt: '2025-01-30T00:00:00.000Z',
        cardId: 'card-1',
        billingMonth: '2025-01',
        status: ReconciliationStatus.MATCHED,
        results: [
          {
            isMatched: true,
            confidence: 100,
            bankTransactionId: 'bank-tx-1',
            cardSummaryId: 'summary-1',
            matchedAt: '2025-01-30T00:00:00.000Z',
            discrepancy: null,
          },
        ],
        summary: {
          total: 1,
          matched: 1,
          unmatched: 0,
          partial: 0,
        },
      };

      mockApiClient.get.mockResolvedValue(mockReport);

      const result = await reconciliationApi.getById(id);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/reconciliations/${id}`);
      expect(result).toEqual(mockReport);
    });
  });
});
