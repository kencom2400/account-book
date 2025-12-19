/**
 * APIクライアント
 * バックエンドとの通信を行う
 * Issue #214: エラーレスポンスdetailsフィールドの形式を統一
 */

import type { ErrorDetail, ErrorResponse } from '@account-book/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

/**
 * APIエラークラス
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: ErrorDetail[],
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * HTTP GETリクエスト
 */
async function get<T>(endpoint: string): Promise<T> {
  // エンドポイントが/apiで始まっていない場合は追加
  const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  // デバッグログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.warn('🔍 [API Client] GET request:', url);
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await handleErrorResponse(response);
    }

    const result = (await response.json()) as ApiResponse<T>;
    return result.data;
  } catch (error) {
    // ネットワークエラーなどの場合
    if (process.env.NODE_ENV === 'development') {
      // エラー情報を詳細に取得
      const errorDetails: Record<string, unknown> = {
        url,
        timestamp: new Date().toISOString(),
      };

      // エラーの種類を判定
      if (error instanceof TypeError) {
        errorDetails.errorType = 'TypeError';
        errorDetails.errorMessage = error.message;
        errorDetails.errorName = error.name;
        errorDetails.errorStack = error.stack;
        errorDetails.cause = error.cause;
      } else if (error instanceof Error) {
        errorDetails.errorType = error.constructor.name;
        errorDetails.errorMessage = error.message;
        errorDetails.errorName = error.name;
        errorDetails.errorStack = error.stack;
        if ('cause' in error) {
          errorDetails.cause = (error as { cause?: unknown }).cause;
        }
      } else {
        errorDetails.errorType = typeof error;
        errorDetails.errorValue = String(error);
        try {
          errorDetails.errorJSON = JSON.stringify(error);
        } catch {
          errorDetails.errorJSON = 'JSON.stringify failed';
        }
      }

      // 追加のデバッグ情報
      errorDetails.API_BASE_URL = API_BASE_URL;
      errorDetails.normalizedEndpoint = normalizedEndpoint;

      console.error('❌ [API Client] GET request failed:', errorDetails);
      console.error('❌ [API Client] Raw error object:', error);
    }

    // エラーメッセージを構築
    let errorMessage = '接続に失敗しました';
    if (error instanceof TypeError) {
      // TypeErrorは通常、ネットワークエラーやCORSエラー
      errorMessage = error.message || 'ネットワークエラーが発生しました';
    } else if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    throw new Error(`ネットワークエラー: ${errorMessage}`);
  }
}

/**
 * HTTP POSTリクエスト
 */
async function post<T>(endpoint: string, body: unknown): Promise<T> {
  // エンドポイントが/apiで始まっていない場合は追加
  const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  const result = (await response.json()) as ApiResponse<T>;
  return result.data;
}

/**
 * HTTP PATCHリクエスト
 */
async function patch<T>(endpoint: string, body: unknown): Promise<T> {
  // エンドポイントが/apiで始まっていない場合は追加
  const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;
  // eslint-disable-next-line no-console
  console.log('[API Client] PATCH request:', url, { body, API_BASE_URL });
  try {
    // AbortControllerを使用してタイムアウトを設定（30秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      await handleErrorResponse(response);
    }

    const result = (await response.json()) as ApiResponse<T>;
    // eslint-disable-next-line no-console
    console.log('[API Client] PATCH response received:', { url, status: response.status });
    return result.data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[API Client] PATCH request timeout:', { url, API_BASE_URL });
      throw new Error('リクエストがタイムアウトしました。もう一度お試しください。');
    }
    console.error('[API Client] PATCH request failed:', error, { url, API_BASE_URL });
    throw error;
  }
}

/**
 * HTTP PUTリクエスト
 */
async function put<T>(endpoint: string, body: unknown): Promise<T> {
  // エンドポイントが/apiで始まっていない場合は追加
  const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  const result = (await response.json()) as ApiResponse<T>;
  return result.data;
}

/**
 * HTTP DELETEリクエスト
 */
async function del<T>(endpoint: string): Promise<T> {
  // エンドポイントが/apiで始まっていない場合は追加
  const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  // 204 No Contentの場合はレスポンスボディがない
  if (response.status === 204) {
    return undefined as T;
  }

  const result: unknown = await response.json();
  return result as T;
}

/**
 * ファイルダウンロード
 */
async function downloadFile(endpoint: string, params?: URLSearchParams): Promise<void> {
  // エンドポイントが/apiで始まっていない場合は追加
  const normalizedEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}${params ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  // Content-Dispositionヘッダーからファイル名を取得
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = 'download';
  if (contentDisposition) {
    // filename="..." の形式を優先的に抽出
    const quotedMatch = contentDisposition.match(/filename="([^"]+)"/);
    if (quotedMatch && quotedMatch[1]) {
      filename = quotedMatch[1];
    } else {
      // filename=... の形式（クォートなし）
      const unquotedMatch = contentDisposition.match(/filename=([^;]+)/);
      if (unquotedMatch && unquotedMatch[1]) {
        filename = unquotedMatch[1].trim();
      }
    }
  }

  // Blobとして取得してダウンロード
  const blob = await response.blob();
  const urlObj = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = urlObj;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(urlObj);
}

/**
 * エラーレスポンスを処理
 */
async function handleErrorResponse(response: Response): Promise<never> {
  let errorResponse: ErrorResponse;
  try {
    errorResponse = (await response.json()) as ErrorResponse;
  } catch {
    // JSONパースに失敗した場合
    throw new ApiError(
      `API Error: ${response.status} ${response.statusText}`,
      'UNKNOWN_ERROR',
      undefined,
      response.status
    );
  }

  // エラーレスポンス形式の場合
  if (!errorResponse.success && errorResponse.error) {
    throw new ApiError(
      errorResponse.error.message,
      errorResponse.error.code,
      errorResponse.error.details,
      response.status
    );
  }

  // フォールバック
  throw new ApiError(
    `API Error: ${response.status} ${response.statusText}`,
    'UNKNOWN_ERROR',
    undefined,
    response.status
  );
}

export const apiClient = {
  get,
  post,
  patch,
  put,
  delete: del,
  downloadFile,
};
