'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '@account-book/utils';

interface MonthlySummaryCardProps {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
}

/**
 * 月次サマリーカードコンポーネント
 */
export function MonthlySummaryCard({
  year,
  month,
  income,
  expense,
  balance,
  transactionCount,
}: MonthlySummaryCardProps) {
  const balanceColor = balance >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {year}年{month}月の収支
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 収入 */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">収入</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(income)}
            </span>
          </div>

          {/* 支出 */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">支出</span>
            <span className="text-2xl font-bold text-red-600">
              {formatCurrency(expense)}
            </span>
          </div>

          {/* 区切り線 */}
          <hr className="border-gray-200" />

          {/* 収支差額 */}
          <div className="flex justify-between items-center">
            <span className="text-gray-800 font-semibold">収支差額</span>
            <span className={`text-3xl font-bold ${balanceColor}`}>
              {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
            </span>
          </div>

          {/* 取引件数 */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">取引件数</span>
              <span className="font-medium text-gray-700">
                {transactionCount}件
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

