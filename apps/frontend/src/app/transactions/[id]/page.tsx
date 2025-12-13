'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Transaction, CategoryType } from '@account-book/types';
import { getTransactionById, updateTransactionSubcategory } from '@/lib/api/transactions';
import { SubcategorySelector } from '@/components/subcategories/SubcategorySelector';
import { ClassificationBadge } from '@/components/subcategories/ClassificationBadge';
import { useSubcategoryStore } from '@/stores/subcategory.store';
import { formatCurrency } from '@account-book/utils';
import { getClassificationReasonText } from '@/utils/classification.utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Link from 'next/link';

/**
 * 取引詳細ページ
 * Issue #109: [TASK] E-3: 取引詳細画面の実装
 * FR-009: 詳細費目分類機能
 */
export default function TransactionDetailPage(): React.JSX.Element {
  const params = useParams();
  const transactionId = params.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingSubcategory, setIsEditingSubcategory] = useState(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const { getSubcategoryById, fetchSubcategories, error: subcategoryError } = useSubcategoryStore();

  // 取引データを取得
  const fetchTransaction = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransactionById(transactionId);
      setTransaction(data);
      // サブカテゴリ一覧を取得
      if (data) {
        await fetchSubcategories(data.category.type);
      }
    } catch (err) {
      console.error('取引データの取得に失敗しました:', err);
      setError(err instanceof Error ? err.message : '取引データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [transactionId, fetchSubcategories]);

  useEffect(() => {
    if (transactionId) {
      void fetchTransaction();
    }
  }, [transactionId, fetchTransaction]);

  const subcategory = transaction?.subcategoryId
    ? getSubcategoryById(transaction.subcategoryId)
    : null;

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
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSubcategoryChange = async (subcategoryId: string): Promise<void> => {
    if (!transaction) return;

    setIsUpdating(true);
    setError(null);
    try {
      const updated = await updateTransactionSubcategory(transaction.id, subcategoryId);
      setTransaction(updated);
      setIsEditingSubcategory(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'サブカテゴリの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent>
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">読み込み中...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/transactions"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    取引一覧に戻る
                  </Link>
                  <button
                    onClick={() => void fetchTransaction()}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    再読み込み
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">取引が見つかりませんでした</p>
                <Link
                  href="/transactions"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  取引一覧に戻る
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link
            href="/transactions"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            取引一覧に戻る
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">取引詳細</h1>
        </div>

        {/* エラー表示 */}
        {(error || subcategoryError) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {subcategoryError && (
              <p className="text-sm text-red-600">
                サブカテゴリの読み込みに失敗しました: {subcategoryError}
              </p>
            )}
          </div>
        )}

        {/* 取引詳細カード */}
        <Card>
          <CardHeader>
            <CardTitle>取引情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 日付・時刻 */}
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">日付</div>
                <p className="text-sm text-gray-900">
                  {formatDate(transaction.date)} ({formatTime(transaction.date)})
                </p>
              </div>

              {/* 説明 */}
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">説明</div>
                <p className="text-sm text-gray-900">{transaction.description}</p>
              </div>

              {/* 金額 */}
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">金額</div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(transaction.amount)}
                </p>
              </div>

              {/* カテゴリ */}
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</div>
                <p className="text-sm text-gray-900">
                  {getCategoryTypeLabel(transaction.category.type)} - {transaction.category.name}
                </p>
              </div>

              {/* サブカテゴリ */}
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-2">
                  サブカテゴリ（詳細費目）
                </div>
                {isEditingSubcategory ? (
                  <div className="space-y-2">
                    <SubcategorySelector
                      categoryType={transaction.category.type}
                      selectedSubcategoryId={transaction.subcategoryId ?? undefined}
                      onSelect={(subcategoryId) => {
                        void handleSubcategoryChange(subcategoryId);
                      }}
                      disabled={isUpdating}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingSubcategory(false)}
                        disabled={isUpdating}
                        className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {subcategory ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-md">
                        {subcategory.icon && <span>{subcategory.icon}</span>}
                        <span>{subcategory.name}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">未分類</span>
                    )}
                    <button
                      onClick={() => setIsEditingSubcategory(true)}
                      className="px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                    >
                      変更
                    </button>
                  </div>
                )}
              </div>

              {/* 分類信頼度 */}
              {transaction.classificationConfidence !== undefined &&
                transaction.classificationConfidence !== null &&
                transaction.classificationReason && (
                  <div>
                    <div className="block text-sm font-medium text-gray-700 mb-2">分類信頼度</div>
                    <div className="space-y-2">
                      <ClassificationBadge
                        confidence={transaction.classificationConfidence}
                        reason={transaction.classificationReason}
                        merchantName={transaction.merchantName ?? undefined}
                      />
                      <p className="text-xs text-gray-500">
                        分類理由:{' '}
                        {getClassificationReasonText(
                          transaction.classificationReason,
                          transaction.merchantName
                        )}
                      </p>
                    </div>
                  </div>
                )}

              {/* 店舗情報（該当する場合） */}
              {transaction.merchantId && (
                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-1">店舗</div>
                  <p className="text-sm text-gray-900">店舗ID: {transaction.merchantId}</p>
                </div>
              )}

              {/* 確認日時 */}
              {transaction.confirmedAt && (
                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-1">確認日時</div>
                  <p className="text-sm text-gray-900">
                    {new Date(transaction.confirmedAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              )}

              {/* 取引元情報 */}
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">取引元</div>
                <p className="text-sm text-gray-600">金融機関ID: {transaction.institutionId}</p>
                <p className="text-sm text-gray-600">口座ID: {transaction.accountId}</p>
              </div>

              {/* 照合ステータス */}
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">照合ステータス</div>
                {transaction.isReconciled ? (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    照合済
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    未照合
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
