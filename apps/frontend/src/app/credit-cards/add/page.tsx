'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CardCompany, CreditCardConnectionTestResult } from '@account-book/types';
import { CardCompanySelector } from '@/components/forms/CardCompanySelector';
import {
  CreditCardCredentialsForm,
  CreditCardCredentialsData,
} from '@/components/forms/CreditCardCredentialsForm';
import { ConnectionTestResult } from '@/components/forms/ConnectionTestResult';
import { testCreditCardConnection, connectCreditCard } from '@/lib/api/credit-cards';
import { ApiError } from '@/lib/api/client';
import { getErrorMessage } from '@/utils/error.utils';

type Step = 'select' | 'credentials' | 'result';

/**
 * クレジットカード追加ページ
 */
export default function AddCreditCardPage(): React.JSX.Element {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [selectedCompany, setSelectedCompany] = useState<CardCompany | null>(null);
  const [testResult, setTestResult] = useState<CreditCardConnectionTestResult | null>(null);
  const [credentials, setCredentials] = useState<CreditCardCredentialsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // カード会社選択
  const handleSelectCompany = (company: CardCompany): void => {
    setSelectedCompany(company);
    setCurrentStep('credentials');
  };

  // 接続テスト実行
  const handleTestConnection = async (
    credentialsData: CreditCardCredentialsData
  ): Promise<void> => {
    setLoading(true);
    setCredentials(credentialsData);

    try {
      const result = await testCreditCardConnection({
        cardNumber: credentialsData.cardNumber,
        cardHolderName: credentialsData.cardHolderName,
        expiryDate: credentialsData.expiryDate,
        username: credentialsData.username,
        password: credentialsData.password,
        issuer: credentialsData.issuer,
        apiKey: credentialsData.apiKey,
      });

      setTestResult(result);
      setCurrentStep('result');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : '接続テストに失敗しました。しばらくしてから再度お試しください。';
      const errorCode = error instanceof ApiError ? error.code : undefined;

      setTestResult({
        success: false,
        message,
        errorCode,
      });
      setCurrentStep('result');
    } finally {
      setLoading(false);
    }
  };

  // クレジットカードを登録
  const handleRegisterCard = async (): Promise<void> => {
    if (!selectedCompany || !credentials) return;

    setLoading(true);
    setSaveError(null); // エラーをクリア

    const DEFAULT_SAVE_ERROR_MESSAGE =
      'クレジットカードの登録に失敗しました。もう一度お試しください。';

    try {
      // カード番号の下4桁のみを取得
      const last4Digits = credentials.cardNumber.slice(-4);

      await connectCreditCard({
        cardName: selectedCompany.name,
        cardNumber: last4Digits,
        cardHolderName: credentials.cardHolderName,
        expiryDate: credentials.expiryDate,
        username: credentials.username,
        password: credentials.password,
        issuer: credentials.issuer,
        paymentDay: credentials.paymentDay,
        closingDay: credentials.closingDay,
      });

      // 成功時のトースト通知
      toast.success(`${selectedCompany.name}を登録しました`, {
        duration: 3000,
        position: 'top-right',
      });

      // 成功したらクレジットカード管理画面に遷移
      router.push('/credit-cards');
    } catch (error) {
      // ApiErrorの詳細を取得して表示
      if (error instanceof ApiError) {
        const errorMessage = error.message || DEFAULT_SAVE_ERROR_MESSAGE;
        const details = error.details
          ?.map((detail) => `${detail.field ? `${detail.field}: ` : ''}${detail.message}`)
          .join(', ');
        setSaveError(details || errorMessage);
      } else {
        const errorMessage = getErrorMessage(error, DEFAULT_SAVE_ERROR_MESSAGE);
        setSaveError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // 再試行（認証情報入力に戻る）
  const handleRetry = (): void => {
    setCurrentStep('credentials');
    setTestResult(null);
  };

  // カード会社選択に戻る
  const handleBackToSelect = (): void => {
    setCurrentStep('select');
    setSelectedCompany(null);
    setTestResult(null);
    setCredentials(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            戻る
          </button>
          <h1 className="text-3xl font-bold text-gray-900">クレジットカードを追加</h1>
          <p className="mt-2 text-gray-600">
            クレジットカードを連携して、自動で利用明細を取得します
          </p>
        </div>

        {/* ステップインジケーター */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div
                className={`w-full h-2 rounded ${
                  currentStep === 'select' ? 'bg-blue-600' : 'bg-blue-200'
                }`}
              ></div>
              <div className="mt-2 text-sm font-medium text-gray-900">1. カード会社選択</div>
            </div>
            <div className="w-8"></div>
            <div className="flex-1">
              <div
                className={`w-full h-2 rounded ${
                  currentStep === 'credentials' || currentStep === 'result'
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                }`}
              ></div>
              <div className="mt-2 text-sm font-medium text-gray-900">2. 認証情報入力</div>
            </div>
            <div className="w-8"></div>
            <div className="flex-1">
              <div
                className={`w-full h-2 rounded ${
                  currentStep === 'result' ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              ></div>
              <div className="mt-2 text-sm font-medium text-gray-900">3. 接続テスト</div>
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="bg-white rounded-lg shadow p-6">
          {currentStep === 'select' && (
            <CardCompanySelector
              onSelectCompany={handleSelectCompany}
              selectedCompany={selectedCompany || undefined}
            />
          )}

          {currentStep === 'credentials' && selectedCompany && (
            <div>
              <button
                onClick={handleBackToSelect}
                className="text-blue-600 hover:text-blue-800 mb-4"
              >
                ← カード会社を変更
              </button>
              <CreditCardCredentialsForm
                company={selectedCompany}
                onSubmit={handleTestConnection}
                loading={loading}
              />
            </div>
          )}

          {currentStep === 'result' && testResult && (
            <div>
              {saveError && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{saveError}</p>
                    </div>
                  </div>
                </div>
              )}
              <ConnectionTestResult
                result={testResult}
                onRetry={handleRetry}
                onContinue={testResult.success ? handleRegisterCard : undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
