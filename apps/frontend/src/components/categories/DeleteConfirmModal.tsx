'use client';

import { useState, useEffect } from 'react';
import { Category } from '@account-book/types';
import { checkCategoryUsage } from '@/lib/api/categories';
import { showErrorToast } from '@/components/ui';
import { Alert } from '@/components/ui/Alert';

interface DeleteConfirmModalProps {
  category: Category;
  categories: Category[];
  onConfirm: (categoryId: string, replacementId?: string) => void;
  onCancel: () => void;
}

/**
 * 削除確認モーダルコンポーネント
 */
export function DeleteConfirmModal({
  category,
  categories,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps): React.JSX.Element {
  const [isUsed, setIsUsed] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [replacementId, setReplacementId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUsage = async (): Promise<void> => {
      try {
        const usage = await checkCategoryUsage(category.id);
        setIsUsed(usage.isUsed);
        setUsageCount(usage.usageCount);
      } catch (error) {
        console.error('Failed to check usage:', error);
      } finally {
        setLoading(false);
      }
    };
    void checkUsage();
  }, [category.id]);

  const handleConfirm = (): void => {
    if (isUsed && !replacementId) {
      showErrorToast('warning', '代替費目を選択してください');
      return;
    }
    onConfirm(category.id, replacementId || undefined);
  };

  const replacementOptions = categories.filter(
    (c) => c.id !== category.id && c.type === category.type && !c.isSystemDefined
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">費目削除の確認</h2>

        {loading ? (
          <div className="text-center py-4">確認中...</div>
        ) : (
          <>
            <p className="mb-4">「{category.name}」を削除してもよろしいですか？</p>

            {isUsed && (
              <Alert
                variant="warning"
                message={`この費目は${usageCount}件の取引で使用されています`}
                className="mb-4"
              >
                <div className="mt-3">
                  <label htmlFor="replacement-category" className="block text-sm font-medium mb-1">
                    代替費目を選択してください <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="replacement-category"
                    value={replacementId}
                    onChange={(e) => setReplacementId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">選択してください</option>
                    {replacementOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Alert>
            )}

            <div className="flex gap-2 mt-6">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={isUsed && !replacementId}
              >
                削除
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
