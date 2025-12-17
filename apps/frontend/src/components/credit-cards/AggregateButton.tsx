'use client';

import React, { useState } from 'react';
import { aggregationApi } from '@/lib/api/aggregation';
import { showErrorToast } from '@/components/ui';
import { getErrorMessage } from '@/utils/error.utils';

interface AggregateButtonProps {
  cardId: string | null;
  onAggregate: () => Promise<void>;
}

/**
 * 集計実行ボタンコンポーネント
 */
export function AggregateButton({ cardId, onAggregate }: AggregateButtonProps): React.JSX.Element {
  const [isAggregating, setIsAggregating] = useState(false);
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');

  // デフォルト値を設定（現在月から3ヶ月前まで）
  React.useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const startMonthStr = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
    setStartMonth(startMonthStr);
    setEndMonth(currentMonth);
  }, []);

  const handleAggregate = async (): Promise<void> => {
    if (!cardId || !startMonth || !endMonth) {
      showErrorToast('warning', '集計期間を選択してください');
      return;
    }

    try {
      setIsAggregating(true);
      await aggregationApi.aggregate({
        cardId,
        startMonth,
        endMonth,
      });
      await onAggregate();
    } catch (err) {
      console.error('Failed to aggregate:', err);
      const errorMessage = getErrorMessage(err, '集計の実行に失敗しました');
      showErrorToast('error', errorMessage);
    } finally {
      setIsAggregating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <label htmlFor="start-month" className="block text-sm font-medium text-gray-700 mb-1">
            開始月
          </label>
          <input
            id="start-month"
            type="month"
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label htmlFor="end-month" className="block text-sm font-medium text-gray-700 mb-1">
            終了月
          </label>
          <input
            id="end-month"
            type="month"
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      <button
        onClick={handleAggregate}
        disabled={isAggregating || !cardId || !startMonth || !endMonth}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isAggregating ? '集計中...' : '集計を実行'}
      </button>
    </div>
  );
}
