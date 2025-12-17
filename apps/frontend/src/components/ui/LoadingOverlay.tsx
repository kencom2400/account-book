import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '../../lib/utils';

export interface LoadingOverlayProps {
  /**
   * ローディング状態
   */
  isLoading: boolean;
  /**
   * 表示するテキスト
   * @default '読み込み中...'
   */
  text?: string;
  /**
   * オーバーレイの背景色
   * @default 'bg-white/80'
   */
  overlayClassName?: string;
  /**
   * カスタムクラス名
   */
  className?: string;
  /**
   * 子要素
   */
  children?: React.ReactNode;
}

/**
 * LoadingOverlayコンポーネント
 * コンテンツの上にローディング表示を重ねるコンポーネント
 */
export function LoadingOverlay({
  isLoading,
  text = '読み込み中...',
  overlayClassName = 'bg-white/80',
  className = '',
  children,
}: LoadingOverlayProps): React.JSX.Element {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div
          className={cn('absolute inset-0 z-50 flex items-center justify-center', overlayClassName)}
        >
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  );
}
