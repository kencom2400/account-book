'use client';

import { useState, useEffect } from 'react';
import { Category } from '@account-book/types';
import { getCategoryById, updateCategory } from '@/lib/api/categories';
import { CategoryForm } from './CategoryForm';
import { Skeleton } from '@/components/ui/Skeleton';

interface CategoryEditModalProps {
  categoryId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * 費目編集モーダルコンポーネント
 * Issue #110: E-4: 費目編集画面の実装
 */
export function CategoryEditModal({
  categoryId,
  isOpen,
  onClose,
  onSuccess,
}: CategoryEditModalProps): React.JSX.Element | null {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モーダルが開かれたときに費目情報を取得
  useEffect(() => {
    if (isOpen && categoryId) {
      const loadCategory = async (): Promise<void> => {
        try {
          setLoading(true);
          setError(null);
          const data = await getCategoryById(categoryId);
          setCategory(data);
        } catch (err) {
          console.error('費目取得エラー:', err);
          setError(err instanceof Error ? err.message : '費目の取得に失敗しました');
        } finally {
          setLoading(false);
        }
      };
      void loadCategory();
    } else {
      setCategory(null);
      setError(null);
    }
  }, [isOpen, categoryId]);

  // モーダルを閉じる
  const handleClose = (): void => {
    setCategory(null);
    setError(null);
    onClose();
  };

  // フォーム送信
  const handleSubmit = async ({
    type: _type,
    ...updateData
  }: {
    name: string;
    type: string;
    icon?: string | null;
    color?: string | null;
  }): Promise<void> => {
    if (!categoryId) return;

    try {
      setError(null);
      // typeは更新時に使用しないため、分割代入で除外
      await updateCategory(categoryId, updateData);
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('費目更新エラー:', err);
      setError(err instanceof Error ? err.message : '費目の更新に失敗しました');
    }
  };

  if (!isOpen) {
    return null;
  }

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
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="bg-white px-4 py-3 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                費目を編集
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="モーダルを閉じる"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {loading ? (
              <div className="space-y-4">
                {/* タイトルスケルトン */}
                <Skeleton variant="text" width="w-24" height="h-6" />
                {/* 費目名フィールドスケルトン */}
                <div className="space-y-2">
                  <Skeleton variant="text" width="w-20" height="h-4" />
                  <Skeleton variant="text" width="w-full" height="h-10" />
                </div>
                {/* タイプフィールドスケルトン */}
                <div className="space-y-2">
                  <Skeleton variant="text" width="w-16" height="h-4" />
                  <Skeleton variant="text" width="w-full" height="h-10" />
                </div>
                {/* アイコンフィールドスケルトン */}
                <div className="space-y-2">
                  <Skeleton variant="text" width="w-24" height="h-4" />
                  <Skeleton variant="text" width="w-full" height="h-10" />
                </div>
                {/* カラーフィールドスケルトン */}
                <div className="space-y-2">
                  <Skeleton variant="text" width="w-16" height="h-4" />
                  <div className="flex gap-2">
                    <Skeleton variant="rectangular" width={48} height={40} />
                    <div className="flex-1">
                      <Skeleton variant="text" width="w-full" height="h-10" />
                    </div>
                  </div>
                </div>
                {/* ボタンスケルトン */}
                <div className="flex gap-2 pt-4">
                  <div className="flex-1">
                    <Skeleton variant="rectangular" width="w-full" height={40} />
                  </div>
                  <div className="flex-1">
                    <Skeleton variant="rectangular" width="w-full" height={40} />
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  閉じる
                </button>
              </div>
            ) : category ? (
              <>
                <CategoryForm category={category} onSubmit={handleSubmit} onCancel={handleClose} />
                {error && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                    {error}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
