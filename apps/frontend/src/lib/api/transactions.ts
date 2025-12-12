import { Transaction, CategoryType, TransactionStatus } from '@account-book/types';
import { apiClient } from './client';

/**
 * Transaction API
 */

export interface CreateTransactionRequest {
  date: string;
  amount: number;
  category: {
    id: string;
    name: string;
    type: CategoryType;
  };
  description: string;
  institutionId: string;
  accountId: string;
  status?: TransactionStatus;
  relatedTransactionId?: string;
}

export interface GetTransactionsParams {
  institutionId?: string;
  accountId?: string;
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
}

export type ExportFormat = 'csv' | 'json';

export interface ExportTransactionsParams extends GetTransactionsParams {
  format: ExportFormat;
}

export interface MonthlySummary {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
  byCategory: {
    [key in CategoryType]: {
      count: number;
      total: number;
    };
  };
  byInstitution: {
    [institutionId: string]: {
      count: number;
      total: number;
    };
  };
  transactionCount: number;
}

/**
 * 取引を作成
 */
export async function createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
  return await apiClient.post<Transaction>('/api/transactions', data);
}

/**
 * 取引一覧を取得
 */
export async function getTransactions(params?: GetTransactionsParams): Promise<Transaction[]> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.institutionId) searchParams.append('institutionId', params.institutionId);
    if (params.accountId) searchParams.append('accountId', params.accountId);
    if (params.year) searchParams.append('year', params.year.toString());
    if (params.month) searchParams.append('month', params.month.toString());
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
  }

  const endpoint = `/api/transactions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return await apiClient.get<Transaction[]>(endpoint);
}

/**
 * 取引をIDで取得
 * Issue #109: [TASK] E-3: 取引詳細画面の実装
 */
export async function getTransactionById(id: string): Promise<Transaction> {
  const data = await apiClient.get<Transaction>(`/api/transactions/${id}`);
  // dateフィールドがISO文字列として返されるため、Dateオブジェクトに変換
  return {
    ...data,
    date: data.date instanceof Date ? data.date : new Date(data.date),
    createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt),
    confirmedAt: data.confirmedAt
      ? data.confirmedAt instanceof Date
        ? data.confirmedAt
        : new Date(data.confirmedAt)
      : null,
  };
}

/**
 * 月次サマリーを取得
 */
export async function getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
  return await apiClient.get<MonthlySummary>(`/api/transactions/summary/monthly/${year}/${month}`);
}

/**
 * 取引のカテゴリを更新
 */
export async function updateTransactionCategory(
  transactionId: string,
  category: {
    id: string;
    name: string;
    type: CategoryType;
  }
): Promise<Transaction> {
  const data = await apiClient.patch<Transaction>(`/api/transactions/${transactionId}/category`, {
    category,
  });
  // dateフィールドがISO文字列として返されるため、Dateオブジェクトに変換
  return {
    ...data,
    date: new Date(data.date),
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    confirmedAt: data.confirmedAt ? new Date(data.confirmedAt) : null,
  };
}

/**
 * 取引のサブカテゴリを更新
 * FR-009: 詳細費目分類機能
 */
export async function updateTransactionSubcategory(
  transactionId: string,
  subcategoryId: string
): Promise<Transaction> {
  return await apiClient.patch<Transaction>(`/api/transactions/${transactionId}/subcategory`, {
    subcategoryId,
  });
}

/**
 * 取引データをエクスポート
 * FR-031: データエクスポート機能
 */
export async function exportTransactions(params: ExportTransactionsParams): Promise<void> {
  const searchParams = new URLSearchParams();

  // formatを除いたパラメータをループで追加
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'format' && value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  }
  // formatは必須なので最後に追加
  searchParams.append('format', params.format);

  await apiClient.downloadFile('/api/transactions/export', searchParams);
}
