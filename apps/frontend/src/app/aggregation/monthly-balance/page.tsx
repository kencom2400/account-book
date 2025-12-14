'use client';

import React, { Suspense } from 'react';
import { MonthlyBalanceReportContent } from './MonthlyBalanceReportContent';

/**
 * 月次レポート画面
 * FR-016: 月別収支集計
 */
export default function MonthlyBalanceReportPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">読み込み中...</div>}>
      <MonthlyBalanceReportContent />
    </Suspense>
  );
}
