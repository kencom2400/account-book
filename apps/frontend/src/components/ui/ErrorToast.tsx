'use client';

import React from 'react';
import toast, { Toaster, Toast } from 'react-hot-toast';
import { Alert } from './Alert';
import { Button } from './Button';
import type { NotificationType } from '@/stores/notification.store';
import { getAlertVariant } from '@/utils/notification.utils';

export interface ErrorToastProps {
  t: Toast;
  type: NotificationType;
  message: string;
  details?: string;
  onRetry?: () => void;
  onShowDetails?: () => void;
}

/**
 * ErrorToastコンポーネント
 * エラートースト通知表示用のコンポーネント
 * 共通UIコンポーネントライブラリに統合
 */
export function ErrorToast({
  t,
  type,
  message,
  details,
  onRetry,
  onShowDetails,
}: ErrorToastProps): React.JSX.Element {
  return (
    <div className="max-w-md">
      <Alert
        variant={getAlertVariant(type)}
        message={message}
        showIcon={true}
        dismissible={true}
        onClose={(): void => toast.dismiss(t.id)}
        size="sm"
      >
        {details && onShowDetails && (
          <div className="mt-2">
            <Button variant="ghost" size="sm" onClick={onShowDetails} className="text-xs">
              詳細を表示
            </Button>
          </div>
        )}
        {onRetry && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(): void => {
                onRetry();
                toast.dismiss(t.id);
              }}
              className="text-xs"
            >
              再試行
            </Button>
          </div>
        )}
      </Alert>
    </div>
  );
}

/**
 * エラートースト通知を表示する関数
 */
export const showErrorToast = (
  type: NotificationType,
  message: string,
  options?: {
    details?: string;
    onRetry?: () => void;
    onShowDetails?: () => void;
    duration?: number;
  }
): void => {
  toast.custom(
    (t: Toast) => (
      <ErrorToast
        t={t}
        type={type}
        message={message}
        details={options?.details}
        onRetry={options?.onRetry}
        onShowDetails={options?.onShowDetails}
      />
    ),
    {
      duration: options?.duration ?? 5000,
      position: 'top-right',
    }
  );
};

/**
 * Toasterコンテナコンポーネント
 */
export const ToasterContainer: React.FC = () => {
  return <Toaster position="top-right" reverseOrder={false} />;
};
