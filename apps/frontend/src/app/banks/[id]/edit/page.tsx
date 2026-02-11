'use client';

import { useReducer, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Bank, BankConnectionTestResult, InstitutionType, Institution } from '@account-book/types';
import { BankSelector } from '@/components/forms/BankSelector';
import { BankCredentialsForm, BankCredentialsData } from '@/components/forms/BankCredentialsForm';
import { ConnectionTestResult } from '@/components/forms/ConnectionTestResult';
import { testBankConnection, updateInstitution, getInstitution } from '@/lib/api/institutions';
import { PageLoading } from '@/components/ui';

type Step = 'select' | 'credentials' | 'result';

interface State {
  currentStep: Step;
  selectedBank: Bank | null;
  testResult: BankConnectionTestResult | null;
  credentials: BankCredentialsData | null;
  loading: boolean;
  saveError: string | null;
  institution: Institution | null;
  loadingInstitution: boolean;
}

type Action =
  | { type: 'SET_INSTITUTION'; payload: Institution }
  | { type: 'SET_LOADING_INSTITUTION'; payload: boolean }
  | { type: 'SET_STEP'; payload: Step }
  | { type: 'SELECT_BANK'; payload: Bank }
  | { type: 'SET_TEST_RESULT'; payload: BankConnectionTestResult }
  | { type: 'SET_CREDENTIALS'; payload: BankCredentialsData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVE_ERROR'; payload: string | null }
  | { type: 'RESET_TO_SELECT' }
  | { type: 'RESET_TO_CREDENTIALS' };

const initialState: State = {
  currentStep: 'select',
  selectedBank: null,
  testResult: null,
  credentials: null,
  loading: false,
  saveError: null,
  institution: null,
  loadingInstitution: true,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_INSTITUTION':
      return { ...state, institution: action.payload };
    case 'SET_LOADING_INSTITUTION':
      return { ...state, loadingInstitution: action.payload };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SELECT_BANK':
      return {
        ...state,
        selectedBank: action.payload,
        currentStep: 'credentials',
      };
    case 'SET_TEST_RESULT':
      return {
        ...state,
        testResult: action.payload,
        currentStep: 'result',
      };
    case 'SET_CREDENTIALS':
      return { ...state, credentials: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SAVE_ERROR':
      return { ...state, saveError: action.payload };
    case 'RESET_TO_SELECT':
      return {
        ...state,
        currentStep: 'select',
        selectedBank: null,
        testResult: null,
        credentials: null,
      };
    case 'RESET_TO_CREDENTIALS':
      return {
        ...state,
        currentStep: 'credentials',
        testResult: null,
      };
    default:
      return state;
  }
}

/**
 * 金融機関編集ページ
 * Issue #350: 金融機関編集機能の実装
 */
export default function EditBankPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [state, dispatch] = useReducer(reducer, initialState);

  // 既存の金融機関情報を取得
  useEffect(() => {
    const fetchInstitution = async (): Promise<void> => {
      try {
        dispatch({ type: 'SET_LOADING_INSTITUTION', payload: true });
        const data = await getInstitution(id);
        dispatch({ type: 'SET_INSTITUTION', payload: data });

        // 既存の金融機関情報から銀行情報を設定
        // 注: 認証情報は暗号化されているため、再入力が必要
        // currentStepは既に'select'で初期化されているため、設定不要
      } catch (error) {
        console.error('金融機関の取得に失敗しました:', error);
        dispatch({ type: 'SET_SAVE_ERROR', payload: '金融機関の取得に失敗しました。' });
      } finally {
        dispatch({ type: 'SET_LOADING_INSTITUTION', payload: false });
      }
    };

    if (id) {
      void fetchInstitution();
    }
  }, [id]);

  // 銀行選択
  const handleSelectBank = (bank: Bank): void => {
    dispatch({ type: 'SELECT_BANK', payload: bank });
  };

  // 接続テスト実行
  const handleTestConnection = async (credentialsData: BankCredentialsData): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_CREDENTIALS', payload: credentialsData });

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

      dispatch({ type: 'SET_TEST_RESULT', payload: result });
    } catch (_error) {
      dispatch({
        type: 'SET_TEST_RESULT',
        payload: {
          success: false,
          message: '接続テストに失敗しました。しばらくしてから再度お試しください。',
        },
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 金融機関を更新
  const handleUpdateBank = async (): Promise<void> => {
    if (!state.selectedBank || !state.credentials) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_SAVE_ERROR', payload: null });

    try {
      await updateInstitution(id, {
        name: state.selectedBank.name,
        type: InstitutionType.BANK,
        credentials: {
          bankCode: state.credentials.bankCode,
          authenticationType: state.credentials.authenticationType,
          branchCode: state.credentials.branchCode,
          accountNumber: state.credentials.accountNumber,
          apiKey: state.credentials.apiKey,
          apiSecret: state.credentials.apiSecret,
          userId: state.credentials.userId,
          password: state.credentials.password,
        },
      });

      // 成功したら金融機関一覧に遷移
      router.push('/banks');
    } catch (_error) {
      dispatch({
        type: 'SET_SAVE_ERROR',
        payload: '金融機関の更新に失敗しました。もう一度お試しください。',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 再試行（認証情報入力に戻る）
  const handleRetry = (): void => {
    dispatch({ type: 'RESET_TO_CREDENTIALS' });
  };

  // 銀行選択に戻る
  const handleBackToSelect = (): void => {
    dispatch({ type: 'RESET_TO_SELECT' });
  };

  if (state.loadingInstitution) {
    return <PageLoading />;
  }

  if (!state.institution) {
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
                  state.currentStep === 'select' ? 'bg-blue-600' : 'bg-blue-200'
                }`}
              ></div>
              <div className="mt-2 text-sm font-medium text-gray-900">1. 銀行選択</div>
            </div>
            <div className="w-8"></div>
            <div className="flex-1">
              <div
                className={`w-full h-2 rounded ${
                  state.currentStep === 'credentials' || state.currentStep === 'result'
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
                  state.currentStep === 'result' ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              ></div>
              <div className="mt-2 text-sm font-medium text-gray-900">3. 接続テスト</div>
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="bg-white rounded-lg shadow p-6">
          {state.currentStep === 'select' && (
            <BankSelector
              onSelectBank={handleSelectBank}
              selectedBank={state.selectedBank || undefined}
            />
          )}

          {state.currentStep === 'credentials' && state.selectedBank && (
            <div>
              <button
                onClick={handleBackToSelect}
                className="text-blue-600 hover:text-blue-800 mb-4"
              >
                ← 銀行を変更
              </button>
              <BankCredentialsForm
                bank={state.selectedBank}
                onSubmit={handleTestConnection}
                loading={state.loading}
              />
            </div>
          )}

          {state.currentStep === 'result' && state.testResult && (
            <div>
              {state.saveError && (
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
                      <p className="text-sm text-red-800">{state.saveError}</p>
                    </div>
                  </div>
                </div>
              )}
              <ConnectionTestResult
                result={state.testResult}
                onRetry={handleRetry}
                onContinue={state.testResult.success ? handleUpdateBank : undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
