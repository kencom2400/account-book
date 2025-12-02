'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { paymentStatusApi } from '@/lib/api/payment-status';
import { PaymentStatusRecord } from '@/lib/api/payment-status';
import { MonthlyCardSummary } from '@/lib/api/aggregation';
import { PaymentStatusCard } from './PaymentStatusCard';

interface StatusTabProps {
  monthlySummaries: MonthlyCardSummary[];
}

/**
 * ステータス管理タブコンポーネント
 * FR-014: 支払いステータス管理
 */
export function StatusTab({ monthlySummaries }: StatusTabProps): React.JSX.Element {
  const [statusRecords, setStatusRecords] = useState<Map<string, PaymentStatusRecord>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (monthlySummaries.length === 0) return;

    const fetchStatusRecords = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // 月別集計IDのリストを取得
        const summaryIds = monthlySummaries
          .map((summary) => summary.id)
          .filter((id): id is string => id !== undefined && id !== null);

        if (summaryIds.length === 0) {
          setStatusRecords(new Map());
          return;
        }

        // 一括取得でN+1問題を解消
        const statusRecords = await paymentStatusApi.getStatuses(summaryIds);

        // Mapに変換（cardSummaryIdをキーとして使用）
        const recordsMap = new Map<string, PaymentStatusRecord>();
        for (const record of statusRecords) {
          recordsMap.set(record.cardSummaryId, record);
        }

        setStatusRecords(recordsMap);
      } catch (err) {
        setError('ステータス情報の取得に失敗しました');
        console.error('Failed to fetch status records:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchStatusRecords();
  }, [monthlySummaries]);

  const handleStatusUpdate = async (summaryId: string): Promise<void> => {
    if (!summaryId) return;

    // ステータスを再取得
    try {
      const status = await paymentStatusApi.getStatus(summaryId);
      setStatusRecords((prev) => {
        const next = new Map(prev);
        next.set(summaryId, status);
        return next;
      });
    } catch (err) {
      console.error('Failed to refresh status:', err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (monthlySummaries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-600">
            月別集計データがありません。まず月別集計を実行してください。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">ステータス管理</h2>

      <div className="space-y-6">
        {monthlySummaries.map((summary) => {
          const summaryId = summary.id;
          if (!summaryId) {
            console.warn('Summary ID not found:', summary);
            return null;
          }

          const statusRecord = statusRecords.get(summaryId);
          if (!statusRecord) {
            return (
              <Card key={`${summary.cardId}-${summary.billingMonth}`}>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-600">
                    {summary.billingMonth}のステータス情報がありません
                  </p>
                </CardContent>
              </Card>
            );
          }

          return (
            <div key={summaryId}>
              <div className="mb-2">
                <h3 className="text-lg font-semibold">{summary.billingMonth}のステータス</h3>
              </div>
              <PaymentStatusCard
                cardSummaryId={summaryId}
                currentStatus={statusRecord}
                onStatusUpdate={() => handleStatusUpdate(summaryId)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
