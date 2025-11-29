'use client';

import { Category } from '@account-book/types';

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

/**
 * 費目一覧コンポーネント
 */
export function CategoryList({
  categories,
  onEdit,
  onDelete,
}: CategoryListProps): React.JSX.Element {
  if (categories.length === 0) {
    return <div className="text-center py-8 text-gray-500">費目がありません</div>;
  }

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between p-4 border border-gray-200 rounded hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            {category.icon && <span className="text-2xl">{category.icon}</span>}
            {category.color && (
              <div
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: category.color }}
              />
            )}
            <div>
              <div className="font-medium">{category.name}</div>
              <div className="text-sm text-gray-500">
                {category.type} {category.isSystemDefined && '（システム定義）'}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!category.isSystemDefined && (
              <>
                <button
                  onClick={() => onEdit(category)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  編集
                </button>
                <button
                  onClick={() => onDelete(category)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  削除
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
