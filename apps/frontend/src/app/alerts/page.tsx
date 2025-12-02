'use client';

import React, { useEffect, useState } from 'react';
import { AlertList } from '@/components/alerts/AlertList';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { alertApi, type AlertListItem, AlertLevel, AlertStatus, AlertType } from '@/lib/api/alerts';

/**
 * アラート一覧ページ
 */
export default function AlertsPage(): React.JSX.Element {
  const [alerts, setAlerts] = useState<AlertListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フィルター状態
  const [levelFilter, setLevelFilter] = useState<AlertLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all');

  useEffect(() => {
    const fetchAlerts = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const query: {
          level?: AlertLevel;
          status?: AlertStatus;
          type?: AlertType;
        } = {};

        if (levelFilter !== 'all') {
          query.level = levelFilter;
        }
        if (statusFilter !== 'all') {
          query.status = statusFilter;
        }
        if (typeFilter !== 'all') {
          query.type = typeFilter;
        }

        const response = await alertApi.getAll(query);
        setAlerts(response.alerts);
        setTotal(response.total);
        setUnreadCount(response.unreadCount);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
        setError('アラートの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    void fetchAlerts();
  }, [levelFilter, statusFilter, typeFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">アラート</h1>
          <p className="text-gray-600">
            未読: {unreadCount}件 / 合計: {total}件
          </p>
        </div>

        {/* フィルター */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>フィルター</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="level-filter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  レベル
                </label>
                <select
                  id="level-filter"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as AlertLevel | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべて</option>
                  <option value={AlertLevel.INFO}>情報</option>
                  <option value={AlertLevel.WARNING}>警告</option>
                  <option value={AlertLevel.ERROR}>エラー</option>
                  <option value={AlertLevel.CRITICAL}>緊急</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="status-filter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  ステータス
                </label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as AlertStatus | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべて</option>
                  <option value={AlertStatus.UNREAD}>未読</option>
                  <option value={AlertStatus.READ}>既読</option>
                  <option value={AlertStatus.RESOLVED}>解決済み</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="type-filter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  タイプ
                </label>
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as AlertType | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべて</option>
                  <option value={AlertType.AMOUNT_MISMATCH}>金額不一致</option>
                  <option value={AlertType.PAYMENT_NOT_FOUND}>引落未検出</option>
                  <option value={AlertType.OVERDUE}>延滞</option>
                  <option value={AlertType.MULTIPLE_CANDIDATES}>複数候補</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* アラート一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>アラート一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertList alerts={alerts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
