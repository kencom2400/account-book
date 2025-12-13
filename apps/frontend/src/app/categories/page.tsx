'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category, CategoryType } from '@account-book/types';
import {
  getCategories,
  createCategory,
  deleteCategory,
  checkCategoryUsage,
} from '@/lib/api/categories';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { CategoryList } from '@/components/categories/CategoryList';
import { CategoryEditModal } from '@/components/categories/CategoryEditModal';
import { DeleteConfirmModal } from '@/components/categories/DeleteConfirmModal';
import { Card } from '@/components/ui/Card';

/**
 * 費目管理ページ
 */
export default function CategoryManagementPage(): React.JSX.Element {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [filterType, setFilterType] = useState<CategoryType | 'ALL'>('ALL');

  // 費目一覧を取得
  const loadCategories = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCategories({
        type: filterType === 'ALL' ? undefined : filterType,
      });
      setCategories(result as Category[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '費目の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  // 費目作成
  const handleCreate = async (data: {
    name: string;
    type: CategoryType;
    parentId?: string | null;
    icon?: string | null;
    color?: string | null;
  }): Promise<void> => {
    try {
      await createCategory(data);
      await loadCategories();
    } catch (err) {
      console.error('費目作成エラー:', err);
      if (err instanceof Error) {
        setError(`費目の作成に失敗しました: ${err.message}`);
      } else {
        setError('費目の作成に失敗しました');
      }
    }
  };

  // 費目更新（モーダル経由で呼ばれる）
  const handleUpdateSuccess = async (): Promise<void> => {
    await loadCategories();
    setEditCategoryId(null);
  };

  // 費目削除
  const handleDelete = async (id: string, replacementId?: string): Promise<void> => {
    try {
      const usage = await checkCategoryUsage(id);
      if (usage.isUsed && !replacementId) {
        setError('使用中の費目は削除できません。代替費目を選択してください。');
        return;
      }
      await deleteCategory(id, replacementId);
      await loadCategories();
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '費目の削除に失敗しました');
    }
  };

  // 編集ボタンクリック（モーダルを開く）
  const handleEdit = (category: Category): void => {
    setEditCategoryId(category.id);
  };

  // 削除ボタンクリック
  const handleDeleteClick = (category: Category): void => {
    setDeleteTarget(category);
  };

  // 新規作成ボタンクリック（フォームをリセット）
  const handleNewClick = (): void => {
    // フォームは常に新規作成モードで表示されるため、特に処理は不要
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">費目管理</h1>
        <p className="text-gray-600">費目の追加・編集・削除ができます</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側: フォーム */}
        <div className="lg:col-span-1">
          <Card>
            <CategoryForm
              category={null}
              onSubmit={(data) => {
                void handleCreate(data);
              }}
              onCancel={() => {
                // フォームをリセット（特に処理は不要）
              }}
            />
          </Card>
        </div>

        {/* 右側: 一覧 */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-4 py-2 rounded ${
                  filterType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setFilterType(CategoryType.EXPENSE)}
                className={`px-4 py-2 rounded ${
                  filterType === CategoryType.EXPENSE
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                支出
              </button>
              <button
                onClick={() => setFilterType(CategoryType.INCOME)}
                className={`px-4 py-2 rounded ${
                  filterType === CategoryType.INCOME
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                収入
              </button>
            </div>
            <button
              onClick={handleNewClick}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              ＋ 新規作成
            </button>
          </div>

          <Card>
            {loading ? (
              <div className="text-center py-8">読み込み中...</div>
            ) : (
              <CategoryList
                categories={categories}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            )}
          </Card>
        </div>
      </div>

      {/* 編集モーダル */}
      <CategoryEditModal
        categoryId={editCategoryId}
        isOpen={editCategoryId !== null}
        onClose={() => setEditCategoryId(null)}
        onSuccess={handleUpdateSuccess}
      />

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <DeleteConfirmModal
          category={deleteTarget}
          categories={categories}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
