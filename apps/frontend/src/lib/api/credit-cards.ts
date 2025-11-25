import { CreditCard, CreditCardTransaction, Payment } from '@account-book/types';
import { apiClient } from './client';

/**
 * Credit Card API
 */

export interface ConnectCreditCardRequest {
  cardName: string;
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string; // ISO date string
  username: string;
  password: string;
  issuer: string;
  paymentDay: number;
  closingDay: number;
}

export interface GetTransactionsParams {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  forceRefresh?: boolean;
}

export interface GetPaymentInfoParams {
  billingMonth?: string; // YYYY-MM format
  forceRefresh?: boolean;
}

/**
 * クレジットカードと連携する
 */
export async function connectCreditCard(data: ConnectCreditCardRequest): Promise<CreditCard> {
  return await apiClient.post<CreditCard>('/credit-cards/connect', data);
}

/**
 * 全てのクレジットカードを取得
 */
export async function getCreditCards(): Promise<CreditCard[]> {
  return await apiClient.get<CreditCard[]>('/credit-cards');
}

/**
 * クレジットカードを取得
 */
export async function getCreditCard(id: string): Promise<CreditCard> {
  return await apiClient.get<CreditCard>(`/credit-cards/${id}`);
}

/**
 * クレジットカードの取引履歴を取得
 */
export async function getCreditCardTransactions(
  id: string,
  params?: GetTransactionsParams
): Promise<CreditCardTransaction[]> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.forceRefresh !== undefined) {
      searchParams.append('forceRefresh', params.forceRefresh.toString());
    }
  }

  const endpoint = `/credit-cards/${id}/transactions${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`;
  return await apiClient.get<CreditCardTransaction[]>(endpoint);
}

/**
 * クレジットカードの支払い情報を取得
 */
export async function getPaymentInfo(id: string, params?: GetPaymentInfoParams): Promise<Payment> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.billingMonth) {
      searchParams.append('billingMonth', params.billingMonth);
    }
    if (params.forceRefresh !== undefined) {
      searchParams.append('forceRefresh', params.forceRefresh.toString());
    }
  }

  const endpoint = `/credit-cards/${id}/payment-info${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`;
  return await apiClient.get<Payment>(endpoint);
}

/**
 * クレジットカードを削除
 */
export async function deleteCreditCard(id: string): Promise<void> {
  return await apiClient.delete(`/credit-cards/${id}`);
}

/**
 * クレジットカード情報を再同期
 */
export async function refreshCreditCardData(id: string): Promise<{
  creditCard: CreditCard;
  transactions: CreditCardTransaction[];
  payment: Payment;
}> {
  return await apiClient.post<{
    creditCard: CreditCard;
    transactions: CreditCardTransaction[];
    payment: Payment;
  }>(`/credit-cards/${id}/refresh`, {});
}
