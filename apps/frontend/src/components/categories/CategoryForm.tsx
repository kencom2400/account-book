'use client';

import { useState, useEffect } from 'react';
import { Category, CategoryType } from '@account-book/types';

interface CategoryFormProps {
  category?: Category | null;
  onSubmit: (data: {
    name: string;
    type: CategoryType;
    parentId?: string | null;
    icon?: string | null;
    color?: string | null;
  }) => void;
  onCancel: () => void;
}

/**
 * 費目フォームコンポーネント
 */
export function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps): JSX.Element {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>(CategoryType.EXPENSE);
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setIcon(category.icon || '');
      setColor(category.color || '');
    } else {
      setName('');
      setType(CategoryType.EXPENSE);
      setIcon('');
      setColor('');
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onSubmit({
      name,
      type,
      icon: icon || null,
      color: color || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-4">{category ? '費目編集' : '費目作成'}</h2>
      </div>

      <div>
        <label htmlFor="category-name" className="block text-sm font-medium mb-1">
          費目名 <span className="text-red-500">*</span>
        </label>
        <input
          id="category-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 食費"
          required
          maxLength={50}
        />
      </div>

      {!category && (
        <div>
          <label htmlFor="category-type" className="block text-sm font-medium mb-1">
            タイプ <span className="text-red-500">*</span>
          </label>
          <select
            id="category-type"
            value={type}
            onChange={(e) => setType(e.target.value as CategoryType)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value={CategoryType.EXPENSE}>支出</option>
            <option value={CategoryType.INCOME}>収入</option>
            <option value={CategoryType.TRANSFER}>振替</option>
          </select>
        </div>
      )}

      <div>
        <label htmlFor="category-icon" className="block text-sm font-medium mb-1">
          アイコン（絵文字）
        </label>
        <input
          id="category-icon"
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 🍚"
          maxLength={10}
        />
      </div>

      <div>
        <label htmlFor="category-color" className="block text-sm font-medium mb-1">
          カラー
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={color || '#000000'}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
          />
          <input
            id="category-color"
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="#FF9800"
            pattern="^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">#RGB, #RRGGBB, #RRGGBBAA形式で入力</p>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {category ? '更新' : '作成'}
        </button>
        {category && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}
