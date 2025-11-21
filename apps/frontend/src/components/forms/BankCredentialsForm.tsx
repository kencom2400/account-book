'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bank } from '@account-book/types';
import { showErrorToast } from '@/components/notifications/ErrorToast';
import { ErrorModal } from '@/components/notifications/ErrorModal';
import { useNotificationStore } from '@/stores/notification.store';

interface BankCredentialsFormProps {
  bank: Bank;
  onSubmit: (credentials: BankCredentialsData) => void;
  loading?: boolean;
  error?: string | null;
  errorDetails?: string;
}

export interface BankCredentialsData {
  bankCode: string;
  branchCode: string;
  accountNumber: string;
  apiKey?: string;
  apiSecret?: string;
}

/**
 * 銀行認証情報入力フォーム
 */
export function BankCredentialsForm({
  bank,
  onSubmit,
  loading = false,
  error = null,
  errorDetails,
}: BankCredentialsFormProps): React.JSX.Element {
  const [formData, setFormData] = useState<BankCredentialsData>({
    bankCode: bank.code,
    branchCode: '',
    accountNumber: '',
    apiKey: '',
    apiSecret: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const prevErrorRef = useRef<string | null>(null);
  const errorTimestampRef = useRef<Date | null>(null);

  // バリデーション
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!/^\d{4}$/.test(formData.bankCode)) {
      newErrors.bankCode = '銀行コードは4桁の数字で入力してください';
    }

    if (!/^\d{3}$/.test(formData.branchCode)) {
      newErrors.branchCode = '支店コードは3桁の数字で入力してください';
    }

    if (!/^\d{7}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = '口座番号は7桁の数字で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.bankCode, formData.branchCode, formData.accountNumber]);

  // エラー発生時の通知処理
  const handleError = useCallback(
    (errorMessage: string, details?: string): void => {
      // エラー発生時刻を記録（初回のみ）
      if (!errorTimestampRef.current) {
        errorTimestampRef.current = new Date();
      }

      // Zustand storeに通知を追加
      addNotification({
        type: 'error',
        message: errorMessage,
        details,
        institutionId: bank.code,
        retryable: true,
      });

      // トースト通知を表示
      showErrorToast('error', errorMessage, {
        details,
        onRetry: () => {
          // フォームを再送信
          if (validate()) {
            onSubmit(formData);
          }
        },
        onShowDetails: () => {
          setShowErrorModal(true);
        },
      });
    },
    [addNotification, bank.code, formData, onSubmit, validate]
  );

  // エラーがpropsで渡された場合の処理（useEffectで実行）
  useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      prevErrorRef.current = error;
      handleError(error, errorDetails);
    }
  }, [error, errorDetails, handleError]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof BankCredentialsData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // エラーをクリア
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 選択した銀行の表示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">接続先銀行</div>
          <div className="text-lg font-medium text-gray-900">{bank.name}</div>
        </div>

        {/* 銀行コード */}
        <div>
          <label htmlFor="bankCode" className="block text-sm font-medium text-gray-700 mb-2">
            銀行コード <span className="text-red-500">*</span>
          </label>
          <input
            id="bankCode"
            type="text"
            value={formData.bankCode}
            onChange={(e) => handleChange('bankCode', e.target.value)}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
          />
          <p className="mt-1 text-xs text-gray-500">4桁の数字（自動入力済み）</p>
          {errors.bankCode && <p className="mt-1 text-sm text-red-600">{errors.bankCode}</p>}
        </div>

        {/* 支店コード */}
        <div>
          <label htmlFor="branchCode" className="block text-sm font-medium text-gray-700 mb-2">
            支店コード <span className="text-red-500">*</span>
          </label>
          <input
            id="branchCode"
            type="text"
            value={formData.branchCode}
            onChange={(e) => handleChange('branchCode', e.target.value)}
            maxLength={3}
            placeholder="例: 001"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">3桁の数字で入力してください</p>
          {errors.branchCode && <p className="mt-1 text-sm text-red-600">{errors.branchCode}</p>}
        </div>

        {/* 口座番号 */}
        <div>
          <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
            口座番号 <span className="text-red-500">*</span>
          </label>
          <input
            id="accountNumber"
            type="text"
            value={formData.accountNumber}
            onChange={(e) => handleChange('accountNumber', e.target.value)}
            maxLength={7}
            placeholder="例: 1234567"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">7桁の数字で入力してください</p>
          {errors.accountNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
          )}
        </div>

        {/* APIキー（オプション） */}
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
            APIキー（オプション）
          </label>
          <input
            id="apiKey"
            type="text"
            value={formData.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            placeholder="銀行から発行されたAPIキーを入力"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">銀行によっては必要な場合があります</p>
        </div>

        {/* APIシークレット（オプション） */}
        <div>
          <label htmlFor="apiSecret" className="block text-sm font-medium text-gray-700 mb-2">
            APIシークレット（オプション）
          </label>
          <div className="relative">
            <input
              id="apiSecret"
              type={showApiSecret ? 'text' : 'password'}
              value={formData.apiSecret}
              onChange={(e) => handleChange('apiSecret', e.target.value)}
              placeholder="銀行から発行されたAPIシークレットを入力"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowApiSecret(!showApiSecret)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showApiSecret ? '非表示' : '表示'}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">銀行によっては必要な場合があります</p>
        </div>

        {/* 注意事項 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">セキュリティに関する注意</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  入力された認証情報は暗号化されて安全に保存されます。
                  この情報は金融機関からデータを取得するためにのみ使用されます。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              接続テスト中...
            </span>
          ) : (
            '接続テスト'
          )}
        </button>
      </form>

      {/* エラー詳細モーダル */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={(): void => setShowErrorModal(false)}
        type="error"
        message={error || ''}
        details={errorDetails}
        institutionId={bank.code}
        timestamp={errorTimestampRef.current || undefined}
        onRetry={(): void => {
          if (validate()) {
            onSubmit(formData);
          }
        }}
      />
    </>
  );
}
