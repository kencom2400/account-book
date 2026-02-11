'use client';

import { BankConnectionTestResult, CreditCardConnectionTestResult } from '@account-book/types';

type ConnectionTestResult = BankConnectionTestResult | CreditCardConnectionTestResult;

interface ConnectionTestResultProps {
  result: ConnectionTestResult;
  onRetry?: () => void;
  onContinue?: () => void;
}

/**
 * 接続テスト結果表示コンポーネント
 */
export function ConnectionTestResult({
  result,
  onRetry,
  onContinue,
}: ConnectionTestResultProps): React.JSX.Element {
  // デバッグ情報を表示（開発環境のみ）
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (result.success) {
    return (
      <div className="space-y-4">
        {/* デバッグ情報（開発環境のみ） */}
        {isDevelopment && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-xs font-mono">
            <div className="font-bold mb-2">🔍 デバッグ情報:</div>
            <pre className="whitespace-pre-wrap break-words">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        {/* 成功メッセージ */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800">接続に成功しました</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>{result.message}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 口座情報（銀行の場合） */}
        {'accountInfo' in result && result.accountInfo && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">取得した口座情報</h4>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm text-gray-500">銀行名</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {result.accountInfo.bankName}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">支店名</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {result.accountInfo.branchName}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">口座番号</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {result.accountInfo.accountNumber}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">口座名義</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {result.accountInfo.accountHolder}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">残高</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  ¥{result.accountInfo.balance.toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* カード情報（クレジットカードの場合） */}
        {'cardInfo' in result && result.cardInfo && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">取得したカード情報</h4>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm text-gray-500">カード名</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {result.cardInfo.cardName}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">カード番号（下4桁）</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  **** **** **** {result.cardInfo.cardNumber}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">カード名義</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {result.cardInfo.cardHolderName}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">有効期限</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">
                  {result.cardInfo.expiryDate.substring(0, 7).replace('-', '/')}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">発行会社</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{result.cardInfo.issuer}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* アクションボタン */}
        {onContinue && (
          <button
            onClick={onContinue}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {'accountInfo' in result ? 'この銀行を登録する' : 'このクレジットカードを登録する'}
          </button>
        )}
      </div>
    );
  }

  // 失敗時
  return (
    <div className="space-y-4">
      {/* デバッグ情報（開発環境のみ） */}
      {isDevelopment && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-xs font-mono">
          <div className="font-bold mb-2">🔍 デバッグ情報:</div>
          <pre className="whitespace-pre-wrap break-words">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {/* エラーメッセージ */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800">接続に失敗しました</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{result.message}</p>
              {result.errorCode && <p className="mt-2 text-xs">エラーコード: {result.errorCode}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* エラーコード別の対処法 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">対処方法</h4>
        <div className="text-sm text-blue-700">
          {result.errorCode === 'BE001' && (
            <ul className="list-disc list-inside space-y-1">
              <li>銀行コード、支店コード、口座番号を確認してください</li>
              <li>APIキー・シークレットが正しいか確認してください</li>
              <li>通帳やキャッシュカードを確認してください</li>
            </ul>
          )}
          {result.errorCode === 'BE002' && (
            <ul className="list-disc list-inside space-y-1">
              <li>インターネット接続を確認してください</li>
              <li>しばらく待ってから再度お試しください</li>
            </ul>
          )}
          {result.errorCode === 'BE003' && (
            <ul className="list-disc list-inside space-y-1">
              <li>銀行のメンテナンス情報を確認してください</li>
              <li>しばらく時間をおいてから再度お試しください</li>
            </ul>
          )}
          {result.errorCode === 'BE004' && (
            <ul className="list-disc list-inside space-y-1">
              <li>対応銀行一覧をご確認ください</li>
            </ul>
          )}
          {result.errorCode === 'BE005' && (
            <ul className="list-disc list-inside space-y-1">
              <li>時間をおいてから再度お試しください</li>
            </ul>
          )}
          {result.errorCode === 'CC001' && (
            <ul className="list-disc list-inside space-y-1">
              <li>カード番号、カード名義、有効期限を確認してください</li>
              <li>ログインID・パスワードが正しいか確認してください</li>
              <li>Web明細サービスの登録状況を確認してください</li>
            </ul>
          )}
          {result.errorCode === 'CC002' && (
            <ul className="list-disc list-inside space-y-1">
              <li>インターネット接続を確認してください</li>
              <li>しばらく待ってから再度お試しください</li>
            </ul>
          )}
          {!result.errorCode && <p>しばらく待ってから再度お試しください</p>}
        </div>
      </div>

      {/* 再試行ボタン */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="w-full bg-gray-600 text-white py-3 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          再試行
        </button>
      )}
    </div>
  );
}
