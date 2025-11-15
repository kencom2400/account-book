'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { CategoryType } from '@account-book/types';
import { formatCurrency } from '@account-book/utils';

interface CategoryData {
  count: number;
  total: number;
}

interface CategoryBreakdownProps {
  byCategory: {
    [key in CategoryType]?: CategoryData;
  };
}

/**
 * カテゴリ別内訳コンポーネント
 */
export function CategoryBreakdown({ byCategory }: CategoryBreakdownProps) {
  const getCategoryLabel = (type: CategoryType): string => {
    switch (type) {
      case CategoryType.INCOME:
        return '収入';
      case CategoryType.EXPENSE:
        return '支出';
      case CategoryType.TRANSFER:
        return '振替';
      case CategoryType.REPAYMENT:
        return '返済';
      case CategoryType.INVESTMENT:
        return '投資';
      default:
        return type;
    }
  };

  const getCategoryColor = (type: CategoryType): string => {
    switch (type) {
      case CategoryType.INCOME:
        return 'bg-green-100 text-green-800';
      case CategoryType.EXPENSE:
        return 'bg-red-100 text-red-800';
      case CategoryType.TRANSFER:
        return 'bg-blue-100 text-blue-800';
      case CategoryType.REPAYMENT:
        return 'bg-orange-100 text-orange-800';
      case CategoryType.INVESTMENT:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = Object.entries(byCategory) as [CategoryType, CategoryData][];

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>カテゴリ別内訳</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            データがありません
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>カテゴリ別内訳</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories.map(([type, data]) => (
            <div key={type} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(type)}`}>
                  {getCategoryLabel(type)}
                </span>
                <span className="text-sm text-gray-500">
                  {data.count}件
                </span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(Math.abs(data.total))}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

