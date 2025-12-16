import React from 'react';
import { Skeleton } from './Skeleton';
import { cn } from '../../lib/utils';

export interface CardSkeletonProps {
  /**
   * カードの行数
   * @default 1
   */
  rows?: number;
  /**
   * カスタムクラス名
   */
  className?: string;
  /**
   * アニメーションを無効化するか
   * @default false
   */
  disableAnimation?: boolean;
}

/**
 * CardSkeletonコンポーネント
 * カード形式のコンテンツ用スケルトンUI
 */
export function CardSkeleton({
  rows = 1,
  className = '',
  disableAnimation = false,
}: CardSkeletonProps): React.JSX.Element {
  return (
    <div className={cn('bg-white rounded-lg shadow-md p-6', className)}>
      {/* ヘッダー部分 */}
      <div className="mb-4 space-y-2">
        <Skeleton variant="text" width="w-1/3" height="h-6" disableAnimation={disableAnimation} />
        <Skeleton variant="text" width="w-1/2" height="h-4" disableAnimation={disableAnimation} />
      </div>

      {/* コンテンツ部分 */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton
              variant="text"
              width="w-full"
              height="h-4"
              disableAnimation={disableAnimation}
            />
            <Skeleton
              variant="text"
              width="w-5/6"
              height="h-4"
              disableAnimation={disableAnimation}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
