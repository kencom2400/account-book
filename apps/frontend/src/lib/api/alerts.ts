/**
 * アラートAPIクライアント
 * バックエンドのアラートAPIと通信を行う
 */

import { apiClient } from './client';

/**
 * アラートレベル
 */
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * アラートタイプ
 */
export enum AlertType {
  AMOUNT_MISMATCH = 'amount_mismatch',
  PAYMENT_NOT_FOUND = 'payment_not_found',
  OVERDUE = 'overdue',
  MULTIPLE_CANDIDATES = 'multiple_candidates',
}

/**
 * アラートステータス
 */
export enum AlertStatus {
  UNREAD = 'unread',
  READ = 'read',
  RESOLVED = 'resolved',
}

/**
 * アクションタイプ
 */
export enum ActionType {
  VIEW_DETAILS = 'view_details',
  MANUAL_MATCH = 'manual_match',
  MARK_RESOLVED = 'mark_resolved',
  CONTACT_BANK = 'contact_bank',
  IGNORE = 'ignore',
}

/**
 * アラート詳細情報
 */
export interface AlertDetails {
  cardId: string;
  cardName: string;
  billingMonth: string;
  expectedAmount: number;
  actualAmount: number | null;
  discrepancy: number | null;
  paymentDate: string | null;
  daysElapsed: number | null;
  relatedTransactions: string[];
  reconciliationId: string | null;
}

/**
 * アラートアクション
 */
export interface AlertAction {
  id: string;
  label: string;
  action: ActionType;
  isPrimary: boolean;
}

/**
 * アラート一覧項目（簡略版）
 */
export interface AlertListItem {
  id: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  status: AlertStatus;
  createdAt: string;
}

/**
 * アラート詳細
 */
export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  title: string;
  message: string;
  details: AlertDetails;
  status: AlertStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
  actions: AlertAction[];
}

/**
 * アラート一覧レスポンス
 */
export interface AlertListResponse {
  alerts: AlertListItem[];
  total: number;
  unreadCount: number;
}

/**
 * アラート生成リクエスト
 */
export interface CreateAlertRequest {
  reconciliationId: string;
}

/**
 * アラート解決リクエスト
 */
export interface ResolveAlertRequest {
  resolvedBy: string;
  resolutionNote?: string;
}

/**
 * アラート取得クエリパラメータ
 */
export interface GetAlertsQuery {
  level?: AlertLevel;
  status?: AlertStatus;
  type?: AlertType;
  cardId?: string;
  billingMonth?: string;
  page?: number;
  limit?: number;
}

/**
 * アラートAPIクライアント
 */
export const alertApi = {
  /**
   * アラート一覧を取得
   */
  getAll: async (query?: GetAlertsQuery): Promise<AlertListResponse> => {
    const params = new URLSearchParams();
    if (query?.level) params.append('level', query.level);
    if (query?.status) params.append('status', query.status);
    if (query?.type) params.append('type', query.type);
    if (query?.cardId) params.append('cardId', query.cardId);
    if (query?.billingMonth) params.append('billingMonth', query.billingMonth);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/api/alerts?${queryString}` : '/api/alerts';

    return await apiClient.get<AlertListResponse>(endpoint);
  },

  /**
   * アラート詳細を取得
   */
  getById: async (id: string): Promise<Alert> => {
    return await apiClient.get<Alert>(`/api/alerts/${id}`);
  },

  /**
   * アラートを生成（内部用）
   */
  create: async (request: CreateAlertRequest): Promise<Alert> => {
    return await apiClient.post<Alert>('/api/alerts', request);
  },

  /**
   * アラートを解決済みにする
   */
  resolve: async (id: string, request: ResolveAlertRequest): Promise<Alert> => {
    return await apiClient.patch<Alert>(`/api/alerts/${id}/resolve`, request);
  },

  /**
   * アラートを既読にする
   */
  markAsRead: async (id: string): Promise<Alert> => {
    return await apiClient.patch<Alert>(`/api/alerts/${id}/read`, {});
  },

  /**
   * アラートを削除
   */
  delete: async (id: string): Promise<void> => {
    return await apiClient.delete(`/api/alerts/${id}`);
  },
};
