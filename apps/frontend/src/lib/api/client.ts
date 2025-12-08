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
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
}

/**
 * HTTP POSTリクエスト
 */
async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
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
 * HTTP PUTリクエスト
 */
async function put<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
  const url = `${API_BASE_URL}${endpoint}${params ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
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
