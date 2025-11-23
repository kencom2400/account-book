'use client';

import React, { useState, useEffect } from 'react';
import { Transaction, CategoryType, Category } from '@account-book/types';
import { formatCurrency } from '@account-book/utils';
import { updateTransactionCategory } from '@/lib/api/transactions';
import { getCategories, CategoryNode } from '@/lib/api/categories';

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionUpdate?: (transaction: Transaction) => void;
}

/**
 * カテゴリツリーをフラットな配列に変換するヘルパー関数
 */
const flattenCategoryTree = (nodes: CategoryNode[]): Category[] => {
  const result: Category[] = [];
  const flatten = (node: CategoryNode): void => {
    result.push(node.category);
    if (node.children && node.children.length > 0) {
      node.children.forEach(flatten);
    }
  };
  nodes.forEach(flatten);
  return result;
};

/**
 * 取引一覧コンポーネント（インライン編集機能付き）
 * FR-010: 費目の手動修正機能
 */
export function TransactionList({
  transactions,
  onTransactionUpdate,
}: TransactionListProps): React.JSX.Element {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // カテゴリ一覧を取得
  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        const data = await getCategories();
        // ツリー構造の場合はフラット化、配列の場合はそのまま使用
        if (Array.isArray(data)) {
          setCategories(data as Category[]);
        } else {
          // CategoryNode[]の場合はフラット化
          const flatCategories = flattenCategoryTree(data as CategoryNode[]);
          setCategories(flatCategories);
        }
      } catch (err) {
        setError('カテゴリの取得に失敗しました。ページを再読み込みしてください。');
        console.error('カテゴリの取得に失敗しました:', err);
      }
    };
    void fetchCategories();
  }, []);

  const getCategoryTypeColor = (type: CategoryType): string => {
    switch (type) {
      case CategoryType.INCOME:
        return 'text-green-600';
      case CategoryType.EXPENSE:
        return 'text-red-600';
      case CategoryType.TRANSFER:
        return 'text-blue-600';
      case CategoryType.REPAYMENT:
        return 'text-orange-600';
      case CategoryType.INVESTMENT:
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatAmount = (amount: number, type: CategoryType): string => {
    const prefix = type === CategoryType.INCOME ? '+' : type === CategoryType.EXPENSE ? '-' : '';
    return `${prefix}${formatCurrency(Math.abs(amount))}`;
  };

  const handleCategoryClick = (transactionId: string): void => {
    setEditingId(transactionId);
    setError(null);
  };

  const handleCategoryChange = async (
    transactionId: string,
    newCategoryId: string
  ): Promise<void> => {
    const newCategory = categories.find((c) => c.id === newCategoryId);
    if (!newCategory) return;

    try {
      setUpdating(transactionId);
      setError(null);

      const updatedTransaction = await updateTransactionCategory(transactionId, {
        id: newCategory.id,
        name: newCategory.name,
        type: newCategory.type,
      });

      // 親コンポーネントに通知
      if (onTransactionUpdate) {
        onTransactionUpdate(updatedTransaction);
      }

      setEditingId(null);
    } catch (err) {
      setError('カテゴリの更新に失敗しました');
      console.error('カテゴリ更新エラー:', err);
    } finally {
      setUpdating(null);
    }
  };

  const handleCancelEdit = (): void => {
    setEditingId(null);
    setError(null);
  };

  if (transactions.length === 0) {
    return <div className="text-center py-8 text-gray-500">取引データがありません</div>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                金額
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(transaction.date).toLocaleDateString('ja-JP')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{transaction.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editingId === transaction.id ? (
                    <div className="flex items-center space-x-2">
                      <select
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue={transaction.category.id}
                        onChange={(e) => void handleCategoryChange(transaction.id, e.target.value)}
                        disabled={updating === transaction.id}
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleCancelEdit}
                        className="text-gray-500 hover:text-gray-700 text-xs"
                        disabled={updating === transaction.id}
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCategoryClick(transaction.id)}
                      className={`font-medium ${getCategoryTypeColor(transaction.category.type)} hover:underline cursor-pointer`}
                      disabled={updating === transaction.id}
                    >
                      {updating === transaction.id ? '更新中...' : transaction.category.name}
                    </button>
                  )}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${getCategoryTypeColor(transaction.category.type)}`}
                >
                  {formatAmount(transaction.amount, transaction.category.type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                  {transaction.isReconciled ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      照合済
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      未照合
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
