import React from 'react';
import { Skeleton } from './Skeleton';
import { cn } from '../../lib/utils';

export interface TableSkeletonProps {
  /**
   * テーブルの行数
   * @default 5
   */
  rows?: number;
  /**
   * テーブルの列数
   * @default 4
   */
  columns?: number;
  /**
   * ヘッダーを表示するか
   * @default true
   */
  showHeader?: boolean;
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
 * TableSkeletonコンポーネント
 * テーブル形式のコンテンツ用スケルトンUI
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
  disableAnimation = false,
}: TableSkeletonProps): React.JSX.Element {
  return (
    <div className={cn('w-full', className)}>
      <table className="w-full border-collapse">
        {showHeader && (
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-4 py-3 text-left border-b border-gray-200">
                  <Skeleton
                    variant="text"
                    width="w-20"
                    height="h-4"
                    disableAnimation={disableAnimation}
                  />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-100">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <Skeleton
                    variant="text"
                    width="w-24"
                    height="h-4"
                    disableAnimation={disableAnimation}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
