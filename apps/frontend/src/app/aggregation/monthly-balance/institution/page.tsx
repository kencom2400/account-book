'use client';

import React, { Suspense } from 'react';
import { InstitutionBreakdownContent } from './InstitutionBreakdownContent';

/**
 * 金融機関別内訳画面
 * FR-016: 月別収支集計 - 金融機関別内訳
 */
export default function InstitutionBreakdownPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">読み込み中...</div>}>
      <InstitutionBreakdownContent />
    </Suspense>
  );
}
