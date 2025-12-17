import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface PageLoadingProps {
  /**
   * 表示するテキスト
   * @default '読み込み中...'
   */
  text?: string;
  /**
   * カスタムクラス名
   */
  className?: string;
}

/**
 * PageLoadingコンポーネント
 * ページ全体のローディング表示用コンポーネント
 */
export function PageLoading({
  text = '読み込み中...',
  className = '',
}: PageLoadingProps): React.JSX.Element {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}
