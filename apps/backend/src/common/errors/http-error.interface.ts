/**
 * HTTPエラーインターフェース
 * API呼び出しで発生するHTTPエラーの構造を定義
 */
export interface HttpError extends Error {
  statusCode: number;
  response?: {
    statusCode: number;
    message: string | string[];
    error?: string;
  };
}

/**
 * 型ガード: エラーオブジェクトがHttpErrorかどうかを判定
 * @param error - チェックするエラーオブジェクト
 * @returns HttpErrorの場合true
 *
 * @example
 * ```typescript
 * try {
 *   await apiCall();
 * } catch (error) {
 *   if (isHttpError(error)) {
 *     // error.statusCodeに安全にアクセス可能
 *     if (error.statusCode === 401) {
 *       // 認証エラー処理
 *     }
 *   }
 * }
 * ```
 */
export function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as { statusCode: unknown }).statusCode === 'number'
  );
}

/**
 * HTTPステータスコードを安全に取得
 * @param error - エラーオブジェクト
 * @returns HTTPステータスコード、取得できない場合はundefined
 */
export function getHttpStatusCode(error: unknown): number | undefined {
  if (isHttpError(error)) {
    return error.statusCode;
  }
  return undefined;
}
