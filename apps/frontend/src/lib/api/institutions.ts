import {
  Institution,
  InstitutionType,
  Bank,
  BankCategory,
  BankConnectionTestResult,
} from '@account-book/types';
import { apiClient } from './client';

/**
 * Institution API
 */

export interface CreateInstitutionRequest {
  name: string;
  type: InstitutionType;
  credentials: Record<string, unknown>;
}

export interface GetInstitutionsParams {
  type?: InstitutionType;
  isConnected?: boolean;
}

export interface GetSupportedBanksParams {
  category?: BankCategory;
  searchTerm?: string;
}

export interface TestBankConnectionRequest {
  bankCode: string;
  branchCode: string;
  accountNumber: string;
  apiKey?: string;
  apiSecret?: string;
}

/**
 * 金融機関を登録
 */
export async function createInstitution(data: CreateInstitutionRequest): Promise<Institution> {
  return await apiClient.post<Institution>('/institutions', data);
}

/**
 * 金融機関一覧を取得
 */
export async function getInstitutions(params?: GetInstitutionsParams): Promise<Institution[]> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.type) searchParams.append('type', params.type);
    if (params.isConnected !== undefined) {
      searchParams.append('isConnected', params.isConnected.toString());
    }
  }

  const endpoint = `/institutions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return await apiClient.get<Institution[]>(endpoint);
}

/**
 * 対応銀行一覧を取得
 */
export async function getSupportedBanks(params?: GetSupportedBanksParams): Promise<Bank[]> {
  const searchParams = new URLSearchParams();

  if (params) {
    if (params.category) searchParams.append('category', params.category);
    if (params.searchTerm) searchParams.append('searchTerm', params.searchTerm);
  }

  const endpoint = `/institutions/banks/supported${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return await apiClient.get<Bank[]>(endpoint);
}

/**
 * 銀行接続テスト
 */
export async function testBankConnection(
  data: TestBankConnectionRequest
): Promise<BankConnectionTestResult> {
  return await apiClient.post<BankConnectionTestResult>(
    '/institutions/banks/test-connection',
    data
  );
}
