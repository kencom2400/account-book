'use client';

import React from 'react';
import { InstitutionList } from '@/components/institutions/InstitutionList';

/**
 * 金融機関設定画面
 * Issue #114: E-8: 金融機関設定画面の実装
 * FR-028: 金融機関接続設定の画面管理
 */
export default function BanksPage(): React.JSX.Element {
  return <InstitutionList />;
}
