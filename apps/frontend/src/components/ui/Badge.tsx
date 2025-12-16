import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

/**
 * Badgeコンポーネント
 * ステータス表示やラベル用のコンポーネント
 */
export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
}: BadgeProps): React.JSX.Element {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return <span className={cn(baseStyles, variantStyle, sizeStyle, className)}>{children}</span>;
}
