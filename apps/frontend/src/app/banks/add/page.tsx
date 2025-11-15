'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bank, BankConnectionTestResult, InstitutionType } from '@account-book/types';
import { BankSelector } from '@/components/forms/BankSelector';
import { BankCredentialsForm, BankCredentialsData } from '@/components/forms/BankCredentialsForm';
import { ConnectionTestResult } from '@/components/forms/ConnectionTestResult';
import { testBankConnection, createInstitution } from '@/lib/api/institutions';

type Step = 'select' | 'credentials' | 'result';

/**
 * 銀行追加ページ
 */
export default function AddBankPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [testResult, setTestResult] = useState<BankConnectionTestResult | null>(null);
  const [credentials, setCredentials] = useState<BankCredentialsData | null>(null);
  const [loading, setLoading] = useState(false);

  // 銀行選択
  const handleSelectBank = (bank: Bank) => {
    setSelectedBank(bank);
    setCurrentStep('credentials');
  };

  // 接続テスト実行
  const handleTestConnection = async (credentialsData: BankCredentialsData) => {
    setLoading(true);
    setCredentials(credentialsData);

    try {
      const result = await testBankConnection({
        bankCode: credentialsData.bankCode,
        branchCode: credentialsData.branchCode,
        accountNumber: credentialsData.accountNumber,
        apiKey: credentialsData.apiKey,
        apiSecret: credentialsData.apiSecret,
      });

      setTestResult(result);
      setCurrentStep('result');
    } catch (error) {
      setTestResult({
        success: false,
        message: '接続テストに失敗しました。しばらくしてから再度お試しください。',
      });
      setCurrentStep('result');
    } finally {
      setLoading(false);
    }
  };

  // 銀行を登録
  const handleRegisterBank = async () => {
    if (!selectedBank || !credentials) return;

    setLoading(true);
    try {
      await createInstitution({
        name: selectedBank.name,
        type: InstitutionType.BANK,
        credentials: {
          bankCode: credentials.bankCode,
          branchCode: credentials.branchCode,
          accountNumber: credentials.accountNumber,
          apiKey: credentials.apiKey,
          apiSecret: credentials.apiSecret,
        },
      });

      // 成功したらダッシュボードに遷移
      router.push('/dashboard');
    } catch (error) {
      alert('銀行の登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 再試行（認証情報入力に戻る）
  const handleRetry = () => {
    setCurrentStep('credentials');
    setTestResult(null);
  };

  // 銀行選択に戻る
  const handleBackToSelect = () => {
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
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
          <p className="mt-2 text-gray-600">
            銀行口座を連携して、自動で取引履歴を取得します
          </p>
        </div>

        {/* ステップインジケーター */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div
                className={`w-full h-2 rounded ${
                  currentStep === 'select'
                    ? 'bg-blue-600'
                    : 'bg-blue-200'
                }`}
              ></div>
              <div className="mt-2 text-sm font-medium text-gray-900">
                1. 銀行選択
              </div>
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
              <div className="mt-2 text-sm font-medium text-gray-900">
                2. 認証情報入力
              </div>
            </div>
            <div className="w-8"></div>
            <div className="flex-1">
              <div
                className={`w-full h-2 rounded ${
                  currentStep === 'result' ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              ></div>
              <div className="mt-2 text-sm font-medium text-gray-900">
                3. 接続テスト
              </div>
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
            <ConnectionTestResult
              result={testResult}
              onRetry={handleRetry}
              onContinue={testResult.success ? handleRegisterBank : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}

