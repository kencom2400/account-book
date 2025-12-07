'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '@account-book/utils';
import type { AssetBalanceResponse } from '@/lib/api/aggregation';

interface AssetBalanceCardProps {
  data: AssetBalanceResponse;
}

/**
 * 総資産カードコンポーネント
 * FR-026: 金融機関別資産残高表示
 */
export function AssetBalanceCard({ data }: AssetBalanceCardProps): React.JSX.Element {
  const asOfDate = new Date(data.asOfDate);
  const formattedDate = `${asOfDate.getFullYear()}年${asOfDate.getMonth() + 1}月${asOfDate.getDate()}日`;

  // 前月比の表示
  const previousMonthDiff = data.previousMonth.diff;
  const previousMonthRate = data.previousMonth.rate;
  const previousMonthColor = previousMonthDiff >= 0 ? 'text-green-600' : 'text-red-600';
  const previousMonthSign = previousMonthDiff >= 0 ? '+' : '';

  // 前年比の表示
  const previousYearDiff = data.previousYear.diff;
  const previousYearRate = data.previousYear.rate;
  const previousYearColor = previousYearDiff >= 0 ? 'text-green-600' : 'text-red-600';
  const previousYearSign = previousYearDiff >= 0 ? '+' : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>総資産</CardTitle>
        <p className="text-sm text-gray-500 mt-1">{formattedDate}時点</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* 総資産 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">総資産</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.totalAssets)}
              </span>
            </div>
          </div>

          {/* 総負債 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">総負債</span>
              <span className="text-xl font-semibold text-red-600">
                {formatCurrency(data.totalLiabilities)}
              </span>
            </div>
          </div>

          {/* 区切り線 */}
          <hr className="border-gray-200" />

          {/* 純資産 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-800 font-semibold">純資産</span>
              <span
                className={`text-3xl font-bold ${data.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {data.netWorth >= 0 ? '+' : ''}
                {formatCurrency(data.netWorth)}
              </span>
            </div>
          </div>

          {/* 前月比・前年比 */}
          {(previousMonthDiff !== 0 || previousYearDiff !== 0) && (
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
              {previousMonthDiff !== 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">前月比</span>
                  <span className={`font-medium ${previousMonthColor}`}>
                    {previousMonthSign}
                    {formatCurrency(Math.abs(previousMonthDiff))} ({previousMonthSign}
                    {previousMonthRate.toFixed(1)}%)
                  </span>
                </div>
              )}
              {previousYearDiff !== 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">前年比</span>
                  <span className={`font-medium ${previousYearColor}`}>
                    {previousYearSign}
                    {formatCurrency(Math.abs(previousYearDiff))} ({previousYearSign}
                    {previousYearRate.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
