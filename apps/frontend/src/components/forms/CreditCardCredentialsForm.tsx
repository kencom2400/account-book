'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CardCompany } from '@account-book/types';
import { showErrorToast, ErrorModal } from '@/components/ui';
import { useNotificationStore } from '@/stores/notification.store';

interface CreditCardCredentialsFormProps {
  company: CardCompany;
  onSubmit: (credentials: CreditCardCredentialsData) => void;
  loading?: boolean;
  error?: string | null;
  errorDetails?: string;
}

export interface CreditCardCredentialsData {
  cardNumber: string; // 16桁
  cardHolderName: string;
  expiryDate: string; // YYYY-MM-DD形式
  username: string;
  password: string;
  issuer: string;
  apiKey?: string;
  paymentDay: number;
  closingDay: number;
}

/**
 * クレジットカード認証情報入力フォーム
 */
export function CreditCardCredentialsForm({
  company,
  onSubmit,
  loading = false,
  error = null,
  errorDetails,
}: CreditCardCredentialsFormProps): React.JSX.Element {
  const [formData, setFormData] = useState<CreditCardCredentialsData>({
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '',
    username: '',
    password: '',
    issuer: company.name,
    apiKey: '',
    paymentDay: 10,
    closingDay: 15,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const prevErrorRef = useRef<string | null>(null);
  const errorTimestampRef = useRef<Date | null>(null);
  const formDataRef = useRef(formData);

  // formDataRefを常に最新の状態に保つ
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // バリデーション
  const validate = useCallback((dataToValidate: CreditCardCredentialsData): boolean => {
    const newErrors: Record<string, string> = {};

    // カード番号（16桁、Luhnアルゴリズム）
    if (!/^\d{16}$/.test(dataToValidate.cardNumber)) {
      newErrors.cardNumber = 'カード番号は16桁の数字で入力してください';
    } else if (!luhnCheck(dataToValidate.cardNumber)) {
      newErrors.cardNumber = 'カード番号が正しくありません';
    }

    // カード名義
    if (!dataToValidate.cardHolderName.trim()) {
      newErrors.cardHolderName = 'カード名義は必須です';
    } else if (dataToValidate.cardHolderName.length > 100) {
      newErrors.cardHolderName = 'カード名義は100文字以下で入力してください';
    }

    // 有効期限（未来日付）
    if (!dataToValidate.expiryDate) {
      newErrors.expiryDate = '有効期限は必須です';
    } else {
      const expiry = new Date(dataToValidate.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiry <= today) {
        newErrors.expiryDate = '有効期限は未来の日付を入力してください';
      }
    }

    // ログインID（メールアドレス形式）
    if (!dataToValidate.username.trim()) {
      newErrors.username = 'ログインIDは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dataToValidate.username)) {
      newErrors.username = 'ログインIDは有効なメールアドレス形式で入力してください';
    }

    // パスワード
    if (!dataToValidate.password) {
      newErrors.password = 'パスワードは必須です';
    } else if (dataToValidate.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください';
    }

    // 引落日
    if (
      !dataToValidate.paymentDay ||
      dataToValidate.paymentDay < 1 ||
      dataToValidate.paymentDay > 31
    ) {
      newErrors.paymentDay = '引落日は1〜31の範囲で入力してください';
    }

    // 締め日
    if (
      !dataToValidate.closingDay ||
      dataToValidate.closingDay < 1 ||
      dataToValidate.closingDay > 31
    ) {
      newErrors.closingDay = '締め日は1〜31の範囲で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  // Luhnアルゴリズムによるカード番号検証
  const luhnCheck = (cardNumber: string): boolean => {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

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
        institutionId: company.code,
        retryable: true,
      });

      // トースト通知を表示
      showErrorToast('error', errorMessage, {
        details,
        onRetry: () => {
          // フォームを再送信（最新のformDataを使用）
          if (validate(formDataRef.current)) {
            onSubmit(formDataRef.current);
          }
        },
        onShowDetails: () => {
          setShowErrorModal(true);
        },
      });
    },
    [addNotification, company.code, onSubmit, validate]
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
    if (validate(formData)) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof CreditCardCredentialsData, value: string | number): void => {
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

  // カード番号の入力フォーマット（4桁ごとにスペース）
  const formatCardNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 16);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 選択したカード会社の表示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">接続先カード会社</div>
          <div className="text-lg font-medium text-gray-900">{company.name}</div>
        </div>

        {/* カード番号 */}
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-2">
            カード番号 <span className="text-red-500">*</span>
          </label>
          <input
            id="cardNumber"
            type="text"
            value={formData.cardNumber}
            onChange={(e) => {
              const formatted = formatCardNumber(e.target.value);
              handleChange('cardNumber', formatted);
            }}
            maxLength={16}
            placeholder="1234567812345678"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">16桁の数字で入力してください</p>
          {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
        </div>

        {/* カード名義 */}
        <div>
          <label htmlFor="cardHolderName" className="block text-sm font-medium text-gray-700 mb-2">
            カード名義 <span className="text-red-500">*</span>
          </label>
          <input
            id="cardHolderName"
            type="text"
            value={formData.cardHolderName}
            onChange={(e) => handleChange('cardHolderName', e.target.value.toUpperCase())}
            placeholder="TARO YAMADA"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            カード表面に記載されている名義を入力してください
          </p>
          {errors.cardHolderName && (
            <p className="mt-1 text-sm text-red-600">{errors.cardHolderName}</p>
          )}
        </div>

        {/* 有効期限 */}
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-2">
            有効期限 <span className="text-red-500">*</span>
          </label>
          <input
            id="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => handleChange('expiryDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            カード表面に記載されている有効期限を入力してください
          </p>
          {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>}
        </div>

        {/* ログインID */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            ログインID <span className="text-red-500">*</span>
          </label>
          <input
            id="username"
            type="email"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            placeholder="user@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Web明細サービスのログインID（メールアドレス）
          </p>
          {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
        </div>

        {/* パスワード */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            パスワード <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Web明細サービスのパスワード"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? '非表示' : '表示'}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Web明細サービスのパスワード（8文字以上）</p>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        {/* 引落日 */}
        <div>
          <label htmlFor="paymentDay" className="block text-sm font-medium text-gray-700 mb-2">
            引落日 <span className="text-red-500">*</span>
          </label>
          <input
            id="paymentDay"
            type="number"
            min="1"
            max="31"
            value={formData.paymentDay}
            onChange={(e) => handleChange('paymentDay', parseInt(e.target.value, 10) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">毎月の引落日（1〜31）</p>
          {errors.paymentDay && <p className="mt-1 text-sm text-red-600">{errors.paymentDay}</p>}
        </div>

        {/* 締め日 */}
        <div>
          <label htmlFor="closingDay" className="block text-sm font-medium text-gray-700 mb-2">
            締め日 <span className="text-red-500">*</span>
          </label>
          <input
            id="closingDay"
            type="number"
            min="1"
            max="31"
            value={formData.closingDay}
            onChange={(e) => handleChange('closingDay', parseInt(e.target.value, 10) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">毎月の締め日（1〜31）</p>
          {errors.closingDay && <p className="mt-1 text-sm text-red-600">{errors.closingDay}</p>}
        </div>

        {/* API認証キー（オプション） */}
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
            API認証キー（オプション）
          </label>
          <input
            id="apiKey"
            type="text"
            value={formData.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            placeholder="カード会社から発行されたAPI認証キーを入力"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">カード会社によっては必要な場合があります</p>
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
                  この情報はカード会社からデータを取得するためにのみ使用されます。
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
        institutionId={company.code}
        timestamp={errorTimestampRef.current || undefined}
        onRetry={(): void => {
          if (validate(formDataRef.current)) {
            onSubmit(formDataRef.current);
          }
        }}
      />
    </>
  );
}
