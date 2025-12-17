import React from 'react';
import { Spinner } from './Spinner';
import { cn } from '../../lib/utils';

export interface LoadingSpinnerProps {
  /**
   * スピナーのサイズ
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 表示するテキスト
   * @default '読み込み中...'
   */
  text?: string;
  /**
   * テキストを表示するか
   * @default true
   */
  showText?: boolean;
  /**
   * カスタムクラス名
   */
  className?: string;
  /**
   * コンテナのクラス名
   */
  containerClassName?: string;
}

/**
 * LoadingSpinnerコンポーネント
 * 統一されたローディング表示コンポーネント
 */
export function LoadingSpinner({
  size = 'md',
  text = '読み込み中...',
  showText = true,
  className = '',
  containerClassName = '',
}: LoadingSpinnerProps): React.JSX.Element {
  return (
    <div className={cn('flex items-center justify-center', containerClassName)}>
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <Spinner size={size} className="text-blue-600" />
        {showText && <p className="text-gray-600 text-sm">{text}</p>}
      </div>
    </div>
  );
}
