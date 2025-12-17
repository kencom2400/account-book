'use client';

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Alert } from './Alert';
import { Button } from './Button';
import type { NotificationType } from '@/stores/notification.store';
import type { ErrorDetail } from '@account-book/types';

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

const getAlertVariant = (type: NotificationType): 'warning' | 'error' => {
  switch (type) {
    case 'warning':
      return 'warning';
    case 'error':
    case 'critical':
      return 'error';
    default:
      return 'error';
  }
};

const getTitle = (type: NotificationType): string => {
  switch (type) {
    case 'warning':
      return '警告';
    case 'error':
      return 'エラー';
    case 'critical':
      return '重大なエラー';
    default:
      return 'エラー';
  }
};

/**
 * ErrorModalコンポーネント
 * エラーモーダル表示用のコンポーネント
 * 共通UIコンポーネントライブラリに統合
 */
export function ErrorModal({
  isOpen,
  onClose,
  type,
  message,
  details,
  institutionId,
  timestamp,
  onRetry,
}: ErrorModalProps): React.JSX.Element | null {
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

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
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle(type)} size="md">
      <div className="space-y-4">
        <Alert variant={getAlertVariant(type)} message={message} showIcon={true} />

        {details && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">詳細情報</h4>
            {Array.isArray(details) ? (
              <div className="bg-gray-50 rounded p-3 space-y-2">
                {details.map((detail, index) => (
                  <div
                    key={`${detail.field || 'error'}-${detail.message}-${index}`}
                    className="text-xs text-gray-700"
                  >
                    {detail.field && <span className="font-semibold">{detail.field}: </span>}
                    <span>{detail.message}</span>
                    {detail.code && <span className="text-gray-500 ml-2">({detail.code})</span>}
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
          <div>
            <p className="text-xs text-gray-500">金融機関ID: {institutionId}</p>
          </div>
        )}

        {timestamp && (
          <div>
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

        <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
          {onRetry && (
            <Button
              variant="primary"
              onClick={handleRetry}
              disabled={isRetrying}
              isLoading={isRetrying}
              loadingText="再試行中..."
            >
              再試行
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Modal>
  );
}
