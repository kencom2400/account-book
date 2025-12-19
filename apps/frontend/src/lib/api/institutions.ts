import {
  Institution,
  InstitutionType,
  Bank,
  BankCategory,
  BankConnectionTestResult,
  AuthenticationType,
} from '@account-book/types';
import { apiClient, ApiError } from './client';

/**
 * Institution API
 */

export interface CreateInstitutionRequest {
  name: string;
  type: InstitutionType;
  credentials: Record<string, unknown>;
}

export interface UpdateInstitutionRequest {
  name?: string;
  type?: InstitutionType;
  credentials?: Record<string, unknown>;
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
  authenticationType: AuthenticationType;
  branchCode?: string;
  accountNumber?: string;
  apiKey?: string;
  apiSecret?: string;
  userId?: string;
  password?: string;
}

/**
 * 金融機関を登録
 */
export async function createInstitution(data: CreateInstitutionRequest): Promise<Institution> {
  return await apiClient.post<Institution>('/institutions', data);
}

/**
 * 金融機関を更新
 */
export async function updateInstitution(
  id: string,
  data: UpdateInstitutionRequest
): Promise<Institution> {
  return await apiClient.patch<Institution>(`/institutions/${id}`, data);
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
 * 金融機関をIDで取得
 */
export async function getInstitution(id: string): Promise<Institution> {
  return await apiClient.get<Institution>(`/institutions/${id}`);
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
  // APIクライアントはresult.dataを返すが、バックエンドのレスポンス構造を考慮する必要がある
  // バックエンドは { success: boolean, data: BankConnectionTestResult } を返す
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/institutions/banks/test-connection`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    // HTTPステータスがエラーの場合（400, 500など）
    const errorResponse = (await response.json()) as {
      success: boolean;
      error?: {
        message: string;
        code: string;
        details?: Array<{ field?: string; message: string }>;
      };
    };
    if (errorResponse.error) {
      throw new ApiError(
        errorResponse.error.message,
        errorResponse.error.code,
        errorResponse.error.details,
        response.status
      );
    }
    throw new ApiError(
      `API Error: ${response.status} ${response.statusText}`,
      'UNKNOWN_ERROR',
      undefined,
      response.status
    );
  }

  const result = (await response.json()) as {
    success: boolean;
    data: BankConnectionTestResult;
  };

  // successがfalseの場合はエラーとして扱う
  if (!result.success) {
    const errorData = result.data;
    throw new ApiError(
      errorData.message || '接続テストに失敗しました',
      errorData.errorCode || 'BE999',
      undefined,
      200 // HTTPステータスは200だが、successがfalse
    );
  }

  return result.data;
}

export interface DeleteInstitutionRequest {
  deleteTransactions?: boolean;
}

/**
 * 金融機関を削除
 */
export async function deleteInstitution(
  id: string,
  options?: DeleteInstitutionRequest
): Promise<void> {
  const params = new URLSearchParams();
  if (options?.deleteTransactions) {
    params.set('deleteTransactions', 'true');
  }
  const queryString = params.toString();
  const endpoint = `/institutions/${id}${queryString ? `?${queryString}` : ''}`;
  return await apiClient.delete<void>(endpoint);
}
