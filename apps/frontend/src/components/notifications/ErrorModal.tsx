import React, { useState } from 'react';
import type { NotificationType } from '@/stores/notification.store';

/**
 * エラー詳細情報
 */
export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: NotificationType;
  message: string;
  /** エラー詳細（文字列または配列形式） */
  details?: string | ErrorDetail[];
  institutionId?: string;
  timestamp?: Date;
  onRetry?: () => Promise<void> | void;
}

const getHeaderColor = (type: NotificationType): string => {
  switch (type) {
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'critical':
      return 'bg-red-200 text-red-900';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  type,
  message,
  details,
  institutionId,
  timestamp,
  onRetry,
}) => {
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  if (!isOpen) {
    return null;
  }

  const handleRetry = async (): Promise<void> => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
      onClose();
    } catch (error: unknown) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className={`px-4 py-3 sm:px-6 ${getHeaderColor(type)}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium leading-6" id="modal-title">
                {type === 'warning' && '⚠️ 警告'}
                {type === 'error' && '❌ エラー'}
                {type === 'critical' && '🚨 重大なエラー'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-900"
                aria-label="モーダルを閉じる"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="mt-2">
                  <p className="text-sm text-gray-700 font-medium mb-4">{message}</p>

                  {details && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">詳細情報</h4>
                      {Array.isArray(details) ? (
                        <div className="bg-gray-50 rounded p-3 space-y-2">
                          {details.map((detail, index) => (
                            <div key={index} className="text-xs text-gray-700">
                              {detail.field && (
                                <span className="font-semibold">{detail.field}: </span>
                              )}
                              <span>{detail.message}</span>
                              {detail.code && (
                                <span className="text-gray-500 ml-2">({detail.code})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded p-3 text-xs text-gray-700 font-mono whitespace-pre-wrap">
                          {details}
                        </div>
                      )}
                    </div>
                  )}

                  {institutionId && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500">金融機関ID: {institutionId}</p>
                    </div>
                  )}

                  {timestamp && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        発生時刻:{' '}
                        {timestamp.toLocaleString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            {onRetry && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrying ? '再試行中...' : '再試行'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
