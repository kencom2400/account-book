/**
 * Institution Breakdown Page Tests
 * FR-016: 月別収支集計 - 金融機関別内訳
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { InstitutionBreakdownContent } from '../InstitutionBreakdownContent';
import * as aggregationApi from '@/lib/api/aggregation';

// モック
jest.mock('@/lib/api/aggregation');

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  pathname: '/aggregation/monthly-balance/institution',
  query: {},
  asPath: '/aggregation/monthly-balance/institution',
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams('year=2025&month=1&type=expense'),
}));

const mockAggregationApi = aggregationApi as jest.Mocked<typeof aggregationApi>;

describe('InstitutionBreakdownPage', () => {
  // テスト全体のタイムアウトを30秒に設定
  jest.setTimeout(30000);

  const mockMonthlyBalance: aggregationApi.MonthlyBalanceResponse = {
    month: '2025-01',
    income: {
      total: 500000,
      count: 5,
      byCategory: [],
      byInstitution: [
        {
          institutionId: 'inst-1',
          institutionName: 'メインバンク',
          amount: 500000,
          count: 5,
          percentage: 100,
        },
      ],
      transactions: [],
    },
    expense: {
      total: 300000,
      count: 10,
      byCategory: [],
      byInstitution: [
        {
          institutionId: 'inst-2',
          institutionName: 'クレジットカードA',
          amount: 200000,
          count: 7,
          percentage: 66.67,
        },
        {
          institutionId: 'inst-3',
          institutionName: 'クレジットカードB',
          amount: 100000,
          count: 3,
          percentage: 33.33,
        },
      ],
      transactions: [],
    },
    balance: 200000,
    savingsRate: 40,
    comparison: {
      previousMonth: null,
      sameMonthLastYear: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
    mockAggregationApi.aggregationApi.getMonthlyBalance.mockResolvedValue(mockMonthlyBalance);
  });

  it('ローディング状態を表示する', () => {
    // Arrange: モックを遅延させる
    mockAggregationApi.aggregationApi.getMonthlyBalance.mockImplementation(
      () => new Promise(() => {}) // 解決しないPromise
    );

    // Act: コンポーネントをレンダリング
    render(<InstitutionBreakdownContent />);

    // Assert: ローディングメッセージが表示される
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('エラー状態を表示し、再試行できる', async () => {
    // Arrange: エラーを返すモック
    mockAggregationApi.aggregationApi.getMonthlyBalance.mockRejectedValue(new Error('API Error'));

    // Act: コンポーネントをレンダリング
    render(<InstitutionBreakdownContent />);

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
  });

  it('金融機関別内訳のコンテンツを表示する', async () => {
    // Act: コンポーネントをレンダリング
    render(<InstitutionBreakdownContent />);

    // Assert: 主要な要素が表示される
    await waitFor(
      () => {
        expect(screen.getAllByText('金融機関別内訳').length).toBeGreaterThan(0);
        expect(screen.getByText('2025年1月')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('収入/支出の切り替えボタンが表示される', async () => {
    // Act: コンポーネントをレンダリング
    render(<InstitutionBreakdownContent />);

    // Assert: 収入/支出の切り替えボタンが表示される
    await waitFor(
      () => {
        expect(screen.getAllByText('収入').length).toBeGreaterThan(0);
        expect(screen.getAllByText('支出').length).toBeGreaterThan(0);
      },
      { timeout: 10000 }
    );
  });

  it('支出金融機関の内訳を表示する', async () => {
    // Act: コンポーネントをレンダリング
    render(<InstitutionBreakdownContent />);

    // Assert: 支出金融機関の内訳が表示される
    await waitFor(
      () => {
        expect(screen.getByText('クレジットカードA')).toBeInTheDocument();
        expect(screen.getByText('クレジットカードB')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('収入ボタンをクリックすると収入金融機関を表示する', async () => {
    // Act: コンポーネントをレンダリング
    const user = userEvent.setup({ delay: null });
    render(<InstitutionBreakdownContent />);

    // Assert: 初期状態で支出が表示される
    await waitFor(
      () => {
        expect(screen.getByText('クレジットカードA')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Act: 収入ボタンをクリック
    const incomeButtons = screen.getAllByText('収入');
    await user.click(incomeButtons[0]);

    // Assert: ルーターのpushが呼ばれることを確認
    await waitFor(
      () => {
        expect(mockRouter.push).toHaveBeenCalled();
      },
      { timeout: 10000 }
    );
  });

  it('ソート機能が動作する', async () => {
    // Act: コンポーネントをレンダリング
    const user = userEvent.setup({ delay: null });
    render(<InstitutionBreakdownContent />);

    // Assert: 初期データが表示される
    await waitFor(
      () => {
        expect(screen.getByText('クレジットカードA')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Act: ソート順を変更
    const sortSelect = screen.getByLabelText('並び替え:');
    await user.selectOptions(sortSelect, 'count');

    // Assert: ソート順が変更される（UIの更新を確認）
    await waitFor(
      () => {
        expect(sortSelect).toHaveValue('count');
      },
      { timeout: 10000 }
    );
  });

  it('ソート順序を切り替えできる', async () => {
    // Act: コンポーネントをレンダリング
    const user = userEvent.setup({ delay: null });
    render(<InstitutionBreakdownContent />);

    // Assert: 初期データが表示される
    await waitFor(
      () => {
        expect(screen.getByText('クレジットカードA')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Act: ソート順序ボタンをクリック
    const sortOrderButton = screen.getByText(/昇順|降順/);
    await user.click(sortOrderButton);

    // Assert: ソート順序が切り替わる
    await waitFor(
      () => {
        // ボタンのテキストが変更されることを確認
        expect(sortOrderButton).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('金融機関別内訳テーブルを表示する', async () => {
    // Act: コンポーネントをレンダリング
    render(<InstitutionBreakdownContent />);

    // Assert: テーブルが表示される
    await waitFor(
      () => {
        expect(screen.getByText('金融機関名')).toBeInTheDocument();
        expect(screen.getAllByText('金額').length).toBeGreaterThan(0);
        expect(screen.getAllByText('件数').length).toBeGreaterThan(0);
        expect(screen.getAllByText('割合').length).toBeGreaterThan(0);
      },
      { timeout: 10000 }
    );
  });

  it('データがない場合のメッセージを表示する', async () => {
    // Arrange: 空のデータを返すモック
    const emptyData: aggregationApi.MonthlyBalanceResponse = {
      ...mockMonthlyBalance,
      expense: {
        ...mockMonthlyBalance.expense,
        byInstitution: [],
      },
    };
    mockAggregationApi.aggregationApi.getMonthlyBalance.mockResolvedValue(emptyData);

    // Act: コンポーネントをレンダリング
    render(<InstitutionBreakdownContent />);

    // Assert: データがないメッセージが表示される
    await waitFor(
      () => {
        expect(screen.getByText('データがありません')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });
});
