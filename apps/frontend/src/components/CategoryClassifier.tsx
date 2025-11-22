'use client';

import { useState } from 'react';
import { classifyTransaction } from '@/lib/api/classification';
import { CategoryType } from '@account-book/types';

/**
 * FR-008: カテゴリ自動分類コンポーネント
 *
 * 取引データを入力すると、自動的にカテゴリを分類して表示する
 */

interface ClassificationResult {
  category: {
    id: string;
    name: string;
    type: CategoryType;
  };
  confidence: number;
  reason: string;
}

export default function CategoryClassifier() {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleClassify = async () => {
    if (!amount || !description) {
      setError('金額と説明を入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const result = await classifyTransaction({
        amount: parseFloat(amount),
        description,
      });
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分類に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryTypeLabel = (type: CategoryType): string => {
    const labels: Record<CategoryType, string> = {
      [CategoryType.INCOME]: '収入',
      [CategoryType.EXPENSE]: '支出',
      [CategoryType.TRANSFER]: '振替',
      [CategoryType.REPAYMENT]: '返済',
      [CategoryType.INVESTMENT]: '投資',
    };
    return labels[type] || type;
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.9) return '高';
    if (confidence >= 0.7) return '中';
    return '低';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">カテゴリ自動分類（FR-008）</h2>

      <div className="space-y-4">
        {/* 金額入力 */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            金額
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="例: -1500"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">※ 正の値は入金、負の値は出金を表します</p>
        </div>

        {/* 説明入力 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            説明
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例: スターバックス コーヒー"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 分類ボタン */}
        <button
          onClick={handleClassify}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? '分類中...' : 'カテゴリを自動分類'}
        </button>

        {/* エラーメッセージ */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 分類結果 */}
        {result && (
          <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-lg font-semibold mb-4">分類結果</h3>

            <div className="space-y-3">
              {/* カテゴリタイプ */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">カテゴリ:</span>
                <span className="font-semibold text-lg">
                  {getCategoryTypeLabel(result.category.type)}
                </span>
              </div>

              {/* カテゴリ名 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">詳細:</span>
                <span className="font-medium">{result.category.name}</span>
              </div>

              {/* 信頼度 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">信頼度:</span>
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold ${getConfidenceColor(result.confidence)}`}>
                    {getConfidenceLabel(result.confidence)}
                  </span>
                  <span className="text-gray-500">({(result.confidence * 100).toFixed(0)}%)</span>
                </div>
              </div>

              {/* 理由 */}
              <div className="pt-3 border-t border-gray-300">
                <span className="text-gray-600 text-sm">分類理由:</span>
                <p className="mt-1 text-gray-800">{result.reason}</p>
              </div>
            </div>

            {/* 信頼度による注意事項 */}
            {result.confidence < 0.9 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  {result.confidence < 0.7
                    ? '⚠️ 信頼度が低いため、手動で確認・修正することをおすすめします。'
                    : 'ℹ️ 必要に応じて手動で修正してください。'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 使用例 */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-semibold text-blue-900 mb-2">使用例</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 金額: -1500, 説明: &quot;スターバックス&quot; → 支出</li>
          <li>• 金額: 300000, 説明: &quot;給与振込&quot; → 収入</li>
          <li>• 金額: -50000, 説明: &quot;カード引落&quot; → 振替</li>
          <li>• 金額: -100000, 説明: &quot;住宅ローン&quot; → 返済</li>
          <li>• 金額: -50000, 説明: &quot;株式購入&quot; → 投資</li>
        </ul>
      </div>
    </div>
  );
}
