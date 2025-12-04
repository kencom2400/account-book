'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Institution } from '@account-book/types';
import { getInstitutions } from '@/lib/api/institutions';
import { InstitutionCard } from './InstitutionCard';
import { Card, CardContent } from '@/components/ui/Card';

/**
 * 金融機関一覧コンポーネント
 * Issue #114: E-8: 金融機関設定画面の実装
 * FR-028: 金融機関接続設定の画面管理
 */
export function InstitutionList(): React.JSX.Element {
  const router = useRouter();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstitutions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await getInstitutions();
      setInstitutions(data);
      setError(null);
    } catch (err) {
      setError('金融機関の取得に失敗しました。');
      if (err instanceof Error) {
        console.error('金融機関の取得中にエラーが発生しました:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInstitutions();
  }, [fetchInstitutions]);

  const handleAddInstitution = (): void => {
    router.push('/banks/add');
  };

  const handleRefresh = (): void => {
    void fetchInstitutions();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">金融機関設定</h1>
          <p className="mt-2 text-gray-600">登録済みの金融機関を管理します</p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={handleAddInstitution}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            金融機関を追加
          </button>
          <button
            onClick={handleRefresh}
            className="text-gray-600 hover:text-gray-800 font-medium py-2 px-4 rounded-lg flex items-center border border-gray-300 hover:border-gray-400"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            更新
          </button>
        </div>

        {/* 金融機関一覧 */}
        {institutions.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  金融機関が登録されていません
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  金融機関を追加して、自動で取引履歴を取得しましょう
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleAddInstitution}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                  >
                    金融機関を追加
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {institutions.map((institution) => (
              <InstitutionCard
                key={institution.id}
                institution={institution}
                onUpdate={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
