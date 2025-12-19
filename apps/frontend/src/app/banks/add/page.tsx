'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Bank, BankConnectionTestResult, InstitutionType } from '@account-book/types';
import { BankSelector } from '@/components/forms/BankSelector';
import { BankCredentialsForm, BankCredentialsData } from '@/components/forms/BankCredentialsForm';
import { ConnectionTestResult } from '@/components/forms/ConnectionTestResult';
import { testBankConnection, createInstitution } from '@/lib/api/institutions';
import { ApiError } from '@/lib/api/client';
import { getErrorMessage } from '@/utils/error.utils';

type Step = 'select' | 'credentials' | 'result';

/**
 * 銀行追加ページ
 */
export default function AddBankPage(): React.JSX.Element {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [testResult, setTestResult] = useState<BankConnectionTestResult | null>(null);
  const [credentials, setCredentials] = useState<BankCredentialsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 銀行選択
  const handleSelectBank = (bank: Bank): void => {
    setSelectedBank(bank);
    setCurrentStep('credentials');
  };

  // 接続テスト実行
  const handleTestConnection = async (credentialsData: BankCredentialsData): Promise<void> => {
    setLoading(true);
    setCredentials(credentialsData);

    try {
      const result = await testBankConnection({
        bankCode: credentialsData.bankCode,
        authenticationType: credentialsData.authenticationType,
        branchCode: credentialsData.branchCode,
        accountNumber: credentialsData.accountNumber,
        apiKey: credentialsData.apiKey,
        apiSecret: credentialsData.apiSecret,
        userId: credentialsData.userId,
        password: credentialsData.password,
      });

      setTestResult(result);
      setCurrentStep('result');
    } catch (error) {
      // ApiErrorの場合は詳細を表示
      if (error instanceof ApiError) {
        const errorMessage = error.message || '接続テストに失敗しました。';
        const details = error.details
          ?.map((detail) => `${detail.field ? `${detail.field}: ` : ''}${detail.message}`)
          .join(', ');
        setTestResult({
          success: false,
          message: details || errorMessage,
          errorCode: error.code,
        });
      } else {
        // その他のエラーの場合
        const errorMessage = getErrorMessage(
          error,
          '接続テストに失敗しました。しばらくしてから再度お試しください。'
        );
        setTestResult({
          success: false,
          message: errorMessage,
        });
      }
      setCurrentStep('result');
    } finally {
      setLoading(false);
    }
  };

  // 銀行を登録
  const handleRegisterBank = async (): Promise<void> => {
    if (!selectedBank || !credentials) return;

    setLoading(true);
    setSaveError(null); // エラーをクリア

    const DEFAULT_SAVE_ERROR_MESSAGE = '銀行の登録に失敗しました。もう一度お試しください。';

    try {
      await createInstitution({
        name: selectedBank.name,
        type: InstitutionType.BANK,
        credentials: {
          bankCode: credentials.bankCode,
          authenticationType: credentials.authenticationType,
          branchCode: credentials.branchCode,
          accountNumber: credentials.accountNumber,
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
          userId: credentials.userId,
          password: credentials.password,
        },
      });

      // 成功時のトースト通知
      toast.success(`${selectedBank.name}を登録しました`, {
        duration: 3000,
        position: 'top-right',
      });

      // 成功したらダッシュボードに遷移
      router.push('/dashboard');
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

  // 銀行選択に戻る
  const handleBackToSelect = (): void => {
    setCurrentStep('select');
    setSelectedBank(null);
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
          <h1 className="text-3xl font-bold text-gray-900">銀行口座を追加</h1>
          <p className="mt-2 text-gray-600">銀行口座を連携して、自動で取引履歴を取得します</p>
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
              <div className="mt-2 text-sm font-medium text-gray-900">1. 銀行選択</div>
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
            <BankSelector
              onSelectBank={handleSelectBank}
              selectedBank={selectedBank || undefined}
            />
          )}

          {currentStep === 'credentials' && selectedBank && (
            <div>
              <button
                onClick={handleBackToSelect}
                className="text-blue-600 hover:text-blue-800 mb-4"
              >
                ← 銀行を変更
              </button>
              <BankCredentialsForm
                bank={selectedBank}
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
                onContinue={testResult.success ? handleRegisterBank : undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
