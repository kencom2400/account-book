export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata: {
    timestamp: string;
    version: string;
  };
}

import { ErrorDetail } from './api/error-response';

export interface ApiError {
  code: string;
  message: string;
  /** 詳細エラー配列（任意） */
  details?: ErrorDetail[];
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
