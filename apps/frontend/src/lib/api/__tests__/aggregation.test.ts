/**
 * Aggregation API Client Tests
 * FR-012: クレジットカード月別集計
 */

import { CategoryType } from '@account-book/types';
import { apiClient } from '../client';
import { aggregationApi, type AggregateCardTransactionsRequest } from '../aggregation';

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

describe('Aggregation API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('aggregate', () => {
    it('カード利用明細を月別に集計できる', async () => {
      const request: AggregateCardTransactionsRequest = {
        cardId: 'card-1',
        startMonth: '2025-01',
        endMonth: '2025-03',
      };

      const mockSummaries = [
        {
          id: 'summary-1',
          cardId: 'card-1',
          cardName: '楽天カード',
          billingMonth: '2025-01',
          closingDate: '2025-01-31T00:00:00.000Z',
          paymentDate: '2025-02-27T00:00:00.000Z',
          totalAmount: 50000,
          transactionCount: 15,
          categoryBreakdown: [
            {
              category: CategoryType.EXPENSE,
              amount: 50000,
              count: 15,
            },
          ],
          transactionIds: ['tx-1', 'tx-2', 'tx-3'],
          netPaymentAmount: 50000,
          status: 'PENDING',
          createdAt: '2025-01-31T00:00:00.000Z',
          updatedAt: '2025-01-31T00:00:00.000Z',
        },
      ];

      mockApiClient.post.mockResolvedValue(mockSummaries);

      const result = await aggregationApi.aggregate(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/aggregation/card/monthly', request);
      expect(result).toEqual(mockSummaries);
    });
  });

  describe('getAll', () => {
    it('月別集計の一覧を取得できる', async () => {
      const mockListItems = [
        {
          id: 'summary-1',
          cardId: 'card-1',
          cardName: '楽天カード',
          billingMonth: '2025-01',
          totalAmount: 50000,
          netPaymentAmount: 50000,
          transactionCount: 15,
          status: 'PENDING',
        },
        {
          id: 'summary-2',
          cardId: 'card-1',
          cardName: '楽天カード',
          billingMonth: '2025-02',
          totalAmount: 60000,
          netPaymentAmount: 60000,
          transactionCount: 18,
          status: 'PAID',
        },
      ];

      mockApiClient.get.mockResolvedValue(mockListItems);

      const result = await aggregationApi.getAll();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/aggregation/card/monthly');
      expect(result).toEqual(mockListItems);
    });
  });

  describe('getByCardId', () => {
    it('カードIDで月別集計の詳細を一括取得できる', async () => {
      const cardId = 'card-1';
      const mockSummaries = [
        {
          id: 'summary-1',
          cardId: 'card-1',
          cardName: '楽天カード',
          billingMonth: '2025-01',
          closingDate: '2025-01-31T00:00:00.000Z',
          paymentDate: '2025-02-27T00:00:00.000Z',
          totalAmount: 50000,
          transactionCount: 15,
          categoryBreakdown: [
            {
              category: CategoryType.EXPENSE,
              amount: 50000,
              count: 15,
            },
          ],
          transactionIds: ['tx-1', 'tx-2', 'tx-3'],
          netPaymentAmount: 50000,
          status: 'PENDING',
          createdAt: '2025-01-31T00:00:00.000Z',
          updatedAt: '2025-01-31T00:00:00.000Z',
        },
        {
          id: 'summary-2',
          cardId: 'card-1',
          cardName: '楽天カード',
          billingMonth: '2025-02',
          closingDate: '2025-02-28T00:00:00.000Z',
          paymentDate: '2025-03-27T00:00:00.000Z',
          totalAmount: 60000,
          transactionCount: 18,
          categoryBreakdown: [
            {
              category: CategoryType.EXPENSE,
              amount: 60000,
              count: 18,
            },
          ],
          transactionIds: ['tx-4', 'tx-5', 'tx-6'],
          netPaymentAmount: 60000,
          status: 'PAID',
          createdAt: '2025-02-28T00:00:00.000Z',
          updatedAt: '2025-02-28T00:00:00.000Z',
        },
      ];

      mockApiClient.get.mockResolvedValue(mockSummaries);

      const result = await aggregationApi.getByCardId(cardId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/aggregation/card/monthly/card/${cardId}`
      );
      expect(result).toEqual(mockSummaries);
      expect(result).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('月別集計の詳細を取得できる', async () => {
      const id = 'summary-1';
      const mockSummary = {
        id: 'summary-1',
        cardId: 'card-1',
        cardName: '楽天カード',
        billingMonth: '2025-01',
        closingDate: '2025-01-31T00:00:00.000Z',
        paymentDate: '2025-02-27T00:00:00.000Z',
        totalAmount: 50000,
        transactionCount: 15,
        categoryBreakdown: [
          {
            category: CategoryType.EXPENSE,
            amount: 50000,
            count: 15,
          },
        ],
        transactionIds: ['tx-1', 'tx-2', 'tx-3'],
        netPaymentAmount: 50000,
        status: 'PENDING',
        createdAt: '2025-01-31T00:00:00.000Z',
        updatedAt: '2025-01-31T00:00:00.000Z',
      };

      mockApiClient.get.mockResolvedValue(mockSummary);

      const result = await aggregationApi.getById(id);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/aggregation/card/monthly/${id}`);
      expect(result).toEqual(mockSummary);
    });
  });

  describe('delete', () => {
    it('月別集計を削除できる', async () => {
      const id = 'summary-1';

      mockApiClient.delete.mockResolvedValue(undefined);

      await aggregationApi.delete(id);

      expect(mockApiClient.delete).toHaveBeenCalledWith(`/api/aggregation/card/monthly/${id}`);
    });
  });

  describe('getMonthlyBalance', () => {
    it('月別収支集計情報を取得できる', async () => {
      const year = 2025;
      const month = 1;
      const mockResponse: aggregationApi.MonthlyBalanceResponse = {
        month: '2025-01',
        income: {
          total: 500000,
          count: 5,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        expense: {
          total: 300000,
          count: 5,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        balance: 200000,
        savingsRate: 40,
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await aggregationApi.getMonthlyBalance(year, month);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/aggregation/monthly-balance?year=${year}&month=${month}`
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getYearlyBalance', () => {
    it('年間収支集計情報を取得できる', async () => {
      const year = 2025;
      const mockResponse: aggregationApi.YearlyBalanceResponse = {
        year: 2025,
        months: [
          {
            month: '2025-01',
            income: {
              total: 500000,
              count: 5,
              byCategory: [],
              byInstitution: [],
              transactions: [],
            },
            expense: {
              total: 300000,
              count: 5,
              byCategory: [],
              byInstitution: [],
              transactions: [],
            },
            balance: 200000,
            savingsRate: 40,
          },
        ],
        annual: {
          totalIncome: 6000000,
          totalExpense: 3600000,
          totalBalance: 2400000,
          averageIncome: 500000,
          averageExpense: 300000,
          savingsRate: 40,
        },
        trend: {
          incomeProgression: { direction: 'stable', changeRate: 0, standardDeviation: 0 },
          expenseProgression: { direction: 'stable', changeRate: 0, standardDeviation: 0 },
          balanceProgression: { direction: 'stable', changeRate: 0, standardDeviation: 0 },
        },
        highlights: {
          maxIncomeMonth: '2025-01',
          maxExpenseMonth: '2025-01',
          bestBalanceMonth: '2025-01',
          worstBalanceMonth: null,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await aggregationApi.getYearlyBalance(year);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/aggregation/yearly-balance?year=${year}`
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
