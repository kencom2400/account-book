/**
 * Yearly Balance Report Page Tests
 * FR-020: 年間収支推移表示
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { YearlyBalanceReportContent } from '../YearlyBalanceReportContent';
import * as aggregationApi from '@/lib/api/aggregation';

// モック
jest.mock('@/lib/api/aggregation');

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  pathname: '/aggregation/yearly-balance',
  query: {},
  asPath: '/aggregation/yearly-balance',
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams('year=2025'),
}));

const mockAggregationApi = aggregationApi as jest.Mocked<typeof aggregationApi>;

describe('YearlyBalanceReportPage', () => {
  // テスト全体のタイムアウトを30秒に設定
  jest.setTimeout(30000);

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
          count: 10,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        balance: 200000,
        savingsRate: 40,
      },
      {
        month: '2025-02',
        income: {
          total: 500000,
          count: 5,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        expense: {
          total: 280000,
          count: 8,
          byCategory: [],
          byInstitution: [],
          transactions: [],
        },
        balance: 220000,
        savingsRate: 44,
      },
    ],
    annual: {
      totalIncome: 6000000,
      totalExpense: 3480000,
      totalBalance: 2520000,
      averageIncome: 500000,
      averageExpense: 290000,
      savingsRate: 42,
    },
    trend: {
      incomeProgression: {
        direction: 'stable',
        changeRate: 0,
        standardDeviation: 0,
      },
      expenseProgression: {
        direction: 'decreasing',
        changeRate: -1.5,
        standardDeviation: 15000,
      },
      balanceProgression: {
        direction: 'increasing',
        changeRate: 2.0,
        standardDeviation: 10000,
      },
    },
    highlights: {
      maxIncomeMonth: '2025-06',
      maxExpenseMonth: '2025-12',
      bestBalanceMonth: '2025-06',
      worstBalanceMonth: '2025-12',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.replace.mockClear();
    mockAggregationApi.aggregationApi.getYearlyBalance.mockResolvedValue(mockYearlyBalance);
  });

  it('ローディング状態を表示する', () => {
    // Arrange: モックを遅延させる
    mockAggregationApi.aggregationApi.getYearlyBalance.mockImplementation(
      () => new Promise(() => {}) // 解決しないPromise
    );

    // Act: コンポーネントをレンダリング
    render(<YearlyBalanceReportContent />);

    // Assert: ローディングメッセージが表示される
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('エラー状態を表示し、再試行できる', async () => {
    // Arrange: エラーを返すモック
    mockAggregationApi.aggregationApi.getYearlyBalance.mockRejectedValue(new Error('API Error'));

    // Act: コンポーネントをレンダリング
    render(<YearlyBalanceReportContent />);

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
        expect(mockAggregationApi.aggregationApi.getYearlyBalance).toHaveBeenCalledTimes(2);
      },
      { timeout: 10000 }
    );
  }, 30000);

  it('データがない場合のメッセージを表示する', async () => {
    // Arrange: nullを返すモック
    mockAggregationApi.aggregationApi.getYearlyBalance.mockResolvedValue(null as never);

    // Act: コンポーネントをレンダリング
    render(<YearlyBalanceReportContent />);

    // Assert: データがないメッセージが表示される
    await waitFor(
      () => {
        expect(screen.getByText('データがありません')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  }, 30000);

  it('年次レポートのコンテンツを表示する', async () => {
    // Act: コンポーネントをレンダリング
    render(<YearlyBalanceReportContent />);

    // Assert: 主要な要素が表示される
    await waitFor(
      () => {
        expect(screen.getByText('年次収支レポート')).toBeInTheDocument();
        expect(screen.getByText('年間収入合計')).toBeInTheDocument();
        expect(screen.getByText('年間支出合計')).toBeInTheDocument();
        expect(screen.getByText('年間収支')).toBeInTheDocument();
        expect(screen.getByText('年間貯蓄率')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  }, 30000);

  it('年間サマリーカードに正しい値を表示する', async () => {
    // Act: コンポーネントをレンダリング
    render(<YearlyBalanceReportContent />);

    // Assert: 年間サマリーカードに正しい値が表示される
    await waitFor(
      () => {
        // formatCurrencyはIntl.NumberFormatを使用するため、実際の表示形式を確認
        // 例: "¥6,000,000" または "￥6,000,000" または "6,000,000円"
        expect(screen.getAllByText(/6[,，]000[,，]000/).length).toBeGreaterThan(0); // 年間収入合計
        expect(screen.getAllByText(/3[,，]480[,，]000/).length).toBeGreaterThan(0); // 年間支出合計
        expect(screen.getAllByText(/2[,，]520[,，]000/).length).toBeGreaterThan(0); // 年間収支
        expect(screen.getByText('42.00%')).toBeInTheDocument(); // 年間貯蓄率
      },
      { timeout: 10000 }
    );
  }, 30000);

  it('トレンド分析セクションを表示する', async () => {
    // Act: コンポーネントをレンダリング
    render(<YearlyBalanceReportContent />);

    // Assert: トレンド分析セクションが表示される
    await waitFor(
      () => {
        expect(screen.getByText('トレンド分析')).toBeInTheDocument();
        expect(screen.getByText('収入')).toBeInTheDocument();
        expect(screen.getByText('支出')).toBeInTheDocument();
        expect(screen.getByText('収支')).toBeInTheDocument();
        expect(screen.getByText('横ばい')).toBeInTheDocument(); // 収入のトレンド
        expect(screen.getByText('減少傾向')).toBeInTheDocument(); // 支出のトレンド
        expect(screen.getByText('増加傾向')).toBeInTheDocument(); // 収支のトレンド
      },
      { timeout: 10000 }
    );
  }, 30000);

  it('ハイライト情報セクションを表示する', async () => {
    // Act: コンポーネントをレンダリング
    render(<YearlyBalanceReportContent />);

    // Assert: ハイライト情報セクションが表示される
    await waitFor(
      () => {
        expect(screen.getByText('ハイライト情報')).toBeInTheDocument();
        expect(screen.getByText('最大収入月')).toBeInTheDocument();
        expect(screen.getByText('最大支出月')).toBeInTheDocument();
        expect(screen.getByText('最高収支月')).toBeInTheDocument();
        expect(screen.getByText('最低収支月')).toBeInTheDocument();
        // 6月は複数箇所に表示されるため、getAllByTextを使用
        const juneElements = screen.getAllByText('6月');
        expect(juneElements.length).toBeGreaterThan(0); // 最大収入月と最高収支月
        // 12月も複数箇所に表示されるため、getAllByTextを使用
        const decemberElements = screen.getAllByText('12月');
        expect(decemberElements.length).toBeGreaterThan(0); // 最大支出月と最低収支月
      },
      { timeout: 10000 }
    );
  }, 30000);

  it('前年ボタンをクリックすると前年のデータを取得する', async () => {
    // Act: コンポーネントをレンダリング
    const user = userEvent.setup({ delay: null });
    render(<YearlyBalanceReportContent />);

    // Assert: 初期データが取得される
    await waitFor(
      () => {
        expect(mockAggregationApi.aggregationApi.getYearlyBalance).toHaveBeenCalledWith(2025);
        expect(screen.getByText('年次収支レポート')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Act: 前年ボタンをクリック
    const previousButton = screen.getByLabelText('前年');
    await user.click(previousButton);

    // Assert: 前年（2024年）のデータが取得される
    await waitFor(
      () => {
        expect(mockAggregationApi.aggregationApi.getYearlyBalance).toHaveBeenCalledWith(2024);
      },
      { timeout: 10000 }
    );
  });

  it('次年ボタンをクリックすると次の年のデータを取得する', async () => {
    // Act: コンポーネントをレンダリング
    const user = userEvent.setup({ delay: null });
    render(<YearlyBalanceReportContent />);

    // Assert: 初期データが取得される
    await waitFor(
      () => {
        expect(mockAggregationApi.aggregationApi.getYearlyBalance).toHaveBeenCalledWith(2025);
      },
      { timeout: 10000 }
    );

    // Act: 次年ボタンをクリック
    const nextButton = screen.getByLabelText('次年');
    await user.click(nextButton);

    // Assert: 次年（2026年）のデータが取得される
    await waitFor(
      () => {
        expect(mockAggregationApi.aggregationApi.getYearlyBalance).toHaveBeenCalledWith(2026);
      },
      { timeout: 10000 }
    );
  });

  it('年選択ボタンをクリックするとモーダルが表示される', async () => {
    // Act: コンポーネントをレンダリング
    const user = userEvent.setup({ delay: null });
    render(<YearlyBalanceReportContent />);

    // Assert: 初期データが取得される
    await waitFor(
      () => {
        expect(screen.getByText('年次収支レポート')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Act: 年選択ボタンをクリック
    const yearButton = screen.getByText(/2025年/);
    await user.click(yearButton);

    // Assert: モーダルが表示される
    await waitFor(
      () => {
        expect(screen.getByText('年を選択')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }, 15000);

  it('モーダルで年を選択できる', async () => {
    // Act: コンポーネントをレンダリング
    const user = userEvent.setup({ delay: null });
    render(<YearlyBalanceReportContent />);

    // Assert: 初期データが取得される
    await waitFor(
      () => {
        expect(screen.getByText('年次収支レポート')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Act: 年選択ボタンをクリック
    const yearButton = screen.getByText(/2025年/);
    await user.click(yearButton);

    // Assert: モーダルが表示される
    await waitFor(
      () => {
        expect(screen.getByText('年を選択')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Act: 2024年を選択
    const yearSelect = screen.getByLabelText('年');
    await user.selectOptions(yearSelect, '2024');

    // Act: 選択ボタンをクリック
    const selectButton = screen.getByText('選択');
    await user.click(selectButton);

    // Assert: 2024年のデータが取得される
    await waitFor(
      () => {
        expect(mockAggregationApi.aggregationApi.getYearlyBalance).toHaveBeenCalledWith(2024);
      },
      { timeout: 5000 }
    );
  }, 15000);

  it('モーダルをキャンセルできる', async () => {
    // Act: コンポーネントをレンダリング
    const user = userEvent.setup({ delay: null });
    render(<YearlyBalanceReportContent />);

    // Assert: 初期データが取得される
    await waitFor(
      () => {
        expect(screen.getByText('年次収支レポート')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Act: 年選択ボタンをクリック
    const yearButton = screen.getByText(/2025年/);
    await user.click(yearButton);

    // Assert: モーダルが表示される
    await waitFor(
      () => {
        expect(screen.getByText('年を選択')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Act: キャンセルボタンをクリック
    const cancelButton = screen.getByText('キャンセル');
    await user.click(cancelButton);

    // Assert: モーダルが閉じられる
    await waitFor(
      () => {
        expect(screen.queryByText('年を選択')).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  }, 15000);
});
