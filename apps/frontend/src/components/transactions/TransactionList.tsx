'use client';

import React from 'react';
import { Transaction, CategoryType } from '@account-book/types';
import { formatCurrency } from '@account-book/utils';

interface TransactionListProps {
  transactions: Transaction[];
}

/**
 * 取引一覧コンポーネント
 */
export function TransactionList({ transactions }: TransactionListProps): React.JSX.Element {
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

  if (transactions.length === 0) {
    return <div className="text-center py-8 text-gray-500">取引データがありません</div>;
  }

  return (
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
                <span className={`font-medium ${getCategoryTypeColor(transaction.category.type)}`}>
                  {transaction.category.name}
                </span>
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
  );
}
