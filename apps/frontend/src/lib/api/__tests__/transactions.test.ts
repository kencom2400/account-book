/**
 * Transaction API Client Tests
 */

import { CategoryType, TransactionStatus } from '@account-book/types';
import { apiClient } from '../client';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  getMonthlySummary,
  updateTransactionCategory,
  updateTransactionSubcategory,
  exportTransactions,
  type CreateTransactionRequest,
  type GetTransactionsParams,
  type ExportTransactionsParams,
} from '../transactions';

// apiClientをモック
jest.mock('../client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    downloadFile: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('Transaction API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('取引を作成できる', async () => {
      const request: CreateTransactionRequest = {
        date: '2025-11-30',
        amount: 1000,
        category: {
          id: 'cat-1',
          name: '食費',
          type: CategoryType.EXPENSE,
        },
        description: 'スーパーマーケット',
        institutionId: 'inst-1',
        accountId: 'acc-1',
        status: TransactionStatus.COMPLETED,
      };

      const mockTransaction = {
        id: 'tx-1',
        ...request,
      };

      mockApiClient.post.mockResolvedValue(mockTransaction);

      const result = await createTransaction(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/transactions', request);
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('getTransactions', () => {
    it('パラメータなしで取引一覧を取得できる', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          date: '2025-11-30',
          amount: 1000,
          category: {
            id: 'cat-1',
            name: '食費',
            type: CategoryType.EXPENSE,
          },
          description: 'スーパーマーケット',
          institutionId: 'inst-1',
          accountId: 'acc-1',
          status: TransactionStatus.COMPLETED,
          isReconciled: false,
          createdAt: '2025-11-30T00:00:00.000Z',
          updatedAt: '2025-11-30T00:00:00.000Z',
        },
      ];

      mockApiClient.get.mockResolvedValue(mockTransactions);

      const result = await getTransactions();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/transactions');
      expect(result).toEqual(mockTransactions);
    });

    it('institutionIdを指定して取引一覧を取得できる', async () => {
      const params: GetTransactionsParams = {
        institutionId: 'inst-1',
      };

      mockApiClient.get.mockResolvedValue([]);

      await getTransactions(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/transactions?institutionId=inst-1');
    });

    it('accountIdを指定して取引一覧を取得できる', async () => {
      const params: GetTransactionsParams = {
        accountId: 'acc-1',
      };

      mockApiClient.get.mockResolvedValue([]);

      await getTransactions(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/transactions?accountId=acc-1');
    });

    it('year/monthを指定して取引一覧を取得できる', async () => {
      const params: GetTransactionsParams = {
        year: 2025,
        month: 11,
      };

      mockApiClient.get.mockResolvedValue([]);

      await getTransactions(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/transactions?year=2025&month=11');
    });

    it('startDate/endDateを指定して取引一覧を取得できる', async () => {
      const params: GetTransactionsParams = {
        startDate: '2025-11-01',
        endDate: '2025-11-30',
      };

      mockApiClient.get.mockResolvedValue([]);

      await getTransactions(params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/api/transactions?startDate=2025-11-01&endDate=2025-11-30'
      );
    });

    it('複数のパラメータを組み合わせて取引一覧を取得できる', async () => {
      const params: GetTransactionsParams = {
        institutionId: 'inst-1',
        year: 2025,
        month: 11,
      };

      mockApiClient.get.mockResolvedValue([]);

      await getTransactions(params);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/api/transactions?institutionId=inst-1&year=2025&month=11'
      );
    });
  });

  describe('getTransactionById', () => {
    it('取引をIDで取得できる', async () => {
      const transactionId = 'tx-1';
      const mockTransaction = {
        id: transactionId,
        date: '2025-11-30T00:00:00.000Z',
        amount: 1000,
        category: {
          id: 'cat-1',
          name: '食費',
          type: CategoryType.EXPENSE,
        },
        description: 'スーパーマーケット',
        institutionId: 'inst-1',
        accountId: 'acc-1',
        status: TransactionStatus.COMPLETED,
        isReconciled: false,
        createdAt: '2025-11-30T00:00:00.000Z',
        updatedAt: '2025-11-30T00:00:00.000Z',
        confirmedAt: null,
        subcategoryId: null,
        classificationConfidence: null,
        classificationReason: null,
        merchantId: null,
        merchantName: null,
      };

      mockApiClient.get.mockResolvedValue(mockTransaction);

      const result = await getTransactionById(transactionId);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/transactions/tx-1');
      // getTransactionByIdはdate、createdAt、updatedAt、confirmedAtをDateオブジェクトに変換する
      expect(result).toEqual({
        ...mockTransaction,
        date: new Date(mockTransaction.date),
        createdAt: new Date(mockTransaction.createdAt),
        updatedAt: new Date(mockTransaction.updatedAt),
        confirmedAt: null,
      });
    });

    it('confirmedAtが存在する場合も正しく変換される', async () => {
      const transactionId = 'tx-1';
      const mockTransaction = {
        id: transactionId,
        date: '2025-11-30T00:00:00.000Z',
        amount: 1000,
        category: {
          id: 'cat-1',
          name: '食費',
          type: CategoryType.EXPENSE,
        },
        description: 'スーパーマーケット',
        institutionId: 'inst-1',
        accountId: 'acc-1',
        status: TransactionStatus.COMPLETED,
        isReconciled: false,
        createdAt: '2025-11-30T00:00:00.000Z',
        updatedAt: '2025-11-30T00:00:00.000Z',
        confirmedAt: '2025-11-30T12:00:00.000Z',
        subcategoryId: null,
        classificationConfidence: null,
        classificationReason: null,
        merchantId: null,
        merchantName: null,
      };

      mockApiClient.get.mockResolvedValue(mockTransaction);

      const result = await getTransactionById(transactionId);

      expect(result.confirmedAt).toEqual(new Date(mockTransaction.confirmedAt));
    });
  });

  describe('getMonthlySummary', () => {
    it('月次サマリーを取得できる', async () => {
      const mockSummary = {
        year: 2025,
        month: 11,
        income: 300000,
        expense: 50000,
        balance: 250000,
        byCategory: {
          [CategoryType.INCOME]: { count: 1, total: 300000 },
          [CategoryType.EXPENSE]: { count: 5, total: 50000 },
          [CategoryType.TRANSFER]: { count: 0, total: 0 },
          [CategoryType.REPAYMENT]: { count: 0, total: 0 },
          [CategoryType.INVESTMENT]: { count: 0, total: 0 },
        },
        byInstitution: {
          'inst-1': { count: 6, total: 350000 },
        },
        transactionCount: 6,
      };

      mockApiClient.get.mockResolvedValue(mockSummary);

      const result = await getMonthlySummary(2025, 11);

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/transactions/summary/monthly/2025/11');
      expect(result).toEqual(mockSummary);
    });
  });

  describe('updateTransactionCategory', () => {
    it('取引のカテゴリを更新できる', async () => {
      const transactionId = 'tx-1';
      const category = {
        id: 'cat-2',
        name: '交通費',
        type: CategoryType.EXPENSE,
      };

      const mockUpdatedTransaction = {
        id: transactionId,
        date: '2025-11-30',
        amount: 1000,
        category,
        description: 'スーパーマーケット',
        institutionId: 'inst-1',
        accountId: 'acc-1',
        status: TransactionStatus.COMPLETED,
        isReconciled: false,
        createdAt: '2025-11-30T00:00:00.000Z',
        updatedAt: '2025-11-30T00:00:00.000Z',
        confirmedAt: null,
      };

      mockApiClient.patch.mockResolvedValue(mockUpdatedTransaction);

      const result = await updateTransactionCategory(transactionId, category);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/api/transactions/tx-1/category', {
        category,
      });
      // updateTransactionCategoryはdate、createdAt、updatedAt、confirmedAtをDateオブジェクトに変換する
      expect(result).toEqual({
        ...mockUpdatedTransaction,
        date: new Date(mockUpdatedTransaction.date),
        createdAt: new Date(mockUpdatedTransaction.createdAt),
        updatedAt: new Date(mockUpdatedTransaction.updatedAt),
        confirmedAt: null,
      });
    });
  });

  describe('updateTransactionSubcategory', () => {
    it('取引のサブカテゴリを更新できる', async () => {
      const transactionId = 'tx-1';
      const subcategoryId = 'subcat-1';

      const mockUpdatedTransaction = {
        id: transactionId,
        date: '2025-11-30',
        amount: 1000,
        category: {
          id: 'cat-1',
          name: '食費',
          type: CategoryType.EXPENSE,
        },
        description: 'スーパーマーケット',
        institutionId: 'inst-1',
        accountId: 'acc-1',
        status: TransactionStatus.COMPLETED,
        isReconciled: false,
        createdAt: '2025-11-30T00:00:00.000Z',
        updatedAt: '2025-11-30T00:00:00.000Z',
      };

      mockApiClient.patch.mockResolvedValue(mockUpdatedTransaction);

      const result = await updateTransactionSubcategory(transactionId, subcategoryId);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/api/transactions/tx-1/subcategory', {
        subcategoryId,
      });
      expect(result).toEqual(mockUpdatedTransaction);
    });
  });

  describe('exportTransactions', () => {
    it('CSV形式でエクスポートできる', async () => {
      const params: ExportTransactionsParams = {
        format: 'csv',
      };

      mockApiClient.downloadFile.mockResolvedValue(undefined);

      await exportTransactions(params);

      expect(mockApiClient.downloadFile).toHaveBeenCalledWith(
        '/api/transactions/export',
        expect.any(URLSearchParams)
      );

      const callArgs = mockApiClient.downloadFile.mock.calls[0];
      const searchParams = callArgs[1] as URLSearchParams;
      expect(searchParams.get('format')).toBe('csv');
    });

    it('JSON形式でエクスポートできる', async () => {
      const params: ExportTransactionsParams = {
        format: 'json',
      };

      mockApiClient.downloadFile.mockResolvedValue(undefined);

      await exportTransactions(params);

      expect(mockApiClient.downloadFile).toHaveBeenCalledWith(
        '/api/transactions/export',
        expect.any(URLSearchParams)
      );

      const callArgs = mockApiClient.downloadFile.mock.calls[0];
      const searchParams = callArgs[1] as URLSearchParams;
      expect(searchParams.get('format')).toBe('json');
    });

    it('年・月を指定してエクスポートできる', async () => {
      const params: ExportTransactionsParams = {
        format: 'csv',
        year: 2025,
        month: 11,
      };

      mockApiClient.downloadFile.mockResolvedValue(undefined);

      await exportTransactions(params);

      const callArgs = mockApiClient.downloadFile.mock.calls[0];
      const searchParams = callArgs[1] as URLSearchParams;
      expect(searchParams.get('format')).toBe('csv');
      expect(searchParams.get('year')).toBe('2025');
      expect(searchParams.get('month')).toBe('11');
    });

    it('期間を指定してエクスポートできる', async () => {
      const params: ExportTransactionsParams = {
        format: 'csv',
        startDate: '2025-11-01',
        endDate: '2025-11-30',
      };

      mockApiClient.downloadFile.mockResolvedValue(undefined);

      await exportTransactions(params);

      const callArgs = mockApiClient.downloadFile.mock.calls[0];
      const searchParams = callArgs[1] as URLSearchParams;
      expect(searchParams.get('format')).toBe('csv');
      expect(searchParams.get('startDate')).toBe('2025-11-01');
      expect(searchParams.get('endDate')).toBe('2025-11-30');
    });

    it('金融機関IDでフィルタリングしてエクスポートできる', async () => {
      const params: ExportTransactionsParams = {
        format: 'csv',
        institutionId: 'inst-1',
      };

      mockApiClient.downloadFile.mockResolvedValue(undefined);

      await exportTransactions(params);

      const callArgs = mockApiClient.downloadFile.mock.calls[0];
      const searchParams = callArgs[1] as URLSearchParams;
      expect(searchParams.get('format')).toBe('csv');
      expect(searchParams.get('institutionId')).toBe('inst-1');
    });
  });
});
