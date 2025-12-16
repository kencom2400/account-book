import React from 'react';
import { Skeleton } from './Skeleton';
import { cn } from '../../lib/utils';

export interface ListSkeletonProps {
  /**
   * リストアイテムの数
   * @default 5
   */
  count?: number;
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
 * ListSkeletonコンポーネント
 * リスト形式のコンテンツ用スケルトンUI
 */
export function ListSkeleton({
  count = 5,
  className = '',
  disableAnimation = false,
}: ListSkeletonProps): React.JSX.Element {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          {/* アバター/アイコン部分 */}
          <Skeleton variant="circular" width={40} height={40} disableAnimation={disableAnimation} />
          {/* テキスト部分 */}
          <div className="flex-1 space-y-2">
            <Skeleton
              variant="text"
              width="w-1/3"
              height="h-4"
              disableAnimation={disableAnimation}
            />
            <Skeleton
              variant="text"
              width="w-1/2"
              height="h-3"
              disableAnimation={disableAnimation}
            />
          </div>
          {/* アクション部分 */}
          <Skeleton
            variant="rectangular"
            width={60}
            height={32}
            disableAnimation={disableAnimation}
          />
        </div>
      ))}
    </div>
  );
}
