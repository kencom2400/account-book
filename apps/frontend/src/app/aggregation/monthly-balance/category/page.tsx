'use client';

import React, { Suspense } from 'react';
import { CategoryBreakdownContent } from './CategoryBreakdownContent';

/**
 * カテゴリ別内訳画面
 * FR-016: 月別収支集計 - カテゴリ別内訳
 */
export default function CategoryBreakdownPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">読み込み中...</div>}>
      <CategoryBreakdownContent />
    </Suspense>
  );
}
