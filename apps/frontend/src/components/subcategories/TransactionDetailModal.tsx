'use client';

import React, { useState, useEffect } from 'react';
import { Transaction, CategoryType } from '@account-book/types';
import { updateTransactionSubcategory } from '@/lib/api/transactions';
import { SubcategorySelector } from './SubcategorySelector';
import { ClassificationBadge } from './ClassificationBadge';
import { useSubcategoryStore } from '@/stores/subcategory.store';
import { formatCurrency } from '@account-book/utils';

/**
 * 取引詳細モーダルのProps
 */
interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onUpdate?: (transaction: Transaction) => void;
}

/**
 * 取引詳細モーダルコンポーネント
 * FR-009: 詳細費目分類機能
 */
export function TransactionDetailModal({
  isOpen,
  transaction,
  onClose,
  onUpdate,
}: TransactionDetailModalProps): React.JSX.Element | null {
  const [isEditingSubcategory, setIsEditingSubcategory] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getSubcategoryById, fetchSubcategories } = useSubcategoryStore();

  // サブカテゴリ一覧を取得
  useEffect(() => {
    if (isOpen && transaction) {
      void fetchSubcategories(transaction.category.type);
    }
  }, [isOpen, transaction, fetchSubcategories]);

  if (!isOpen || !transaction) {
    return null;
  }

  const subcategory = transaction.subcategoryId
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
    setIsUpdating(true);
    setError(null);
    try {
      const updated = await updateTransactionSubcategory(transaction.id, subcategoryId);
      setIsEditingSubcategory(false);
      if (onUpdate) {
        onUpdate(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'サブカテゴリの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = (): void => {
    setIsEditingSubcategory(false);
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                取引詳細
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="閉じる"
              >
                <span className="sr-only">閉じる</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Transaction Details */}
            <div className="space-y-4">
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
                      />
                      <p className="text-xs text-gray-500">
                        分類理由: {transaction.classificationReason}
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
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
