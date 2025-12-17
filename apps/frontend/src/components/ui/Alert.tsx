'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info';
export type AlertSize = 'sm' | 'md' | 'lg';

export interface AlertProps {
  /**
   * アラートの種類
   * @default 'info'
   */
  variant?: AlertVariant;
  /**
   * アラートのサイズ
   * @default 'md'
   */
  size?: AlertSize;
  /**
   * アラートのタイトル（オプション）
   */
  title?: string;
  /**
   * アラートのメッセージ
   */
  message: string;
  /**
   * アイコンを表示するか
   * @default true
   */
  showIcon?: boolean;
  /**
   * 閉じるボタンを表示するか
   * @default false
   */
  dismissible?: boolean;
  /**
   * 閉じるボタンがクリックされたときのコールバック
   */
  onClose?: () => void;
  /**
   * カスタムクラス名
   */
  className?: string;
  /**
   * 子要素（追加のコンテンツ）
   */
  children?: React.ReactNode;
}

const variantStyles: Record<
  AlertVariant,
  { bg: string; border: string; text: string; icon: string }
> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-600',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: 'text-yellow-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-600',
  },
};

const sizeStyles: Record<AlertSize, { padding: string; text: string; icon: string }> = {
  sm: {
    padding: 'p-2',
    text: 'text-sm',
    icon: 'h-4 w-4',
  },
  md: {
    padding: 'p-3',
    text: 'text-base',
    icon: 'h-5 w-5',
  },
  lg: {
    padding: 'p-4',
    text: 'text-lg',
    icon: 'h-6 w-6',
  },
};

const focusRingStyles: Record<AlertVariant, string> = {
  success: 'focus:ring-green-500',
  warning: 'focus:ring-yellow-500',
  error: 'focus:ring-red-500',
  info: 'focus:ring-blue-500',
};

/**
 * Alertコンポーネント
 * エラー、警告、情報、成功メッセージを表示するコンポーネント
 */
export function Alert({
  variant = 'info',
  size = 'md',
  title,
  message,
  showIcon = true,
  dismissible = false,
  onClose,
  className = '',
  children,
}: AlertProps): React.JSX.Element {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const getIcon = (): React.JSX.Element | null => {
    if (!showIcon) return null;

    const iconClass = cn(sizeStyle.icon, variantStyle.icon);

    switch (variant) {
      case 'success':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'info':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
      default: {
        const _exhaustiveCheck: never = variant;
        return null;
      }
    }
  };

  return (
    <div
      className={cn(
        'rounded-md border',
        variantStyle.bg,
        variantStyle.border,
        sizeStyle.padding,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        {showIcon && <div className="flex-shrink-0 mr-3">{getIcon()}</div>}
        <div className="flex-1">
          {title && (
            <h3 className={cn('font-medium mb-1', sizeStyle.text, variantStyle.text)}>{title}</h3>
          )}
          <p className={cn(sizeStyle.text, variantStyle.text)}>{message}</p>
          {children && <div className="mt-2">{children}</div>}
        </div>
        {dismissible && onClose && (
          <div className="ml-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                variantStyle.text,
                focusRingStyles[variant]
              )}
              aria-label="アラートを閉じる"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
