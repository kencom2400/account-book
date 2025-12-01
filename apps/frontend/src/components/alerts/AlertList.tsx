'use client';

import React from 'react';
import Link from 'next/link';
import type { AlertListItem } from '@/lib/api/alerts';
import { AlertStatus } from '@/lib/api/alerts';
import { formatAlertLevel, formatAlertStatus, getAlertLevelColor } from '@/utils/alert.utils';

interface AlertListProps {
  alerts: AlertListItem[];
  onAlertClick?: (alert: AlertListItem) => void;
}

/**
 * アラート一覧コンポーネント
 */
export function AlertList({ alerts, onAlertClick }: AlertListProps): React.JSX.Element {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">アラートはありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <AlertListItem key={alert.id} alert={alert} onClick={() => onAlertClick?.(alert)} />
      ))}
    </div>
  );
}

/**
 * アラート一覧項目コンポーネント
 */
function AlertListItem({
  alert,
  onClick,
}: {
  alert: AlertListItem;
  onClick?: () => void;
}): React.JSX.Element {
  const levelColor = getAlertLevelColor(alert.level);
  const statusColor = getStatusColor(alert.status);

  return (
    <Link
      href={`/alerts/${alert.id}`}
      onClick={onClick}
      className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded ${levelColor}`}>
              {formatAlertLevel(alert.level)}
            </span>
            <span className={`px-2 py-1 text-xs rounded ${statusColor}`}>
              {formatAlertStatus(alert.status)}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{alert.title}</h3>
          <p className="text-sm text-gray-500">
            {new Date(alert.createdAt).toLocaleString('ja-JP')}
          </p>
        </div>
        {alert.status === AlertStatus.UNREAD && (
          <div className="ml-4">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * ステータスの色を取得
 */
function getStatusColor(status: AlertStatus): string {
  switch (status) {
    case AlertStatus.UNREAD:
      return 'bg-blue-100 text-blue-800';
    case AlertStatus.READ:
      return 'bg-gray-100 text-gray-800';
    case AlertStatus.RESOLVED:
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
