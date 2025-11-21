/**
 * エラーレスポンスの型定義
 * Issue #214: エラーレスポンスdetailsフィールドの形式を統一
 */

/**
 * エラー詳細情報
 */
export interface ErrorDetail {
  /** エラーが発生したフィールド名（任意） */
  field?: string;
  /** エラーの詳細メッセージ（必須） */
  message: string;
  /** フィールド固有のエラーコード（任意） */
  code?: string;
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    /** 詳細エラー配列（任意） */
    details?: ErrorDetail[];
  };
  metadata: {
    timestamp: string;
    version: string;
  };
}
