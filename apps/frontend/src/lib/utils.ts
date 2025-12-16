import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSSクラス名を安全にマージするユーティリティ関数
 * @param inputs - マージするクラス名（文字列、オブジェクト、配列など）
 * @returns マージされたクラス名
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
