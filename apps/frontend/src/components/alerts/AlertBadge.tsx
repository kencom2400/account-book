'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { alertApi, AlertStatus } from '@/lib/api/alerts';

/**
 * アラートバッジコンポーネント
 * 未読アラート数を表示
 */
export function AlertBadge(): React.JSX.Element {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnreadCount = async (): Promise<void> => {
      try {
        const response = await alertApi.getAll({
          status: AlertStatus.UNREAD,
        });
        setUnreadCount(response.unreadCount);
      } catch (error) {
        console.error('Failed to fetch unread alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchUnreadCount();

    // 定期的に未読数を更新（30秒ごと）
    const interval = setInterval(() => {
      void fetchUnreadCount();
    }, 30000);

    return (): void => clearInterval(interval);
  }, []);

  if (loading) {
    return <></>;
  }

  if (unreadCount === 0) {
    return <></>;
  }

  return (
    <Link href="/alerts" className="relative inline-flex items-center justify-center">
      <svg
        className="w-6 h-6 text-gray-600 hover:text-gray-900"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    </Link>
  );
}
