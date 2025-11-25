'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard } from '@account-book/types';
import { getCreditCards } from '@/lib/api/credit-cards';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

/**
 * クレジットカード管理画面
 * Issue #113: E-7: クレジットカード管理画面の実装
 */
export function CreditCardManagementPage(): React.JSX.Element {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreditCards = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCreditCards();
        setCreditCards(data);
      } catch (err) {
        setError('クレジットカード情報の取得に失敗しました');
        console.error('Failed to fetch credit cards:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchCreditCards();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">クレジットカード管理</h1>
          <p className="text-gray-600">
            クレジットカードの利用明細、支払い情報、照合状況を管理します
          </p>
        </div>

        {/* クレジットカード一覧 */}
        <Card>
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
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
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
      </div>
    </div>
  );
}
