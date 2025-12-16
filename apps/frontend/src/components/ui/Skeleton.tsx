import React from 'react';
import { cn } from '../../lib/utils';

export type SkeletonVariant = 'rectangular' | 'circular' | 'text';

export interface SkeletonProps {
  /**
   * スケルトンの形状
   * @default 'rectangular'
   */
  variant?: SkeletonVariant;
  /**
   * 幅（Tailwindクラスまたは数値）
   * @example 'w-full', 'w-64', 100
   */
  width?: string | number;
  /**
   * 高さ（Tailwindクラスまたは数値）
   * @example 'h-4', 'h-64', 100
   */
  height?: string | number;
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
 * Skeletonコンポーネント
 * ローディング中のプレースホルダー表示用コンポーネント
 */
export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className = '',
  disableAnimation = false,
}: SkeletonProps): React.JSX.Element {
  const baseStyles = 'bg-gray-200 rounded';
  const animationStyles = disableAnimation ? '' : 'animate-pulse';

  // variantに応じたスタイル
  const variantStyles: Record<SkeletonVariant, string> = {
    rectangular: '',
    circular: 'rounded-full',
    text: 'h-4',
  };

  const variantStyle = variantStyles[variant];

  // インラインスタイル（数値の場合）
  const inlineStyles: React.CSSProperties = {};
  if (typeof width === 'number') {
    inlineStyles.width = `${width}px`;
  }
  if (typeof height === 'number') {
    inlineStyles.height = `${height}px`;
  }

  // classNameに含まれる幅・高さのクラスを抽出
  const widthClass = typeof width === 'string' ? width : '';
  const heightClass = typeof height === 'string' ? height : '';

  return (
    <div
      className={cn(baseStyles, animationStyles, variantStyle, widthClass, heightClass, className)}
      style={Object.keys(inlineStyles).length > 0 ? inlineStyles : undefined}
    />
  );
}
