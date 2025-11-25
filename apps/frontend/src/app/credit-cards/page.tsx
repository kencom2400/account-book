'use client';

import React from 'react';
import { CreditCardManagementPage } from '@/components/credit-cards/CreditCardManagementPage';

/**
 * クレジットカード管理ページ
 * Issue #113: E-7: クレジットカード管理画面の実装
 * FR-012: クレジットカード月別集計
 * FR-013: 銀行引落額との自動照合
 * FR-014: 支払いステータス管理
 * FR-015: 不一致時のアラート表示
 */
export default function CreditCardsPage(): React.JSX.Element {
  return <CreditCardManagementPage />;
}
