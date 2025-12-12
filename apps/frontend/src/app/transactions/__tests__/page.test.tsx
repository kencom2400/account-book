/**
 * Transactions Page Tests
 * Issue #108: [TASK] E-2: 取引履歴一覧画面の実装
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TransactionsPage from '../page';
import * as transactionsApi from '@/lib/api/transactions';
import * as institutionsApi from '@/lib/api/institutions';
import * as exportUtils from '@/utils/export.utils';
import {
  Transaction,
  CategoryType,
  TransactionStatus,
  Institution,
  InstitutionType,
} from '@account-book/types';

// モック
jest.mock('@/lib/api/transactions');
jest.mock('@/lib/api/institutions');
jest.mock('@/utils/export.utils');
jest.mock('@/components/transactions/TransactionList', () => ({
  TransactionList: ({ transactions }: { transactions: Transaction[] }) => (
    <div data-testid="transaction-list">
      {transactions.length === 0 ? (
        <div>取引データがありません</div>
      ) : (
        transactions.map((tx) => (
          <div key={tx.id} data-testid={`transaction-${tx.id}`}>
            {tx.description}
          </div>
        ))
      )}
    </div>
  ),
}));

const mockTransactionsApi = transactionsApi as jest.Mocked<typeof transactionsApi>;
const mockInstitutionsApi = institutionsApi as jest.Mocked<typeof institutionsApi>;
const mockExportUtils = exportUtils as jest.Mocked<typeof exportUtils>;

describe('TransactionsPage', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      date: new Date('2024-01-01'),
      amount: -1000,
      category: {
        id: 'cat-food',
        name: '食費',
        type: CategoryType.EXPENSE,
      },
      description: 'ランチ',
      institutionId: 'inst-1',
      accountId: 'acc-1',
      status: TransactionStatus.COMPLETED,
      isReconciled: false,
      relatedTransactionId: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'tx-2',
      date: new Date('2024-01-02'),
      amount: 50000,
      category: {
        id: 'cat-salary',
        name: '給与',
        type: CategoryType.INCOME,
      },
      description: '月給',
      institutionId: 'inst-2',
      accountId: 'acc-2',
      status: TransactionStatus.COMPLETED,
      isReconciled: true,
      relatedTransactionId: null,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: 'tx-3',
      date: new Date('2024-01-03'),
      amount: -2000,
      category: {
        id: 'cat-transport',
        name: '交通費',
        type: CategoryType.EXPENSE,
      },
      description: '電車代',
      institutionId: 'inst-1',
      accountId: 'acc-1',
      status: TransactionStatus.COMPLETED,
      isReconciled: false,
      relatedTransactionId: null,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ];

  const mockInstitutions: Institution[] = [
    {
      id: 'inst-1',
      name: 'テスト銀行',
      type: InstitutionType.BANK,
      isConnected: true,
      credentials: {},
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'inst-2',
      name: 'テストカード',
      type: InstitutionType.CREDIT_CARD,
      isConnected: true,
      credentials: {},
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransactionsApi.getTransactions.mockResolvedValue(mockTransactions);
    mockInstitutionsApi.getInstitutions.mockResolvedValue(mockInstitutions);
    mockExportUtils.convertTransactionsToCSV.mockReturnValue('csv,content');
    mockExportUtils.convertTransactionsToJSON.mockReturnValue('{"json":"content"}');
    mockExportUtils.downloadFile.mockResolvedValue(undefined);
  });

  it('ローディング状態を表示する', () => {
    // モックを遅延させる
    mockTransactionsApi.getTransactions.mockImplementation(
      () => new Promise(() => {}) // 解決しないPromise
    );

    render(<TransactionsPage />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('エラー状態を表示する', async () => {
    mockTransactionsApi.getTransactions.mockRejectedValue(new Error('API Error'));

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(
        screen.getByText('取引データの取得に失敗しました。再読み込みしてください。')
      ).toBeInTheDocument();
      expect(screen.getByText('再読み込み')).toBeInTheDocument();
    });
  });

  it('取引一覧を表示する', async () => {
    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('取引履歴一覧')).toBeInTheDocument();
      expect(screen.getByText(/表示件数: 3件 \/ 全3件/)).toBeInTheDocument();
    });

    expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-tx-2')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-tx-3')).toBeInTheDocument();
  });

  it('金融機関一覧を取得する', async () => {
    render(<TransactionsPage />);

    await waitFor(() => {
      expect(mockInstitutionsApi.getInstitutions).toHaveBeenCalled();
    });
  });

  it('金融機関フィルタで取引を絞り込める', async () => {
    const filteredTransactions = [mockTransactions[0], mockTransactions[2]]; // inst-1のみ
    mockTransactionsApi.getTransactions.mockResolvedValue(filteredTransactions);

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('取引履歴一覧')).toBeInTheDocument();
    });

    const institutionFilter = screen.getByLabelText('金融機関');
    await userEvent.selectOptions(institutionFilter, 'inst-1');

    await waitFor(() => {
      expect(mockTransactionsApi.getTransactions).toHaveBeenCalledWith({
        institutionId: 'inst-1',
      });
    });
  });

  it('カテゴリタイプフィルタで取引を絞り込める', async () => {
    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('取引履歴一覧')).toBeInTheDocument();
    });

    const categoryTypeFilter = screen.getByLabelText('カテゴリタイプ');
    await userEvent.selectOptions(categoryTypeFilter, CategoryType.EXPENSE);

    await waitFor(() => {
      // フロントエンド側でフィルタリングされるため、APIは呼ばれない
      // フィルタリング後の取引のみが表示されることを確認
      expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-3')).toBeInTheDocument();
      expect(screen.queryByTestId('transaction-tx-2')).not.toBeInTheDocument(); // INCOMEは除外
    });
  });

  it('照合ステータスフィルタで取引を絞り込める', async () => {
    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('取引履歴一覧')).toBeInTheDocument();
    });

    const reconciledFilter = screen.getByLabelText('照合ステータス');
    await userEvent.selectOptions(reconciledFilter, 'reconciled');

    await waitFor(() => {
      // 照合済みのみ表示
      expect(screen.getByTestId('transaction-tx-2')).toBeInTheDocument();
      expect(screen.queryByTestId('transaction-tx-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('transaction-tx-3')).not.toBeInTheDocument();
    });
  });

  it('日付範囲フィルタで取引を絞り込める', async () => {
    const filteredTransactions = [mockTransactions[0]];
    mockTransactionsApi.getTransactions.mockResolvedValue(filteredTransactions);

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('取引履歴一覧')).toBeInTheDocument();
    });

    const startDateInput = screen.getByLabelText('開始日');
    const endDateInput = screen.getByLabelText('終了日');

    await userEvent.type(startDateInput, '2024-01-01');
    await userEvent.type(endDateInput, '2024-01-01');

    await waitFor(() => {
      expect(mockTransactionsApi.getTransactions).toHaveBeenCalledWith({
        startDate: '2024-01-01',
        endDate: '2024-01-01',
      });
    });
  });

  it('ソート機能が動作する', async () => {
    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('取引履歴一覧')).toBeInTheDocument();
    });

    const sortFieldSelect = screen.getByLabelText('ソート項目');
    const sortOrderSelect = screen.getByLabelText('並び順');

    // 金額でソート（昇順）
    await userEvent.selectOptions(sortFieldSelect, 'amount');
    await userEvent.selectOptions(sortOrderSelect, 'asc');

    await waitFor(() => {
      // ソート後の順序を確認（フロントエンド側でソートされる）
      // 金額の絶対値でソート: tx-1 (1000), tx-3 (2000), tx-2 (50000)
      const transactionList = screen.getByTestId('transaction-list');
      const items = within(transactionList).getAllByTestId(/transaction-/);
      expect(items).toHaveLength(3);
      expect(items[0]).toHaveAttribute('data-testid', 'transaction-tx-1');
      expect(items[1]).toHaveAttribute('data-testid', 'transaction-tx-3');
      expect(items[2]).toHaveAttribute('data-testid', 'transaction-tx-2');
    });

    // 降順に変更
    await userEvent.selectOptions(sortOrderSelect, 'desc');

    await waitFor(() => {
      const transactionList = screen.getByTestId('transaction-list');
      const items = within(transactionList).getAllByTestId(/transaction-/);
      expect(items).toHaveLength(3);
      // 降順: tx-2 (50000), tx-3 (2000), tx-1 (1000)
      expect(items[0]).toHaveAttribute('data-testid', 'transaction-tx-2');
      expect(items[1]).toHaveAttribute('data-testid', 'transaction-tx-3');
      expect(items[2]).toHaveAttribute('data-testid', 'transaction-tx-1');
    });
  });

  it('CSVエクスポート機能が動作する', async () => {
    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('取引履歴一覧')).toBeInTheDocument();
    });

    const csvExportButton = screen.getByText('CSVエクスポート');
    await userEvent.click(csvExportButton);

    await waitFor(() => {
      expect(mockExportUtils.convertTransactionsToCSV).toHaveBeenCalled();
      expect(mockExportUtils.downloadFile).toHaveBeenCalledWith(
        'csv,content',
        expect.stringMatching(/^transactions_\d{4}-\d{2}-\d{2}\.csv$/),
        'text/csv; charset=utf-8'
      );
    });
  });

  it('JSONエクスポート機能が動作する', async () => {
    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('取引履歴一覧')).toBeInTheDocument();
    });

    const jsonExportButton = screen.getByText('JSONエクスポート');
    await userEvent.click(jsonExportButton);

    await waitFor(() => {
      expect(mockExportUtils.convertTransactionsToJSON).toHaveBeenCalled();
      expect(mockExportUtils.downloadFile).toHaveBeenCalledWith(
        '{"json":"content"}',
        expect.stringMatching(/^transactions_\d{4}-\d{2}-\d{2}\.json$/),
        'application/json; charset=utf-8'
      );
    });
  });

  it('フィルターリセット機能が動作する', async () => {
    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('取引履歴一覧')).toBeInTheDocument();
    });

    // フィルターを設定
    const categoryTypeFilter = screen.getByLabelText('カテゴリタイプ');
    await userEvent.selectOptions(categoryTypeFilter, CategoryType.EXPENSE);

    await waitFor(() => {
      expect(screen.queryByTestId('transaction-tx-2')).not.toBeInTheDocument();
    });

    // リセットボタンをクリック
    const resetButton = screen.getByText('リセット');
    await userEvent.click(resetButton);

    await waitFor(() => {
      // すべての取引が表示される
      expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-2')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-3')).toBeInTheDocument();
    });
  });

  it('エクスポート時にフィルタ条件が適用される', async () => {
    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('取引履歴一覧')).toBeInTheDocument();
    });

    // カテゴリタイプフィルタを設定（支出のみ）
    const categoryTypeFilter = screen.getByLabelText('カテゴリタイプ');
    await userEvent.selectOptions(categoryTypeFilter, CategoryType.EXPENSE);

    await waitFor(() => {
      // 支出のみが表示される
      expect(screen.getByTestId('transaction-tx-1')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-tx-3')).toBeInTheDocument();
      expect(screen.queryByTestId('transaction-tx-2')).not.toBeInTheDocument();
    });

    // CSVエクスポート
    const csvExportButton = screen.getByText('CSVエクスポート');
    await userEvent.click(csvExportButton);

    await waitFor(() => {
      // フィルタリング済みのデータ（tx-1, tx-3のみ）がエクスポートされる
      expect(mockExportUtils.convertTransactionsToCSV).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'tx-1' }),
          expect.objectContaining({ id: 'tx-3' }),
        ])
      );
      expect(mockExportUtils.convertTransactionsToCSV).toHaveBeenCalledWith(
        expect.not.arrayContaining([expect.objectContaining({ id: 'tx-2' })])
      );
    });
  });

  it('取引がない場合にメッセージを表示する', async () => {
    mockTransactionsApi.getTransactions.mockResolvedValue([]);

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('取引データがありません')).toBeInTheDocument();
    });
  });

  it('エクスポート中はボタンが無効化される', async () => {
    // エクスポートを遅延させる
    let resolveDownload: () => void;
    const downloadPromise = new Promise<void>((resolve) => {
      resolveDownload = resolve;
    });
    mockExportUtils.downloadFile.mockImplementation(() => downloadPromise);

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('取引履歴一覧')).toBeInTheDocument();
    });

    const csvExportButton = screen.getByRole('button', { name: 'CSVエクスポート' });
    await userEvent.click(csvExportButton);

    // エクスポート中であることを確認
    await waitFor(() => {
      const exportButtons = screen.getAllByRole('button', { name: 'エクスポート中...' });
      expect(exportButtons.length).toBeGreaterThan(0);
      // CSVエクスポートボタン（最初のボタン）が無効化されていることを確認
      expect(exportButtons[0]).toBeDisabled();
    });

    // ダウンロードを完了させる
    resolveDownload!();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'CSVエクスポート' })).toBeInTheDocument();
    });
  });

  it('エクスポートエラーを表示する', async () => {
    mockExportUtils.downloadFile.mockImplementation(() => {
      throw new Error('Export Error');
    });

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('取引履歴一覧')).toBeInTheDocument();
    });

    const csvExportButton = screen.getByText('CSVエクスポート');
    await userEvent.click(csvExportButton);

    await waitFor(() => {
      expect(
        screen.getByText('エクスポートに失敗しました。もう一度お試しください。')
      ).toBeInTheDocument();
    });
  });

  it('再読み込みボタンが動作する', async () => {
    mockTransactionsApi.getTransactions.mockRejectedValue(new Error('API Error'));

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('再読み込み')).toBeInTheDocument();
    });

    const reloadButton = screen.getByText('再読み込み');
    mockTransactionsApi.getTransactions.mockResolvedValue(mockTransactions);
    await userEvent.click(reloadButton);

    await waitFor(() => {
      expect(mockTransactionsApi.getTransactions).toHaveBeenCalledTimes(2);
    });
  });
});
