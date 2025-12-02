'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ReconciliationReport } from '@account-book/types';

interface ReconciliationResultCardProps {
  reconciliation: ReconciliationReport;
  onViewDetails?: (id: string) => void;
}

/**
 * 照合結果カードコンポーネント
 * FR-013: 銀行引落額との自動照合
 */
export function ReconciliationResultCard({
  reconciliation,
  onViewDetails,
}: ReconciliationResultCardProps): React.JSX.Element {
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'MATCHED':
        return 'bg-green-100 text-green-800';
      case 'UNMATCHED':
        return 'bg-red-100 text-red-800';
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'MATCHED':
        return '一致';
      case 'UNMATCHED':
        return '不一致';
      case 'PARTIAL':
        return '部分一致';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{reconciliation.billingMonth}の照合結果</CardTitle>
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(reconciliation.reconciliationId)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              詳細を見る
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* ステータス */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">照合ステータス</span>
            <span
              className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(
                reconciliation.status
              )}`}
            >
              {getStatusLabel(reconciliation.status)}
            </span>
          </div>

          {/* 照合実行日時 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">照合実行日時</span>
            <span className="font-medium">{formatDate(reconciliation.executedAt)}</span>
          </div>

          {/* サマリー */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">総件数</p>
                <p className="font-semibold text-lg">{reconciliation.summary.total}件</p>
              </div>
              <div>
                <p className="text-gray-600">一致</p>
                <p className="font-semibold text-lg text-green-600">
                  {reconciliation.summary.matched}件
                </p>
              </div>
              <div>
                <p className="text-gray-600">不一致</p>
                <p className="font-semibold text-lg text-red-600">
                  {reconciliation.summary.unmatched}件
                </p>
              </div>
              <div>
                <p className="text-gray-600">部分一致</p>
                <p className="font-semibold text-lg text-yellow-600">
                  {reconciliation.summary.partial}件
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
