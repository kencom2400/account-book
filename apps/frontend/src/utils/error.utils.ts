/**
 * エラーハンドリング用のユーティリティ関数
 */

/**
 * エラーオブジェクトからメッセージを抽出する
 *
 * @param error - エラーオブジェクト（unknown型）
 * @param defaultMessage - エラーメッセージが取得できない場合のデフォルトメッセージ
 * @returns エラーメッセージ文字列
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (err) {
 *   const errorMessage = getErrorMessage(err, '操作に失敗しました');
 *   showErrorToast('error', errorMessage);
 * }
 * ```
 */
export function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return defaultMessage;
}
