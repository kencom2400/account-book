'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { TransactionList } from '@/components/transactions/TransactionList';
import {
  getTransactions,
  exportTransactions,
  type ExportFormat,
  type GetTransactionsParams,
} from '@/lib/api/transactions';
import { getInstitutions } from '@/lib/api/institutions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CategoryType } from '@account-book/types';
import type { Transaction, Institution } from '@account-book/types';

type SortField = 'date' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

/**
 * 取引一覧ページ
 * Issue #108: [TASK] E-2: 取引履歴一覧画面の実装
 * FR-010: 費目の手動修正機能
 */
export default function TransactionsPage(): React.JSX.Element {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  // フィルター状態
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<CategoryType | 'all'>('all');
  const [reconciledFilter, setReconciledFilter] = useState<'all' | 'reconciled' | 'unreconciled'>(
    'all'
  );
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // ソート状態
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 金融機関を取得
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        const institutionsData = await getInstitutions();
        setInstitutions(institutionsData);
      } catch (err) {
        console.error('データの取得に失敗しました:', err);
      }
    };
    void fetchData();
  }, []);

  const loadTransactions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const params: GetTransactionsParams = {};

      if (institutionFilter !== 'all') {
        params.institutionId = institutionFilter;
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      const data = await getTransactions(params);
      setTransactions(data);
    } catch (err) {
      console.error('取引データの取得に失敗しました:', err);
      setError('取引データの取得に失敗しました。再読み込みしてください。');
    } finally {
      setLoading(false);
    }
  }, [institutionFilter, startDate, endDate]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  // フィルタリングとソートを適用した取引一覧
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // カテゴリタイプでフィルタ
    if (categoryTypeFilter !== 'all') {
      filtered = filtered.filter((t) => t.category.type === categoryTypeFilter);
    }

    // 照合ステータスでフィルタ
    if (reconciledFilter === 'reconciled') {
      filtered = filtered.filter((t) => t.isReconciled);
    } else if (reconciledFilter === 'unreconciled') {
      filtered = filtered.filter((t) => !t.isReconciled);
    }

    // ソート
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'amount':
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'category':
          comparison = a.category.name.localeCompare(b.category.name, 'ja');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, categoryTypeFilter, reconciledFilter, sortField, sortOrder]);

  const handleTransactionUpdate = useCallback((updatedTransaction: Transaction): void => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
    );
  }, []);

  const handleExport = useCallback(
    async (format: ExportFormat): Promise<void> => {
      try {
        setExporting(true);
        setError(null);
        const params: GetTransactionsParams = {};
        if (institutionFilter !== 'all') {
          params.institutionId = institutionFilter;
        }
        if (startDate) {
          params.startDate = startDate;
        }
        if (endDate) {
          params.endDate = endDate;
        }
        await exportTransactions({ ...params, format });
      } catch (err) {
        console.error('エクスポートに失敗しました:', err);
        setError('エクスポートに失敗しました。もう一度お試しください。');
      } finally {
        setExporting(false);
      }
    },
    [institutionFilter, startDate, endDate]
  );

  const handleFilterReset = useCallback((): void => {
    setInstitutionFilter('all');
    setCategoryTypeFilter('all');
    setReconciledFilter('all');
    setStartDate('');
    setEndDate('');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">取引履歴一覧</h1>
          <p className="text-gray-600">
            表示件数: {filteredAndSortedTransactions.length}件 / 全{transactions.length}件
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-500 rounded p-4">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => void loadTransactions()}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              再読み込み
            </button>
          </div>
        )}

        {/* フィルター */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>フィルター</CardTitle>
              <button
                onClick={handleFilterReset}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                リセット
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 金融機関フィルタ */}
              <div>
                <label
                  htmlFor="institution-filter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  金融機関
                </label>
                <select
                  id="institution-filter"
                  value={institutionFilter}
                  onChange={(e) => setInstitutionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべて</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* カテゴリタイプフィルタ */}
              <div>
                <label
                  htmlFor="category-type-filter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  カテゴリタイプ
                </label>
                <select
                  id="category-type-filter"
                  value={categoryTypeFilter}
                  onChange={(e) => setCategoryTypeFilter(e.target.value as CategoryType | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべて</option>
                  <option value={CategoryType.INCOME}>収入</option>
                  <option value={CategoryType.EXPENSE}>支出</option>
                  <option value={CategoryType.TRANSFER}>振替</option>
                  <option value={CategoryType.REPAYMENT}>返済</option>
                  <option value={CategoryType.INVESTMENT}>投資</option>
                </select>
              </div>

              {/* 照合ステータスフィルタ */}
              <div>
                <label
                  htmlFor="reconciled-filter"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  照合ステータス
                </label>
                <select
                  id="reconciled-filter"
                  value={reconciledFilter}
                  onChange={(e) =>
                    setReconciledFilter(e.target.value as 'all' | 'reconciled' | 'unreconciled')
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべて</option>
                  <option value="reconciled">照合済</option>
                  <option value="unreconciled">未照合</option>
                </select>
              </div>

              {/* 開始日 */}
              <div>
                <label
                  htmlFor="start-date"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  開始日
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 終了日 */}
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                  終了日
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ソートとエクスポート */}
        <Card className="mb-6">
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* ソート */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <label
                    htmlFor="sort-field"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    ソート項目
                  </label>
                  <select
                    id="sort-field"
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date">日付</option>
                    <option value="amount">金額</option>
                    <option value="category">カテゴリ</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="sort-order"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    並び順
                  </label>
                  <select
                    id="sort-order"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desc">降順</option>
                    <option value="asc">昇順</option>
                  </select>
                </div>
              </div>

              {/* エクスポート */}
              <div className="flex gap-2">
                <button
                  onClick={() => void handleExport('csv')}
                  disabled={exporting || filteredAndSortedTransactions.length === 0}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {exporting ? 'エクスポート中...' : 'CSVエクスポート'}
                </button>
                <button
                  onClick={() => void handleExport('json')}
                  disabled={exporting || filteredAndSortedTransactions.length === 0}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {exporting ? 'エクスポート中...' : 'JSONエクスポート'}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 取引一覧 */}
        {loading ? (
          <Card>
            <CardContent>
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">読み込み中...</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <TransactionList
                transactions={filteredAndSortedTransactions}
                onTransactionUpdate={handleTransactionUpdate}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
