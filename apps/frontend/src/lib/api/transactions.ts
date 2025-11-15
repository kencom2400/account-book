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
export async function createTransaction(
  data: CreateTransactionRequest,
): Promise<Transaction> {
  return await apiClient.post<Transaction>('/transactions', data);
}

/**
 * 取引一覧を取得
 */
export async function getTransactions(
  params?: GetTransactionsParams,
): Promise<Transaction[]> {
  const searchParams = new URLSearchParams();
  
  if (params) {
    if (params.institutionId) searchParams.append('institutionId', params.institutionId);
    if (params.accountId) searchParams.append('accountId', params.accountId);
    if (params.year) searchParams.append('year', params.year.toString());
    if (params.month) searchParams.append('month', params.month.toString());
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
  }

  const endpoint = `/transactions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return await apiClient.get<Transaction[]>(endpoint);
}

/**
 * 月次サマリーを取得
 */
export async function getMonthlySummary(
  year: number,
  month: number,
): Promise<MonthlySummary> {
  return await apiClient.get<MonthlySummary>(
    `/transactions/summary/monthly/${year}/${month}`,
  );
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
  },
): Promise<Transaction> {
  return await apiClient.patch<Transaction>(
    `/transactions/${transactionId}/category`,
    { category },
  );
}

