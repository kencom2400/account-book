'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Bank, BankConnectionTestResult, InstitutionType, Institution } from '@account-book/types';
import { BankSelector } from '@/components/forms/BankSelector';
import { BankCredentialsForm, BankCredentialsData } from '@/components/forms/BankCredentialsForm';
import { ConnectionTestResult } from '@/components/forms/ConnectionTestResult';
import { testBankConnection, updateInstitution, getInstitution } from '@/lib/api/institutions';

type Step = 'select' | 'credentials' | 'result';

/**
 * 金融機関編集ページ
 * Issue #350: 金融機関編集機能の実装
 */
export default function EditBankPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [testResult, setTestResult] = useState<BankConnectionTestResult | null>(null);
  const [credentials, setCredentials] = useState<BankCredentialsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loadingInstitution, setLoadingInstitution] = useState(true);

  // 既存の金融機関情報を取得
  useEffect(() => {
    const fetchInstitution = async (): Promise<void> => {
      try {
        setLoadingInstitution(true);
        const data = await getInstitution(id);
        setInstitution(data);

        // 既存の金融機関情報から銀行情報を設定
        // 注: 認証情報は暗号化されているため、再入力が必要
        if (data.type === InstitutionType.BANK) {
          // 銀行コードなどは認証情報から取得できないため、選択ステップから開始
          setCurrentStep('select');
        }
      } catch (error) {
        console.error('金融機関の取得に失敗しました:', error);
        setSaveError('金融機関の取得に失敗しました。');
      } finally {
        setLoadingInstitution(false);
      }
    };

    if (id) {
      void fetchInstitution();
    }
  }, [id]);

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
        branchCode: credentialsData.branchCode,
        accountNumber: credentialsData.accountNumber,
        apiKey: credentialsData.apiKey,
        apiSecret: credentialsData.apiSecret,
      });

      setTestResult(result);
      setCurrentStep('result');
    } catch (_error) {
      setTestResult({
        success: false,
        message: '接続テストに失敗しました。しばらくしてから再度お試しください。',
      });
      setCurrentStep('result');
    } finally {
      setLoading(false);
    }
  };

  // 金融機関を更新
  const handleUpdateBank = async (): Promise<void> => {
    if (!selectedBank || !credentials) return;

    setLoading(true);
    setSaveError(null);

    try {
      await updateInstitution(id, {
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

      // 成功したら金融機関一覧に遷移
      router.push('/banks');
    } catch (_error) {
      setSaveError('金融機関の更新に失敗しました。もう一度お試しください。');
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

  if (loadingInstitution) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">金融機関が見つかりませんでした。</p>
            <button
              onClick={() => router.push('/banks')}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              金融機関一覧に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">金融機関を編集</h1>
          <p className="mt-2 text-gray-600">金融機関情報を更新します</p>
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
                onContinue={testResult.success ? handleUpdateBank : undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
