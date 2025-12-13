/**
 * Monthly Balance Report Page Tests
 * FR-016: 月別収支集計
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MonthlyBalanceReportContent } from '../MonthlyBalanceReportContent';
import * as aggregationApi from '@/lib/api/aggregation';

// モック
jest.mock('@/lib/api/aggregation');

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  pathname: '/aggregation/monthly-balance',
  query: {},
  asPath: '/aggregation/monthly-balance',
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams('year=2025&month=1'),
}));

const mockAggregationApi = aggregationApi as jest.Mocked<typeof aggregationApi>;

describe('MonthlyBalanceReportPage', () => {
  // テスト全体のタイムアウトを30秒に設定
  jest.setTimeout(30000);

  const mockMonthlyBalance: aggregationApi.MonthlyBalanceResponse = {
    month: '2025-01',
    income: {
      total: 500000,
      count: 5,
      byCategory: [
        {
          categoryId: 'cat-1',
          categoryName: '給与',
          amount: 500000,
          count: 5,
          percentage: 100,
        },
      ],
      byInstitution: [
        {
          institutionId: 'inst-1',
          institutionName: 'メインバンク',
          amount: 500000,
          count: 5,
          percentage: 100,
        },
      ],
      transactions: [
        {
          id: 'tx-1',
          date: '2025-01-25T00:00:00.000Z',
          amount: 500000,
          categoryType: 'INCOME',
          categoryId: 'cat-1',
          institutionId: 'inst-1',
          accountId: 'acc-1',
          description: '給与',
        },
      ],
    },
    expense: {
      total: 300000,
      count: 10,
      byCategory: [
        {
          categoryId: 'cat-2',
          categoryName: '食費',
          amount: 150000,
          count: 5,
          percentage: 50,
        },
        {
          categoryId: 'cat-3',
          categoryName: '交通費',
          amount: 150000,
          count: 5,
          percentage: 50,
        },
      ],
      byInstitution: [
        {
          institutionId: 'inst-2',
          institutionName: 'クレジットカードA',
          amount: 300000,
          count: 10,
          percentage: 100,
        },
      ],
      transactions: [
        {
          id: 'tx-2',
          date: '2025-01-10T00:00:00.000Z',
          amount: 50000,
          categoryType: 'EXPENSE',
          categoryId: 'cat-2',
          institutionId: 'inst-2',
          accountId: 'acc-2',
          description: 'スーパー',
        },
      ],
    },
    balance: 200000,
    savingsRate: 40,
    comparison: {
      previousMonth: {
        incomeDiff: 0,
        expenseDiff: 0,
        balanceDiff: 0,
        incomeChangeRate: 0,
        expenseChangeRate: 0,
      },
      sameMonthLastYear: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.replace.mockClear();
    mockAggregationApi.aggregationApi.getMonthlyBalance.mockResolvedValue(mockMonthlyBalance);
  });

  it('ローディング状態を表示する', () => {
    // Arrange: モックを遅延させる
    mockAggregationApi.aggregationApi.getMonthlyBalance.mockImplementation(
      () => new Promise(() => {}) // 解決しないPromise
    );

    // Act: コンポーネントをレンダリング
    render(<MonthlyBalanceReportContent />);

    // Assert: ローディングメッセージが表示される
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('エラー状態を表示し、再試行できる', async () => {
    // Arrange: エラーを返すモック
    mockAggregationApi.aggregationApi.getMonthlyBalance.mockRejectedValue(new Error('API Error'));

    // Act: コンポーネントをレンダリング
    render(<MonthlyBalanceReportContent />);

    // Assert: エラーメッセージと再試行ボタンが表示される
    await waitFor(
      () => {
        expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
        expect(screen.getByText('再試行')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Act: 再試行ボタンをクリック
    const user = userEvent.setup({ delay: null });
    const retryButton = screen.getByText('再試行');
    await user.click(retryButton);

    // Assert: APIが再呼び出しされる
    await waitFor(
      () => {
        expect(mockAggregationApi.aggregationApi.getMonthlyBalance).toHaveBeenCalledTimes(2);
      },
      { timeout: 10000 }
    );
  }, 30000);

  it('データがない場合のメッセージを表示する', async () => {
    // Arrange: nullを返すモック
    mockAggregationApi.aggregationApi.getMonthlyBalance.mockResolvedValue(null as never);

    // Act: コンポーネントをレンダリング
    render(<MonthlyBalanceReportContent />);

    // Assert: データがないメッセージが表示される
    await waitFor(
      () => {
        expect(screen.getByText('データがありません')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  }, 30000);

  it('月次レポートのコンテンツを表示する', async () => {
    // Act: コンポーネントをレンダリング
    render(<MonthlyBalanceReportContent />);

    // Assert: 主要な要素が表示される
    await waitFor(
      () => {
        expect(screen.getByText('月別収支レポート')).toBeInTheDocument();
        expect(screen.getAllByText('収入').length).toBeGreaterThan(0);
        expect(screen.getAllByText('支出').length).toBeGreaterThan(0);
        expect(screen.getAllByText('収支').length).toBeGreaterThan(0);
        expect(screen.getByText('貯蓄率')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  }, 30000);

  it('サマリーカードに正しい値を表示する', async () => {
    // Act: コンポーネントをレンダリング
    render(<MonthlyBalanceReportContent />);

    // Assert: サマリーカードに正しい値が表示される
    await waitFor(
      () => {
        // formatCurrencyはIntl.NumberFormatを使用するため、実際の表示形式を確認
        // 例: "¥500,000" または "￥500,000" または "500,000円"
        expect(screen.getAllByText(/500[,，]000/).length).toBeGreaterThan(0); // 収入
        expect(screen.getAllByText(/300[,，]000/).length).toBeGreaterThan(0); // 支出
        expect(screen.getAllByText(/200[,，]000/).length).toBeGreaterThan(0); // 収支
        expect(screen.getByText('40.00%')).toBeInTheDocument(); // 貯蓄率
      },
      { timeout: 10000 }
    );
  }, 30000);

  it('前月比・前年同月比を表示する', async () => {
    // Act: コンポーネントをレンダリング
    render(<MonthlyBalanceReportContent />);

    // Assert: 前月比が表示される
    await waitFor(
      () => {
        expect(screen.getByText('前月比')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  }, 30000);

  it('前月ボタンをクリックすると前月のデータを取得する', async () => {
    // Act: コンポーネントをレンダリング
    const user = userEvent.setup({ delay: null });
    render(<MonthlyBalanceReportContent />);

    // Assert: 初期データが取得される
    await waitFor(
      () => {
        expect(mockAggregationApi.aggregationApi.getMonthlyBalance).toHaveBeenCalledWith(2025, 1);
      },
      { timeout: 10000 }
    );

    // Act: 前月ボタンをクリック
    const previousButton = screen.getByLabelText('前月');
    await user.click(previousButton);

    // Assert: 前月（2024年12月）のデータが取得される
    await waitFor(
      () => {
        expect(mockAggregationApi.aggregationApi.getMonthlyBalance).toHaveBeenCalledWith(2024, 12);
      },
      { timeout: 10000 }
    );
  });

  it('次月ボタンをクリックすると次月のデータを取得する', async () => {
    // Act: コンポーネントをレンダリング
    const user = userEvent.setup({ delay: null });
    render(<MonthlyBalanceReportContent />);

    // Assert: 初期データが取得される
    await waitFor(
      () => {
        expect(mockAggregationApi.aggregationApi.getMonthlyBalance).toHaveBeenCalledWith(2025, 1);
      },
      { timeout: 10000 }
    );

    // Act: 次月ボタンをクリック
    const nextButton = screen.getByLabelText('次月');
    await user.click(nextButton);

    // Assert: 次月（2025年2月）のデータが取得される
    await waitFor(
      () => {
        expect(mockAggregationApi.aggregationApi.getMonthlyBalance).toHaveBeenCalledWith(2025, 2);
      },
      { timeout: 10000 }
    );
  });

  it('月選択ボタンをクリックするとモーダルが表示される', async () => {
    // Act: コンポーネントをレンダリング
    const user = userEvent.setup({ delay: null });
    render(<MonthlyBalanceReportContent />);

    // Assert: 初期データが取得される
    await waitFor(
      () => {
        expect(screen.getByText('月別収支レポート')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Act: 月選択ボタンをクリック
    const monthButton = screen.getByText(/2025年1月/);
    await user.click(monthButton);

    // Assert: モーダルが表示される
    await waitFor(
      () => {
        expect(screen.getByText('月を選択')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }, 15000);

  it('モーダルで月を選択できる', async () => {
    // Act: コンポーネントをレンダリング
    const user = userEvent.setup({ delay: null });
    render(<MonthlyBalanceReportContent />);

    // Assert: 初期データが取得される
    await waitFor(
      () => {
        expect(screen.getByText('月別収支レポート')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Act: 月選択ボタンをクリック
    const monthButton = screen.getByText(/2025年1月/);
    await user.click(monthButton);

    // Assert: モーダルが表示される
    await waitFor(
      () => {
        expect(screen.getByText('月を選択')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Act: 3月を選択
    const marchButton = screen.getByText('3月');
    await user.click(marchButton);

    // Act: 選択ボタンをクリック
    const selectButton = screen.getByText('選択');
    await user.click(selectButton);

    // Assert: 3月のデータが取得される
    await waitFor(
      () => {
        expect(mockAggregationApi.aggregationApi.getMonthlyBalance).toHaveBeenCalledWith(2025, 3);
      },
      { timeout: 5000 }
    );
  }, 15000);

  it('モーダルをキャンセルできる', async () => {
    // Act: コンポーネントをレンダリング
    const user = userEvent.setup({ delay: null });
    render(<MonthlyBalanceReportContent />);

    // Assert: 初期データが取得される
    await waitFor(
      () => {
        expect(screen.getByText('月別収支レポート')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Act: 月選択ボタンをクリック
    const monthButton = screen.getByText(/2025年1月/);
    await user.click(monthButton);

    // Assert: モーダルが表示される
    await waitFor(
      () => {
        expect(screen.getByText('月を選択')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Act: キャンセルボタンをクリック
    const cancelButton = screen.getByText('キャンセル');
    await user.click(cancelButton);

    // Assert: モーダルが閉じられる
    await waitFor(
      () => {
        expect(screen.queryByText('月を選択')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }, 15000);

  it('カテゴリ別内訳セクションを表示する', async () => {
    // Act: コンポーネントをレンダリング
    render(<MonthlyBalanceReportContent />);

    // Assert: カテゴリ別内訳が表示される
    await waitFor(
      () => {
        expect(screen.getByText('カテゴリ別内訳')).toBeInTheDocument();
        expect(screen.getByText('給与')).toBeInTheDocument(); // 収入カテゴリ
        expect(screen.getByText('食費')).toBeInTheDocument(); // 支出カテゴリ
      },
      { timeout: 10000 }
    );
  }, 15000);

  it('金融機関別内訳セクションを表示する', async () => {
    // Act: コンポーネントをレンダリング
    render(<MonthlyBalanceReportContent />);

    // Assert: 金融機関別内訳が表示される
    await waitFor(
      () => {
        expect(screen.getByText('金融機関別内訳')).toBeInTheDocument();
        expect(screen.getByText('メインバンク')).toBeInTheDocument(); // 収入金融機関
        expect(screen.getByText('クレジットカードA')).toBeInTheDocument(); // 支出金融機関
      },
      { timeout: 10000 }
    );
  }, 15000);

  it('詳細を見るボタンが表示される', async () => {
    // Act: コンポーネントをレンダリング
    render(<MonthlyBalanceReportContent />);

    // Assert: 詳細を見るボタンが表示される
    await waitFor(
      () => {
        const detailButtons = screen.getAllByText('詳細を見る →');
        expect(detailButtons.length).toBeGreaterThan(0);
      },
      { timeout: 10000 }
    );
  }, 15000);
});
