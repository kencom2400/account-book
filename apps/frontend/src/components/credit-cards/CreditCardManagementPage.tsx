'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard } from '@account-book/types';
import { MonthlyCardSummary } from '@/lib/api/aggregation';
import { getCreditCards } from '@/lib/api/credit-cards';
import { aggregationApi } from '@/lib/api/aggregation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { MonthlySummaryCard } from './MonthlySummaryCard';
import { ReconciliationTab } from './ReconciliationTab';
import { StatusTab } from './StatusTab';
import { AggregateButton } from './AggregateButton';
import { AlertBadge } from '@/components/alerts/AlertBadge';
import Link from 'next/link';

/**
 * クレジットカード管理画面
 * Issue #113: E-7: クレジットカード管理画面の実装
 * FR-012: クレジットカード月別集計
 * FR-013: 銀行引落額との自動照合
 * FR-014: 支払いステータス管理
 * FR-015: 不一致時のアラート表示
 */
export function CreditCardManagementPage(): React.JSX.Element {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlyCardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'reconciliation' | 'status'>('summary');

  useEffect(() => {
    const fetchCreditCards = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCreditCards();
        setCreditCards(data);
        if (data.length > 0) {
          setSelectedCardId(data[0].id);
        }
      } catch (err) {
        setError('クレジットカード情報の取得に失敗しました');
        console.error('Failed to fetch credit cards:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchCreditCards();
  }, []);

  useEffect(() => {
    if (!selectedCardId) return;

    const fetchMonthlySummaries = async (): Promise<void> => {
      try {
        const summaries = await aggregationApi.getAll();
        const cardSummaries = summaries
          .filter((s) => s.cardId === selectedCardId)
          .map(async (s) => {
            try {
              const detail = await aggregationApi.getById(s.id);
              return detail;
            } catch (err) {
              console.error('Failed to fetch summary detail:', err);
              return null;
            }
          });
        const results = (await Promise.all(cardSummaries)).filter(
          (s): s is MonthlyCardSummary => s !== null
        );
        setMonthlySummaries(results);
      } catch (err) {
        console.error('Failed to fetch monthly summaries:', err);
      }
    };

    void fetchMonthlySummaries();
  }, [selectedCardId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedCard = creditCards.find((c) => c.id === selectedCardId);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">クレジットカード管理</h1>
              <p className="text-gray-600">
                クレジットカードの利用明細、支払い情報、照合状況を管理します
              </p>
            </div>
            <div className="flex items-center gap-4">
              <AlertBadge />
              <Link href="/alerts" className="text-sm text-blue-600 hover:text-blue-800">
                アラート一覧
              </Link>
            </div>
          </div>
        </div>

        {/* クレジットカード一覧 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>登録済みクレジットカード</CardTitle>
          </CardHeader>
          <CardContent>
            {creditCards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">登録されているクレジットカードがありません</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  新しいカードを追加
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {creditCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCardId(card.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedCardId(card.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`border rounded-lg p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedCardId === card.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{card.cardName}</h3>
                        <p className="text-sm text-gray-600">
                          {card.issuer} • 下4桁: {card.cardNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">利用残高</p>
                        <p className="text-lg font-semibold">
                          ¥{card.currentBalance.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          利用可能: ¥{card.availableCredit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 選択されたカードの詳細情報 */}
        {selectedCard && (
          <div className="space-y-6">
            {/* タブ */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'summary'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  月別集計
                </button>
                <button
                  onClick={() => setActiveTab('reconciliation')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'reconciliation'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  照合結果
                </button>
                <button
                  onClick={() => setActiveTab('status')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'status'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  ステータス管理
                </button>
              </nav>
            </div>

            {/* タブコンテンツ */}
            {activeTab === 'summary' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">月別集計</h2>
                {monthlySummaries.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-gray-600 mb-4">月別集計データがありません</p>
                      <AggregateButton
                        cardId={selectedCardId}
                        onAggregate={async () => {
                          if (!selectedCardId) return;
                          try {
                            const summaries = await aggregationApi.getAll();
                            const cardSummaries = summaries
                              .filter((s) => s.cardId === selectedCardId)
                              .map(async (s) => {
                                const detail = await aggregationApi.getById(s.id);
                                return detail;
                              });
                            const results = await Promise.all(cardSummaries);
                            setMonthlySummaries(results);
                          } catch (err) {
                            console.error('Failed to refresh summaries:', err);
                          }
                        }}
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {monthlySummaries.map((summary) => (
                      <MonthlySummaryCard key={summary.id} summary={summary} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reconciliation' && <ReconciliationTab cardId={selectedCardId} />}

            {activeTab === 'status' && (
              <StatusTab cardId={selectedCardId} monthlySummaries={monthlySummaries} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
