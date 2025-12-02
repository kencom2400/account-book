'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { MonthlyCardSummary } from '@/lib/api/aggregation';
import { formatDate } from '@/utils/date.utils';

interface MonthlySummaryCardProps {
  summary: MonthlyCardSummary;
  onViewDetails?: (id: string) => void;
}

/**
 * 月別集計カードコンポーネント
 * FR-012: クレジットカード月別集計
 */
export function MonthlySummaryCard({
  summary,
  onViewDetails,
}: MonthlySummaryCardProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{summary.billingMonth}の集計</CardTitle>
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(summary.cardId)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              詳細を見る
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 基本情報 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">締め日</p>
              <p className="font-semibold">{formatDate(summary.closingDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">支払日</p>
              <p className="font-semibold">{formatDate(summary.paymentDate)}</p>
            </div>
          </div>

          {/* 金額情報 */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">合計金額</span>
              <span className="text-xl font-bold">¥{summary.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-800 font-semibold">最終支払額</span>
              <span className="text-2xl font-bold text-blue-600">
                ¥{summary.netPaymentAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 取引件数 */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">取引件数</span>
            <span className="font-medium text-gray-700">{summary.transactionCount}件</span>
          </div>

          {/* ステータス */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">支払いステータス</span>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  summary.status === 'PAID'
                    ? 'bg-green-100 text-green-800'
                    : summary.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : summary.status === 'OVERDUE'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {summary.status}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
