'use client';

import { useState, useEffect } from 'react';
import { Bank, BankCategory } from '@account-book/types';
import { getSupportedBanks } from '@/lib/api/institutions';

interface BankSelectorProps {
  onSelectBank: (bank: Bank) => void;
  selectedBank?: Bank;
}

const CATEGORY_LABELS: Record<BankCategory, string> = {
  [BankCategory.MEGA_BANK]: 'メガバンク',
  [BankCategory.REGIONAL_BANK]: '地方銀行',
  [BankCategory.ONLINE_BANK]: 'ネット銀行',
};

/**
 * 銀行選択コンポーネント
 */
export function BankSelector({ onSelectBank, selectedBank }: BankSelectorProps) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BankCategory | 'all'>('all');

  // 銀行一覧を取得
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setLoading(true);
        const data = await getSupportedBanks();
        setBanks(data);
        setFilteredBanks(data);
        setError(null);
      } catch (err) {
        setError('銀行一覧の取得に失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanks();
  }, []);

  // 検索とフィルタリング
  useEffect(() => {
    let result = [...banks];

    // カテゴリでフィルタ
    if (selectedCategory !== 'all') {
      result = result.filter((bank) => bank.category === selectedCategory);
    }

    // 検索キーワードでフィルタ
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (bank) =>
          bank.name.toLowerCase().includes(term) ||
          bank.code.includes(term)
      );
    }

    setFilteredBanks(result);
  }, [banks, searchTerm, selectedCategory]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 検索ボックス */}
      <div>
        <input
          type="text"
          placeholder="銀行名または銀行コードで検索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* カテゴリタブ */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 font-medium ${
            selectedCategory === 'all'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          すべて
        </button>
        {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category as BankCategory)}
            className={`px-4 py-2 font-medium ${
              selectedCategory === category
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 銀行一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {filteredBanks.length === 0 ? (
          <div className="col-span-2 text-center text-gray-500 py-8">
            該当する銀行が見つかりませんでした
          </div>
        ) : (
          filteredBanks.map((bank) => (
            <button
              key={bank.id}
              onClick={() => onSelectBank(bank)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedBank?.id === bank.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-900">{bank.name}</div>
              <div className="text-sm text-gray-500">
                銀行コード: {bank.code}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {CATEGORY_LABELS[bank.category]}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

