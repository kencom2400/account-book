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
  const response = await apiClient.post<ClassifyTransactionResponse>(
    '/transactions/classify',
    request
  );

  // レスポンスの型チェック
  if (!response.data || typeof response.data !== 'object') {
    throw new Error('Invalid response from API');
  }

  // successプロパティの存在確認
  if ('success' in response.data && 'data' in response.data) {
    const apiResponse = response.data as {
      success: boolean;
      data: ClassifyTransactionResponse['data'];
    };
    return apiResponse.data;
  }

  // 直接dataを返す場合（APIがラップなしでdataを返す場合）
  if ('category' in response.data && 'confidence' in response.data && 'reason' in response.data) {
    return response.data;
  }

  throw new Error('Invalid response structure from API');
}
