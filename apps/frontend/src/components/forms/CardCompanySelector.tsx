'use client';

import { useState, useEffect } from 'react';
import { CardCompany, CardCompanyCategory } from '@account-book/types';
import { getSupportedCardCompanies } from '@/lib/api/credit-cards';

interface CardCompanySelectorProps {
  onSelectCompany: (company: CardCompany) => void;
  selectedCompany?: CardCompany;
}

const CATEGORY_LABELS: Record<CardCompanyCategory, string> = {
  [CardCompanyCategory.MAJOR]: '大手カード',
  [CardCompanyCategory.BANK]: '銀行系',
  [CardCompanyCategory.RETAIL]: '流通系',
  [CardCompanyCategory.ONLINE]: 'ネット系',
};

/**
 * カード会社選択コンポーネント
 */
export function CardCompanySelector({
  onSelectCompany,
  selectedCompany,
}: CardCompanySelectorProps): React.JSX.Element {
  const [companies, setCompanies] = useState<CardCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CardCompanyCategory | 'all'>('all');

  // デバウンス処理: 検索キーワードの変更を500ms遅延させる
  useEffect(() => {
    const timer = setTimeout((): void => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return (): void => clearTimeout(timer);
  }, [searchTerm]);

  // カード会社一覧を取得（カテゴリと検索キーワードでフィルタリング）
  useEffect(() => {
    const fetchCompanies = async (): Promise<void> => {
      try {
        setLoading(true);
        const data = await getSupportedCardCompanies({
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          searchTerm: debouncedSearchTerm || undefined,
        });
        setCompanies(data);
        setError(null);
      } catch (_err) {
        setError('カード会社一覧の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    void fetchCompanies();
  }, [selectedCategory, debouncedSearchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">{error}</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 検索ボックス */}
      <div>
        <input
          type="text"
          placeholder="カード会社名またはコードで検索"
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
        {(Object.entries(CATEGORY_LABELS) as [CardCompanyCategory, string][]).map(
          ([category, label]) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 font-medium ${
                selectedCategory === category
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* カード会社一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {companies.length === 0 ? (
          <div className="col-span-2 text-center text-gray-500 py-8">
            該当するカード会社が見つかりませんでした
          </div>
        ) : (
          companies.map((company) => (
            <button
              key={company.id}
              onClick={() => onSelectCompany(company)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedCompany?.id === company.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-900">{company.name}</div>
              <div className="text-sm text-gray-500">コード: {company.code}</div>
              <div className="text-xs text-gray-400 mt-1">{CATEGORY_LABELS[company.category]}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
