'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalSettingsTab } from '@/components/sync-settings/GlobalSettingsTab';
import { InstitutionSettingsTab } from '@/components/sync-settings/InstitutionSettingsTab';

/**
 * 同期設定画面
 * Issue #77: [FEATURE] FR-030: 表示設定機能
 * FR-030: データ同期間隔の設定
 */
export default function SyncSettingsPage(): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'global' | 'institution'>('global');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            戻る
          </button>
          <h1 className="text-3xl font-bold text-gray-900">データ同期設定</h1>
          <p className="mt-2 text-gray-600">各金融機関からデータを取得する頻度を設定します</p>
        </div>

        {/* タブ */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('global')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'global'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              全体設定
            </button>
            <button
              onClick={() => setActiveTab('institution')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'institution'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              金融機関ごとの設定
            </button>
          </nav>
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'global' && <GlobalSettingsTab />}
        {activeTab === 'institution' && <InstitutionSettingsTab />}
      </div>
    </div>
  );
}
