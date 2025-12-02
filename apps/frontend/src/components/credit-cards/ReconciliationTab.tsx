'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { reconciliationApi } from '@/lib/api/reconciliation';
import { ReconciliationListItem } from '@/lib/api/reconciliation';
import type { ReconciliationReport } from '@account-book/types';
import { ReconciliationStatus } from '@account-book/types';
import { ReconciliationResultCard } from './ReconciliationResultCard';

interface ReconciliationTabProps {
  cardId: string | null;
}

/**
 * 照合結果タブコンポーネント
 * FR-013: 銀行引落額との自動照合
 */
export function ReconciliationTab({ cardId }: ReconciliationTabProps): React.JSX.Element {
  const [reconciliations, setReconciliations] = useState<ReconciliationListItem[]>([]);
  const [selectedReconciliation, setSelectedReconciliation] = useState<ReconciliationReport | null>(
    null
  );
  const [reconciliationDetails, setReconciliationDetails] = useState<
    Map<string, ReconciliationReport>
  >(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingMonth, setBillingMonth] = useState<string>('');

  useEffect(() => {
    if (!cardId) return;

    const fetchReconciliations = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const data = await reconciliationApi.getAll({ cardId });
        setReconciliations(data);
      } catch (err) {
        setError('照合結果の取得に失敗しました');
        console.error('Failed to fetch reconciliations:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchReconciliations();
  }, [cardId]);

  const handleReconcile = async (): Promise<void> => {
    if (!cardId || !billingMonth) {
      alert('請求月を選択してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await reconciliationApi.reconcile({
        cardId,
        billingMonth,
      });
      setSelectedReconciliation(result);
      // 一覧を再取得
      const data = await reconciliationApi.getAll({ cardId });
      setReconciliations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '照合の実行に失敗しました';
      setError(errorMessage);
      console.error('Failed to reconcile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id: string): Promise<void> => {
    try {
      // キャッシュを確認
      const cached = reconciliationDetails.get(id);
      if (cached) {
        setSelectedReconciliation(cached);
        return;
      }

      const detail = await reconciliationApi.getById(id);
      setReconciliationDetails((prev) => {
        const next = new Map(prev);
        next.set(id, detail);
        return next;
      });
      setSelectedReconciliation(detail);
    } catch (err) {
      console.error('Failed to fetch reconciliation detail:', err);
      setError('照合結果の取得に失敗しました');
    }
  };

  // 現在の年月を取得（YYYY-MM形式）
  const getCurrentMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">照合結果</h2>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={billingMonth || getCurrentMonth()}
            onChange={(e) => setBillingMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={handleReconcile}
            disabled={loading || !cardId || !billingMonth}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '照合中...' : '照合を実行'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {selectedReconciliation ? (
        <div className="mb-6">
          <button
            onClick={() => setSelectedReconciliation(null)}
            className="mb-4 text-sm text-blue-600 hover:text-blue-800"
          >
            ← 一覧に戻る
          </button>
          <ReconciliationResultCard reconciliation={selectedReconciliation} />
        </div>
      ) : (
        <div>
          {reconciliations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-600 mb-4">照合結果がありません。照合を実行してください。</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reconciliations.map((reconciliation) => (
                <div
                  key={reconciliation.id}
                  onClick={() => {
                    void handleViewDetails(reconciliation.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void handleViewDetails(reconciliation.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer"
                >
                  <Card className="hover:shadow-lg">
                    <CardHeader>
                      <CardTitle>{reconciliation.billingMonth}の照合</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">ステータス</span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              reconciliation.status === ReconciliationStatus.MATCHED
                                ? 'bg-green-100 text-green-800'
                                : reconciliation.status === ReconciliationStatus.UNMATCHED
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {reconciliation.status === ReconciliationStatus.MATCHED
                              ? '一致'
                              : reconciliation.status === ReconciliationStatus.UNMATCHED
                                ? '不一致'
                                : '部分一致'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">一致件数</span>
                          <span className="font-medium">
                            {reconciliation.summary.matched}/{reconciliation.summary.total}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">実行日時</span>
                          <span className="font-medium">
                            {new Date(reconciliation.executedAt).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
