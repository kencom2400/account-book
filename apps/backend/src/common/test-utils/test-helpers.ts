/**
 * ユニットテスト用のヘルパー関数
 *
 * テストでよく使用する共通のヘルパー関数を提供します。
 */

/**
 * テスト用の日付を生成するヘルパー関数
 *
 * @param year - 年
 * @param month - 月（1-12）
 * @param day - 日
 * @returns Dateオブジェクト
 */
export function createTestDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

/**
 * テスト用のUUID風の文字列を生成するヘルパー関数
 *
 * @param prefix - プレフィックス（デフォルト: 'test'）
 * @returns UUID風の文字列
 */
export function createTestId(prefix = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 非同期関数の実行を待機するヘルパー関数
 *
 * @param ms - 待機時間（ミリ秒）
 * @returns Promise
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
