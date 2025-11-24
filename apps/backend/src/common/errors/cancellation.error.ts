/**
 * キャンセル操作を表すカスタムエラー
 *
 * ユーザーの明示的なキャンセル操作やAbortControllerによる中断を表現します。
 * エラーメッセージの文字列比較ではなく、instanceof で型安全に判定できます。
 *
 * @example
 * ```typescript
 * // エラーのスロー
 * if (abortSignal?.aborted) {
 *   throw new CancellationError('Transaction fetch was cancelled');
 * }
 *
 * // エラーの判定
 * try {
 *   await fetchData();
 * } catch (error) {
 *   if (error instanceof CancellationError) {
 *     // キャンセル処理
 *   }
 * }
 * ```
 */
export class CancellationError extends Error {
  constructor(message: string = 'Operation was cancelled') {
    super(message);
    this.name = 'CancellationError';
    // スタックトレースを正しく設定
    Error.captureStackTrace?.(this, CancellationError);
  }
}
