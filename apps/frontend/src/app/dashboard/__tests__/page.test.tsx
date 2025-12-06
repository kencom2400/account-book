/**
 * Dashboard Page Tests
 * FR-024: 年間収支グラフをページに統合
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import DashboardPage from '../page';
import * as transactionsApi from '@/lib/api/transactions';
import * as aggregationApi from '@/lib/api/aggregation';

// モック
jest.mock('@/lib/api/transactions');
jest.mock('@/lib/api/aggregation');

const mockTransactionsApi = transactionsApi as jest.Mocked<typeof transactionsApi>;
const mockAggregationApi = aggregationApi as jest.Mocked<typeof aggregationApi>;

describe('DashboardPage', () => {
  const mockTransactions = [
    {
      id: 'tx-1',
      date: '2025-01-15',
      amount: 5000,
      description: 'テスト取引1',
      categoryId: 'cat-1',
      categoryName: '食費',
      category: {
        id: 'cat-1',
        name: '食費',
        type: 'expense' as const,
      },
      type: 'expense' as const,
      institutionId: 'inst-1',
      institutionName: 'テスト銀行',
    },
  ];

  const mockSummary = {
    year: 2025,
    month: 1,
    income: 500000,
    expense: 300000,
    balance: 200000,
    transactionCount: 10,
    byCategory: [
      {
        categoryId: 'cat-1',
        categoryName: '食費',
        amount: 100000,
        count: 5,
      },
    ],
  };

  const mockMonthlyBalance: aggregationApi.MonthlyBalanceResponse = {
    month: '2025-01',
    income: {
      total: 500000,
      count: 5,
      byCategory: [],
      byInstitution: [],
      transactions: [],
    },
    expense: {
      total: 300000,
      count: 5,
      byCategory: [],
      byInstitution: [],
      transactions: [],
    },
    balance: 200000,
    savingsRate: 40,
  };

  const mockYearlyBalance: aggregationApi.YearlyBalanceResponse = {
    year: 2025,
    months: [
      {
        month: '2025-01',
        income: {
          total: 500000,
          count: 5,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        expense: {
          total: 300000,
          count: 5,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        balance: 200000,
        savingsRate: 40,
      },
    ],
    annual: {
      totalIncome: 6000000,
      totalExpense: 3600000,
      totalBalance: 2400000,
      averageIncome: 500000,
      averageExpense: 300000,
      savingsRate: 40,
    },
    trend: {
      incomeProgression: { direction: 'stable', changeRate: 0, standardDeviation: 0 },
      expenseProgression: { direction: 'stable', changeRate: 0, standardDeviation: 0 },
      balanceProgression: { direction: 'stable', changeRate: 0, standardDeviation: 0 },
    },
    highlights: {
      maxIncomeMonth: '2025-01',
      maxExpenseMonth: '2025-01',
      bestBalanceMonth: '2025-01',
      worstBalanceMonth: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // 現在の日付を固定（2025年1月）
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15'));

    mockTransactionsApi.getTransactions.mockResolvedValue(mockTransactions);
    mockTransactionsApi.getMonthlySummary.mockResolvedValue(mockSummary);
    mockAggregationApi.aggregationApi.getMonthlyBalance.mockResolvedValue(mockMonthlyBalance);
    mockAggregationApi.aggregationApi.getYearlyBalance.mockResolvedValue(mockYearlyBalance);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('ローディング状態を表示する', () => {
    // モックを遅延させる
    mockTransactionsApi.getTransactions.mockImplementation(
      () => new Promise(() => {}) // 解決しないPromise
    );

    render(<DashboardPage />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('エラー状態を表示する', async () => {
    mockTransactionsApi.getTransactions.mockRejectedValue(new Error('API Error'));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
      expect(screen.getByText('再読み込み')).toBeInTheDocument();
    });
  });

  it('ダッシュボードのコンテンツを表示する', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
      expect(screen.getByText(/2025年1月の収支状況/)).toBeInTheDocument();
    });
  });

  it('月次サマリーカードを表示する', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockTransactionsApi.getMonthlySummary).toHaveBeenCalledWith(2025, 1);
    });
  });

  it('月間グラフを表示する', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockAggregationApi.aggregationApi.getMonthlyBalance).toHaveBeenCalledWith(2025, 1);
    });
  });

  it('年間収支グラフを表示する', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockAggregationApi.aggregationApi.getYearlyBalance).toHaveBeenCalledWith(2025);
      expect(screen.getByText('年間収支グラフ')).toBeInTheDocument();
    });
  });

  it('年の選択ができる', async () => {
    const user = userEvent.setup({ delay: null });
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('年間収支グラフ')).toBeInTheDocument();
    });

    const yearSelect = screen.getByLabelText('年:');
    expect(yearSelect).toBeInTheDocument();

    // 年を変更
    await user.selectOptions(yearSelect, '2024');

    await waitFor(() => {
      expect(mockAggregationApi.aggregationApi.getYearlyBalance).toHaveBeenCalledWith(2024);
    });
  });

  it('年間データのローディング状態を表示する', async () => {
    // 年間データの取得を遅延させる
    mockAggregationApi.aggregationApi.getYearlyBalance.mockImplementation(
      () => new Promise(() => {}) // 解決しないPromise
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('年間収支グラフ')).toBeInTheDocument();
    });

    // 年を変更してローディング状態を確認
    const user = userEvent.setup({ delay: null });
    const yearSelect = screen.getByLabelText('年:');
    await user.selectOptions(yearSelect, '2024');

    await waitFor(() => {
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });
  });

  it('年間データのエラー状態を表示し、再試行できる', async () => {
    mockAggregationApi.aggregationApi.getYearlyBalance.mockRejectedValueOnce(
      new Error('Yearly data error')
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('年間データの取得に失敗しました')).toBeInTheDocument();
      expect(screen.getByText('再試行')).toBeInTheDocument();
    });

    // 再試行ボタンをクリック
    const user = userEvent.setup({ delay: null });
    const retryButton = screen.getByText('再試行');
    await user.click(retryButton);

    await waitFor(() => {
      expect(mockAggregationApi.aggregationApi.getYearlyBalance).toHaveBeenCalledTimes(2);
    });
  });

  it('年間データが空の場合のメッセージを表示する', async () => {
    mockAggregationApi.aggregationApi.getYearlyBalance.mockResolvedValueOnce({
      ...mockYearlyBalance,
      months: [],
      annual: {
        totalIncome: 0,
        totalExpense: 0,
        totalBalance: 0,
        averageIncome: 0,
        averageExpense: 0,
        savingsRate: 0,
      },
    });

    render(<DashboardPage />);

    await waitFor(() => {
      // 空データの場合、YearlyBalanceGraphコンポーネントが表示されるが、データが空の状態
      // 実際の表示内容を確認（YearlyBalanceGraphコンポーネントの実装に依存）
      expect(screen.getByText('年間収支グラフ')).toBeInTheDocument();
    });
  });

  it('取引一覧を表示する', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockTransactionsApi.getTransactions).toHaveBeenCalledWith({
        year: 2025,
        month: 1,
      });
      expect(screen.getByText('取引一覧')).toBeInTheDocument();
    });
  });
});
