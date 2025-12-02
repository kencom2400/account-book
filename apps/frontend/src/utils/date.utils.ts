/**
 * 日付フォーマットユーティリティ
 */

/**
 * 日付を日本語形式でフォーマット（年月日のみ）
 * @param date 日付（Dateオブジェクト、ISO文字列、またはundefined）
 * @returns フォーマットされた日付文字列（例: "2025年1月30日"）
 */
export function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * 日付を日本語形式でフォーマット（年月日 + 時分）
 * @param date 日付（Dateオブジェクト、ISO文字列、またはundefined）
 * @returns フォーマットされた日付文字列（例: "2025年1月30日 14:30"）
 */
export function formatDateTime(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
