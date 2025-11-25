import { CategoryType } from './enums/category-type.enum';

/**
 * サブカテゴリ（詳細費目）の型定義
 * FR-009: 詳細費目分類機能
 */

/**
 * サブカテゴリ
 */
export interface Subcategory {
  id: string;
  categoryType: CategoryType;
  name: string;
  parentId: string | null;
  displayOrder: number;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Subcategory[];
}

/**
 * 分類理由
 */
export enum ClassificationReason {
  MERCHANT_MATCH = 'MERCHANT_MATCH',
  KEYWORD_MATCH = 'KEYWORD_MATCH',
  AMOUNT_INFERENCE = 'AMOUNT_INFERENCE',
  RECURRING_PATTERN = 'RECURRING_PATTERN',
  DEFAULT = 'DEFAULT',
}

/**
 * 分類リクエスト
 */
export interface ClassificationRequest {
  transactionId: string;
  description: string;
  amount: number;
  mainCategory: CategoryType;
  transactionDate?: string;
}

/**
 * 分類結果
 */
export interface ClassificationResult {
  subcategory: Subcategory;
  confidence: number;
  reason: ClassificationReason;
  merchantId?: string | null;
  merchantName?: string | null;
}

/**
 * バッチ分類リクエスト
 */
export interface BatchClassificationRequest {
  transactions: ClassificationRequest[];
}

/**
 * バッチ分類結果
 */
export interface BatchClassificationResult {
  transactionId: string;
  success: boolean;
  subcategoryId?: string;
  confidence?: number;
  reason?: ClassificationReason;
  errorMessage?: string;
}

/**
 * バッチ分類レスポンス
 */
export interface BatchClassificationResponse {
  results: BatchClassificationResult[];
  summary: {
    total: number;
    success: number;
    failure: number;
  };
}
