'use client';

import React from 'react';
import CategoryClassifier from '@/components/CategoryClassifier';

/**
 * カテゴリ自動分類ページ
 * FR-008: カテゴリ自動分類機能
 */
export default function CategoryClassifierPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto max-w-2xl">
        <CategoryClassifier />
      </div>
    </main>
  );
}
