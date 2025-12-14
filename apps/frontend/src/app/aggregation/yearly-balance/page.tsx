'use client';

import React, { Suspense } from 'react';
import { YearlyBalanceReportContent } from './YearlyBalanceReportContent';

/**
 * 年次レポートページ
 * FR-020: 年間収支推移表示
 */
export default function YearlyBalanceReportPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">読み込み中...</div>}>
      <YearlyBalanceReportContent />
    </Suspense>
  );
}
