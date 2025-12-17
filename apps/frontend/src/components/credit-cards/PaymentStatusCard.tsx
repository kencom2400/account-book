'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  paymentStatusApi,
  PaymentStatusRecord,
  type PaymentStatus,
} from '@/lib/api/payment-status';
import { formatDateTime } from '@/utils/date.utils';
import { showErrorToast } from '@/components/ui';
import { getErrorMessage } from '@/utils/error.utils';

const PAYMENT_STATUSES: PaymentStatus[] = [
  'PENDING',
  'PROCESSING',
  'PAID',
  'OVERDUE',
  'PARTIAL',
  'DISPUTED',
  'CANCELLED',
  'MANUAL_CONFIRMED',
];

interface PaymentStatusCardProps {
  cardSummaryId: string;
  currentStatus: PaymentStatusRecord;
  onStatusUpdate?: () => void;
}

/**
 * 支払いステータス管理カードコンポーネント
 * FR-014: 支払いステータス管理
 */
export function PaymentStatusCard({
  cardSummaryId,
  currentStatus,
  onStatusUpdate,
}: PaymentStatusCardProps): React.JSX.Element {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [newStatus, setNewStatus] = useState<PaymentStatus>(currentStatus.status || 'PENDING');
  const [notes, setNotes] = useState('');

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'PARTIAL':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'DISPUTED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdate = async (): Promise<void> => {
    try {
      setIsUpdating(true);
      await paymentStatusApi.updateStatus(cardSummaryId, {
        newStatus,
        notes: notes || undefined,
      });
      setShowUpdateForm(false);
      setNotes('');
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Failed to update payment status:', error);
      const errorMessage = getErrorMessage(error, 'ステータスの更新に失敗しました');
      showErrorToast('error', errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>支払いステータス</CardTitle>
          <button
            onClick={() => setShowUpdateForm(!showUpdateForm)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showUpdateForm ? 'キャンセル' : 'ステータスを更新'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 現在のステータス */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">現在のステータス</span>
            <span
              className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(
                currentStatus.status
              )}`}
            >
              {currentStatus.status}
            </span>
          </div>

          {/* 更新情報 */}
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">更新日時</span>
              <span className="font-medium">{formatDateTime(currentStatus.updatedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">更新者</span>
              <span className="font-medium">
                {currentStatus.updatedBy === 'system' ? 'システム' : 'ユーザー'}
              </span>
            </div>
            {currentStatus.notes && (
              <div className="pt-2 border-t">
                <p className="text-gray-600 mb-1">メモ</p>
                <p className="text-sm">{currentStatus.notes}</p>
              </div>
            )}
          </div>

          {/* ステータス更新フォーム */}
          {showUpdateForm && (
            <div className="border-t pt-4 space-y-3">
              <div>
                <label
                  htmlFor="status-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  新しいステータス
                </label>
                <select
                  id="status-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="status-notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  メモ（任意）
                </label>
                <textarea
                  id="status-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ステータス変更の理由やメモを入力してください"
                />
              </div>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isUpdating ? '更新中...' : 'ステータスを更新'}
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
