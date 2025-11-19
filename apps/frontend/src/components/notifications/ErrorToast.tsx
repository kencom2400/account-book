import React from 'react';
import toast, { Toaster, Toast } from 'react-hot-toast';
import type { NotificationType } from '@/stores/notification.store';

export interface ErrorToastProps {
  t: Toast;
  type: NotificationType;
  message: string;
  details?: string;
  onRetry?: () => void;
  onShowDetails?: () => void;
}

const getBackgroundColor = (type: NotificationType): string => {
  switch (type) {
    case 'warning':
      return 'bg-yellow-50 border-yellow-200';
    case 'error':
      return 'bg-red-50 border-red-200';
    case 'critical':
      return 'bg-red-100 border-red-300';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const getTextColor = (type: NotificationType): string => {
  switch (type) {
    case 'warning':
      return 'text-yellow-800';
    case 'error':
      return 'text-red-800';
    case 'critical':
      return 'text-red-900';
    default:
      return 'text-gray-800';
  }
};

const getIconColor = (type: NotificationType): string => {
  switch (type) {
    case 'warning':
      return 'text-yellow-600';
    case 'error':
      return 'text-red-600';
    case 'critical':
      return 'text-red-700';
    default:
      return 'text-gray-600';
  }
};

export const ErrorToast: React.FC<ErrorToastProps> = ({
  t,
  type,
  message,
  details,
  onRetry,
  onShowDetails,
}) => {
  return (
    <div
      className={`${getBackgroundColor(type)} border rounded-lg shadow-lg p-4 max-w-md`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${getIconColor(type)}`}>
          {type === 'warning' && (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {(type === 'error' || type === 'critical') && (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${getTextColor(type)}`}>{message}</p>
          {details && onShowDetails && (
            <button
              onClick={onShowDetails}
              className={`text-xs ${getTextColor(type)} underline hover:no-underline mt-1`}
              aria-label="エラーの詳細を表示"
            >
              詳細を表示
            </button>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex space-x-2">
          {onRetry && (
            <button
              onClick={(): void => {
                onRetry();
                toast.dismiss(t.id);
              }}
              className={`inline-flex ${getTextColor(type)} hover:opacity-75 text-xs font-medium`}
              aria-label="再試行"
            >
              再試行
            </button>
          )}
          <button
            onClick={(): void => toast.dismiss(t.id)}
            className={`inline-flex ${getTextColor(type)} hover:opacity-75`}
            aria-label="通知を閉じる"
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
      </div>
    </div>
  );
};

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

export const ToasterContainer: React.FC = () => {
  return <Toaster position="top-right" reverseOrder={false} />;
};
