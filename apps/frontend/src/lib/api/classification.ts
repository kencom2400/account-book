import { apiClient } from './client';
import { CategoryType } from '@account-book/types';

/**
 * FR-008: カテゴリ自動分類API
 * 取引データを自動分類して最適なカテゴリを返す
 */

export interface ClassifyTransactionRequest {
  amount: number;
  description: string;
  institutionId?: string;
  institutionType?: string;
}

export interface ClassifyTransactionResponse {
  success: boolean;
  data: {
    category: {
      id: string;
      name: string;
      type: CategoryType;
    };
    confidence: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    reason: string;
  };
}

/**
 * 取引データのカテゴリを自動分類
 * POST /transactions/classify
 *
 * @param request 取引データ
 * @returns 分類結果（カテゴリ、信頼度、理由）
 */
export async function classifyTransaction(
  request: ClassifyTransactionRequest
): Promise<ClassifyTransactionResponse['data']> {
  // apiClient.postは ApiResponse<T>.data を返すため、T には実際のデータ型を指定
  const result = await apiClient.post<ClassifyTransactionResponse['data']>(
    '/api/transactions/classify',
    request
  );

  return result;
}
