'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { alertApi, type Alert, AlertStatus, ActionType } from '@/lib/api/alerts';
import { formatAlertLevel, formatAlertType, getAlertLevelColor } from '@/utils/alert.utils';

/**
 * アラート詳細ページ
 */
export default function AlertDetailPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  useEffect(() => {
    const fetchAlert = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const data = await alertApi.getById(id);
        setAlert(data);
      } catch (err) {
        console.error('Failed to fetch alert:', err);
        setError('アラートの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    void fetchAlert();
  }, [id]);

  const handleResolve = async (): Promise<void> => {
    if (!alert) return;

    try {
      setResolving(true);
      await alertApi.resolve(id, {
        resolvedBy: 'user', // TODO: 実際のユーザーIDを取得
        resolutionNote: '手動で解決しました',
      });
      // アラートを再取得
      const updated = await alertApi.getById(id);
      setAlert(updated);
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      setError('アラートの解決に失敗しました');
    } finally {
      setResolving(false);
    }
  };

  const handleMarkAsRead = async (): Promise<void> => {
    if (!alert) return;

    try {
      setMarkingAsRead(true);
      const updated = await alertApi.markAsRead(id);
      setAlert(updated);
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
      setError('アラートの既読処理に失敗しました');
    } finally {
      setMarkingAsRead(false);
    }
  };

  const handleAction = async (action: ActionType): Promise<void> => {
    switch (action) {
      case ActionType.VIEW_DETAILS:
        // 既に詳細ページにいるので何もしない
        break;
      case ActionType.MARK_RESOLVED:
        await handleResolve();
        break;
      case ActionType.IGNORE:
        await handleMarkAsRead();
        break;
      case ActionType.MANUAL_MATCH:
        // TODO: 手動照合画面に遷移
        router.push('/reconciliations');
        break;
      case ActionType.CONTACT_BANK:
        // TODO: カード会社問い合わせ画面に遷移
        break;
    }
  };

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

  if (error || !alert) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'アラートが見つかりません'}</p>
          <Link
            href="/alerts"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            アラート一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const levelColor = getAlertLevelColor(alert.level);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link href="/alerts" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← アラート一覧に戻る
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 text-sm font-semibold rounded ${levelColor}`}>
              {formatAlertLevel(alert.level)}
            </span>
            <span className="px-3 py-1 text-sm rounded bg-gray-100 text-gray-800">
              {formatAlertType(alert.type)}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{alert.title}</h1>
          <p className="text-sm text-gray-500 mt-2">
            作成日時: {new Date(alert.createdAt).toLocaleString('ja-JP')}
          </p>
        </div>

        {/* アラート詳細 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>詳細情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">メッセージ</p>
                <p className="text-gray-900 whitespace-pre-wrap">{alert.message}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">カード情報</p>
                <p className="text-gray-900">{alert.details.cardName}</p>
                <p className="text-sm text-gray-500">請求月: {alert.details.billingMonth}</p>
              </div>

              {alert.details.expectedAmount !== null && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">金額情報</p>
                  <div className="space-y-1">
                    <p className="text-gray-900">
                      請求額: ¥{alert.details.expectedAmount.toLocaleString()}
                    </p>
                    {alert.details.actualAmount !== null && (
                      <p className="text-gray-900">
                        引落額: ¥{alert.details.actualAmount.toLocaleString()}
                      </p>
                    )}
                    {alert.details.discrepancy !== null && (
                      <p className="text-gray-900">
                        差額: ¥{alert.details.discrepancy.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {alert.resolvedAt && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">解決情報</p>
                  <p className="text-gray-900">
                    解決日時: {new Date(alert.resolvedAt).toLocaleString('ja-JP')}
                  </p>
                  {alert.resolvedBy && <p className="text-gray-900">解決者: {alert.resolvedBy}</p>}
                  {alert.resolutionNote && (
                    <p className="text-gray-900">メモ: {alert.resolutionNote}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* アクション */}
        {alert.status !== AlertStatus.RESOLVED && alert.actions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>アクション</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {alert.actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.action)}
                    disabled={resolving || markingAsRead}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      action.isPrimary
                        ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
