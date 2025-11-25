'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, CategoryType } from '@account-book/types';
import { getTransactions } from '@/lib/api/transactions';
import { updateTransactionSubcategory } from '@/lib/api/transactions';
import { subcategoryApi } from '@/lib/api/subcategories';
import { SubcategorySelector } from './SubcategorySelector';
import { ClassificationBadge } from './ClassificationBadge';
import { TransactionDetailModal } from './TransactionDetailModal';
import { formatCurrency } from '@account-book/utils';
import { useSubcategoryStore } from '@/stores/subcategory.store';

/**
 * 取引分類ページコンポーネント
 * FR-009: 詳細費目分類機能
 */
export function TransactionClassificationPage(): React.JSX.Element {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [detailModalTransaction, setDetailModalTransaction] = useState<Transaction | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [filterCategoryType, setFilterCategoryType] = useState<CategoryType | 'ALL'>('ALL');
  const [filterConfidence, setFilterConfidence] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>(
    'ALL'
  );
  const [showUnclassifiedOnly, setShowUnclassifiedOnly] = useState(false);
  const [showUnconfirmedOnly, setShowUnconfirmedOnly] = useState(false);

  const { getSubcategoryById } = useSubcategoryStore();

  // 取引一覧を取得
  useEffect(() => {
    const fetchTransactions = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTransactions();
        setTransactions(data);
      } catch (err) {
        setError('取引データの取得に失敗しました。ページを再読み込みしてください。');
        console.error('取引データの取得に失敗しました:', err);
      } finally {
        setLoading(false);
      }
    };
    void fetchTransactions();
  }, []);

  // フィルタリングされた取引一覧
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // カテゴリタイプでフィルタ
      if (filterCategoryType !== 'ALL' && tx.category.type !== filterCategoryType) {
        return false;
      }

      // 未分類のみ表示
      if (showUnclassifiedOnly && tx.subcategoryId) {
        return false;
      }

      // 未確認のみ表示
      if (showUnconfirmedOnly && tx.confirmedAt) {
        return false;
      }

      // 信頼度でフィルタ
      if (
        filterConfidence !== 'ALL' &&
        tx.classificationConfidence !== undefined &&
        tx.classificationConfidence !== null
      ) {
        const confidence = tx.classificationConfidence;
        if (filterConfidence === 'HIGH' && confidence < 0.9) return false;
        if (filterConfidence === 'MEDIUM' && (confidence < 0.7 || confidence >= 0.9)) return false;
        if (filterConfidence === 'LOW' && confidence >= 0.7) return false;
      }

      return true;
    });
  }, [
    transactions,
    filterCategoryType,
    filterConfidence,
    showUnclassifiedOnly,
    showUnconfirmedOnly,
  ]);

  // サブカテゴリ変更
  const handleSubcategoryChange = async (
    transactionId: string,
    subcategoryId: string
  ): Promise<void> => {
    setUpdatingIds((prev) => new Set(prev).add(transactionId));
    try {
      const updated = await updateTransactionSubcategory(transactionId, subcategoryId);
      setTransactions((prev) => prev.map((tx) => (tx.id === transactionId ? updated : tx)));
      setSelectedTransactionId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'サブカテゴリの更新に失敗しました');
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(transactionId);
        return next;
      });
    }
  };

  // 一括自動分類
  const handleBatchClassify = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // 未分類の取引を取得
      const unclassified = filteredTransactions.filter((tx) => !tx.subcategoryId);

      if (unclassified.length === 0) {
        setError('分類対象の取引がありません');
        return;
      }

      // バッチ分類リクエストを作成
      const requests = unclassified.map((tx) => ({
        transactionId: tx.id,
        description: tx.description,
        amount: tx.amount,
        mainCategory: tx.category.type,
        transactionDate: tx.date.toISOString(),
      }));

      const result = await subcategoryApi.batchClassify({ transactions: requests });

      // 分類結果を反映
      const updatedTransactions = [...transactions];
      for (const classificationResult of result.results) {
        if (classificationResult.success && classificationResult.subcategoryId) {
          const txIndex = updatedTransactions.findIndex(
            (tx) => tx.id === classificationResult.transactionId
          );
          if (txIndex !== -1) {
            updatedTransactions[txIndex] = {
              ...updatedTransactions[txIndex],
              subcategoryId: classificationResult.subcategoryId,
              classificationConfidence: classificationResult.confidence ?? null,
              classificationReason: classificationResult.reason ?? null,
            };
          }
        }
      }
      setTransactions(updatedTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : '一括分類に失敗しました');
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

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">取引分類（サブカテゴリ）</h1>
          <p className="text-gray-600">未分類・低信頼度の取引を確認し、サブカテゴリを設定します</p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* フィルター・アクション */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* カテゴリタイプフィルター */}
            <div>
              <label
                htmlFor="filter-category-type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                カテゴリ
              </label>
              <select
                id="filter-category-type"
                value={filterCategoryType}
                onChange={(e) => setFilterCategoryType(e.target.value as CategoryType | 'ALL')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">すべて</option>
                <option value={CategoryType.INCOME}>収入</option>
                <option value={CategoryType.EXPENSE}>支出</option>
                <option value={CategoryType.TRANSFER}>振替</option>
                <option value={CategoryType.REPAYMENT}>返済</option>
                <option value={CategoryType.INVESTMENT}>投資</option>
              </select>
            </div>

            {/* 信頼度フィルター */}
            <div>
              <label
                htmlFor="filter-confidence"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                信頼度
              </label>
              <select
                id="filter-confidence"
                value={filterConfidence}
                onChange={(e) =>
                  setFilterConfidence(e.target.value as 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">すべて</option>
                <option value="HIGH">高（90%以上）</option>
                <option value="MEDIUM">中（70-89%）</option>
                <option value="LOW">低（70%未満）</option>
              </select>
            </div>

            {/* 未分類のみ */}
            <div className="flex items-center pt-6">
              <label htmlFor="unclassified-only" className="flex items-center cursor-pointer">
                <input
                  id="unclassified-only"
                  type="checkbox"
                  checked={showUnclassifiedOnly}
                  onChange={(e) => setShowUnclassifiedOnly(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">未分類のみ</span>
              </label>
            </div>

            {/* 未確認のみ */}
            <div className="flex items-center pt-6">
              <label htmlFor="unconfirmed-only" className="flex items-center cursor-pointer">
                <input
                  id="unconfirmed-only"
                  type="checkbox"
                  checked={showUnconfirmedOnly}
                  onChange={(e) => setShowUnconfirmedOnly(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">未確認のみ</span>
              </label>
            </div>
          </div>

          {/* 一括自動分類ボタン */}
          <div className="flex justify-end">
            <button
              onClick={handleBatchClassify}
              disabled={loading}
              className={`px-4 py-2 rounded-md font-medium text-white transition-colors ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? '分類中...' : '🤖 一括自動分類'}
            </button>
          </div>
        </div>

        {/* 取引一覧 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日付
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    説明
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    サブカテゴリ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    信頼度
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      該当する取引がありません
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const subcategory = tx.subcategoryId
                      ? getSubcategoryById(tx.subcategoryId)
                      : null;
                    const isUpdating = updatingIds.has(tx.id);
                    const isSelected = selectedTransactionId === tx.id;

                    return (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{tx.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {getCategoryTypeLabel(tx.category.type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {subcategory ? (
                            <span className="inline-flex items-center gap-1">
                              {subcategory.icon && <span>{subcategory.icon}</span>}
                              <span>{subcategory.name}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">未分類</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {tx.classificationConfidence !== undefined &&
                          tx.classificationConfidence !== null &&
                          tx.classificationReason ? (
                            <ClassificationBadge
                              confidence={tx.classificationConfidence}
                              reason={tx.classificationReason}
                            />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <div className="flex gap-2 justify-center">
                            {isSelected ? (
                              <div className="flex flex-col gap-2">
                                <SubcategorySelector
                                  categoryType={tx.category.type}
                                  selectedSubcategoryId={tx.subcategoryId ?? undefined}
                                  onSelect={(subcategoryId) => {
                                    void handleSubcategoryChange(tx.id, subcategoryId);
                                  }}
                                  disabled={isUpdating}
                                />
                                <button
                                  onClick={() => setSelectedTransactionId(null)}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  キャンセル
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => setSelectedTransactionId(tx.id)}
                                  disabled={isUpdating}
                                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                    isUpdating
                                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }`}
                                >
                                  {isUpdating ? '更新中...' : '変更'}
                                </button>
                                <button
                                  onClick={() => setDetailModalTransaction(tx)}
                                  className="px-3 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                  詳細
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">総取引数</p>
            <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">表示中</p>
            <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">未分類</p>
            <p className="text-2xl font-bold text-orange-600">
              {transactions.filter((tx) => !tx.subcategoryId).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600">低信頼度</p>
            <p className="text-2xl font-bold text-yellow-600">
              {
                transactions.filter(
                  (tx) =>
                    tx.classificationConfidence !== undefined &&
                    tx.classificationConfidence !== null &&
                    tx.classificationConfidence < 0.7
                ).length
              }
            </p>
          </div>
        </div>

        {/* 取引詳細モーダル */}
        <TransactionDetailModal
          isOpen={detailModalTransaction !== null}
          transaction={detailModalTransaction}
          onClose={() => setDetailModalTransaction(null)}
          onUpdate={(updated) => {
            setTransactions((prev) => prev.map((tx) => (tx.id === updated.id ? updated : tx)));
            setDetailModalTransaction(updated);
          }}
        />
      </div>
    </div>
  );
}
