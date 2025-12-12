/**
 * Transaction Detail Page Tests
 * Issue #109: [TASK] E-3: 取引詳細画面の実装
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TransactionDetailPage from '../page';
import * as transactionsApi from '@/lib/api/transactions';
import * as subcategoryStore from '@/stores/subcategory.store';
import { Transaction, CategoryType, TransactionStatus } from '@account-book/types';

// モック
jest.mock('@/lib/api/transactions');
jest.mock('@/stores/subcategory.store');
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));
jest.mock('next/link', () => {
  const Link = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  Link.displayName = 'Link';
  return Link;
});
jest.mock('@/components/subcategories/SubcategorySelector', () => ({
  SubcategorySelector: ({
    onSelect,
    disabled,
  }: {
    onSelect: (id: string) => void;
    disabled: boolean;
  }) => (
    <div data-testid="subcategory-selector">
      <button
        onClick={() => onSelect('subcat-1')}
        disabled={disabled}
        data-testid="select-subcategory"
      >
        サブカテゴリを選択
      </button>
    </div>
  ),
}));
jest.mock('@/components/subcategories/ClassificationBadge', () => ({
  ClassificationBadge: ({ confidence, reason }: { confidence: number; reason: string }) => (
    <div data-testid="classification-badge">
      信頼度: {Math.round(confidence * 100)}%, 理由: {reason}
    </div>
  ),
}));
jest.mock('@/components/ui/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="card-title">{children}</h2>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

const mockTransactionsApi = transactionsApi as jest.Mocked<typeof transactionsApi>;
const mockSubcategoryStore = subcategoryStore as jest.Mocked<typeof subcategoryStore>;

// useParamsのモック
const mockUseParams = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  useRouter: jest.fn(),
}));

describe('TransactionDetailPage', () => {
  const mockTransaction: Transaction = {
    id: 'tx-1',
    date: new Date('2024-01-15T10:30:00'),
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
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    subcategoryId: null,
    classificationConfidence: 0.95,
    classificationReason: 'MERCHANT_MATCH',
    merchantId: 'merchant-1',
    merchantName: 'テストレストラン',
    confirmedAt: null,
  };

  const mockSubcategory = {
    id: 'subcat-1',
    name: '外食',
    icon: '🍽️',
    categoryId: 'cat-food',
    categoryType: CategoryType.EXPENSE,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 'tx-1' });
    mockTransactionsApi.getTransactionById.mockResolvedValue(mockTransaction);
    mockSubcategoryStore.useSubcategoryStore.mockReturnValue({
      getSubcategoryById: jest.fn(() => null),
      fetchSubcategories: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('ローディング状態を表示する', () => {
    // モックを遅延させる
    mockTransactionsApi.getTransactionById.mockImplementation(
      () => new Promise(() => {}) // 解決しないPromise
    );

    render(<TransactionDetailPage />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('取引詳細情報を表示する', async () => {
    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '取引詳細' })).toBeInTheDocument();
    });

    // 主要な情報が表示されることを確認
    expect(screen.getByText('取引情報')).toBeInTheDocument();
    expect(screen.getByText('ランチ')).toBeInTheDocument();
    expect(screen.getByText(/日付/)).toBeInTheDocument();
    expect(screen.getByText(/説明/)).toBeInTheDocument();
    expect(screen.getByText(/金額/)).toBeInTheDocument();
    // カテゴリは複数箇所にあるため、最初のものを取得
    const categoryLabels = screen.getAllByText(/カテゴリ/);
    expect(categoryLabels.length).toBeGreaterThan(0);
  });

  it('取引一覧に戻るリンクを表示する', async () => {
    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('取引一覧に戻る')).toBeInTheDocument();
    });

    const backLink = screen.getByText('取引一覧に戻る');
    expect(backLink.closest('a')).toHaveAttribute('href', '/transactions');
  });

  it('エラー状態を表示する（取引が見つからない場合）', async () => {
    mockTransactionsApi.getTransactionById.mockRejectedValue(new Error('取引が見つかりません'));

    render(<TransactionDetailPage />);

    await waitFor(() => {
      // エラーメッセージが表示される（部分一致で確認）
      expect(
        screen.getByText(/取引データの取得に失敗しました|取引が見つかりません/)
      ).toBeInTheDocument();
    });

    // 再読み込みボタンが表示される
    expect(screen.getByText('再読み込み')).toBeInTheDocument();
  });

  it('取引が見つからない場合のメッセージを表示する', async () => {
    mockTransactionsApi.getTransactionById.mockResolvedValue(null as unknown as Transaction);

    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('取引が見つかりませんでした')).toBeInTheDocument();
    });

    // 取引一覧に戻るリンクが表示される
    expect(screen.getByText('取引一覧に戻る')).toBeInTheDocument();
  });

  it('サブカテゴリが未設定の場合、未分類と表示する', async () => {
    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('未分類')).toBeInTheDocument();
    });
  });

  it('サブカテゴリが設定されている場合、サブカテゴリ名を表示する', async () => {
    const transactionWithSubcategory = {
      ...mockTransaction,
      subcategoryId: 'subcat-1',
    };
    mockTransactionsApi.getTransactionById.mockResolvedValue(transactionWithSubcategory);
    mockSubcategoryStore.useSubcategoryStore.mockReturnValue({
      getSubcategoryById: jest.fn(() => mockSubcategory),
      fetchSubcategories: jest.fn().mockResolvedValue(undefined),
    });

    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('外食')).toBeInTheDocument();
    });
  });

  it('サブカテゴリの変更ボタンをクリックすると、サブカテゴリセレクターが表示される', async () => {
    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('変更')).toBeInTheDocument();
    });

    const changeButton = screen.getByText('変更');
    await userEvent.click(changeButton);

    await waitFor(() => {
      expect(screen.getByTestId('subcategory-selector')).toBeInTheDocument();
    });
  });

  it('サブカテゴリを選択すると、取引が更新される', async () => {
    const updatedTransaction = {
      ...mockTransaction,
      subcategoryId: 'subcat-1',
    };
    mockTransactionsApi.updateTransactionSubcategory.mockResolvedValue(updatedTransaction);

    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('変更')).toBeInTheDocument();
    });

    // 変更ボタンをクリック
    const changeButton = screen.getByText('変更');
    await userEvent.click(changeButton);

    // サブカテゴリを選択
    await waitFor(() => {
      expect(screen.getByTestId('select-subcategory')).toBeInTheDocument();
    });

    const selectButton = screen.getByTestId('select-subcategory');
    await userEvent.click(selectButton);

    await waitFor(() => {
      expect(mockTransactionsApi.updateTransactionSubcategory).toHaveBeenCalledWith(
        'tx-1',
        'subcat-1'
      );
    });
  });

  it('分類信頼度が表示される', async () => {
    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('classification-badge')).toBeInTheDocument();
      // 信頼度は95%として表示される
      expect(screen.getByText(/信頼度: 95%/)).toBeInTheDocument();
    });
  });

  it('店舗情報が表示される（merchantIdがある場合）', async () => {
    render(<TransactionDetailPage />);

    await waitFor(() => {
      // 店舗ラベルが表示される（最初のものを取得）
      const shopLabels = screen.getAllByText(/^店舗$/);
      expect(shopLabels.length).toBeGreaterThan(0);
      expect(screen.getByText(/店舗ID: merchant-1/)).toBeInTheDocument();
    });
  });

  it('確認日時が表示される（confirmedAtがある場合）', async () => {
    const transactionWithConfirmed = {
      ...mockTransaction,
      confirmedAt: new Date('2024-01-15T12:00:00'),
    };
    mockTransactionsApi.getTransactionById.mockResolvedValue(transactionWithConfirmed);

    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/確認日時/)).toBeInTheDocument();
    });
  });

  it('照合ステータスが表示される', async () => {
    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/照合ステータス/)).toBeInTheDocument();
      expect(screen.getByText('未照合')).toBeInTheDocument();
    });
  });

  it('照合済みの場合、照合済と表示する', async () => {
    const reconciledTransaction = {
      ...mockTransaction,
      isReconciled: true,
    };
    mockTransactionsApi.getTransactionById.mockResolvedValue(reconciledTransaction);

    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('照合済')).toBeInTheDocument();
    });
  });

  it('サブカテゴリ更新中はボタンが無効化される', async () => {
    // 更新を遅延させる
    let resolveUpdate: (value: Transaction) => void;
    const updatePromise = new Promise<Transaction>((resolve) => {
      resolveUpdate = resolve;
    });
    mockTransactionsApi.updateTransactionSubcategory.mockImplementation(() => updatePromise);

    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('変更')).toBeInTheDocument();
    });

    // 変更ボタンをクリック
    const changeButton = screen.getByText('変更');
    await userEvent.click(changeButton);

    // サブカテゴリを選択
    await waitFor(() => {
      expect(screen.getByTestId('select-subcategory')).toBeInTheDocument();
    });

    const selectButton = screen.getByTestId('select-subcategory');
    await userEvent.click(selectButton);

    // 更新中はボタンが無効化される
    await waitFor(() => {
      expect(selectButton).toBeDisabled();
    });

    // 更新を完了させる
    const updatedTransaction = {
      ...mockTransaction,
      subcategoryId: 'subcat-1',
    };
    resolveUpdate!(updatedTransaction);

    // 更新完了後、編集モードが閉じられるため、ボタンは非表示になる
    await waitFor(() => {
      expect(screen.queryByTestId('select-subcategory')).not.toBeInTheDocument();
    });
  });

  it('サブカテゴリ更新エラーを表示する', async () => {
    mockTransactionsApi.updateTransactionSubcategory.mockRejectedValue(
      new Error('更新に失敗しました')
    );

    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('変更')).toBeInTheDocument();
    });

    // 変更ボタンをクリック
    const changeButton = screen.getByText('変更');
    await userEvent.click(changeButton);

    // サブカテゴリを選択
    await waitFor(() => {
      expect(screen.getByTestId('select-subcategory')).toBeInTheDocument();
    });

    const selectButton = screen.getByTestId('select-subcategory');
    await userEvent.click(selectButton);

    await waitFor(() => {
      // エラーメッセージが表示される（部分一致で確認）
      expect(
        screen.getByText(/サブカテゴリの更新に失敗しました|更新に失敗しました/)
      ).toBeInTheDocument();
    });
  });

  it('キャンセルボタンでサブカテゴリ編集をキャンセルできる', async () => {
    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('変更')).toBeInTheDocument();
    });

    // 変更ボタンをクリック
    const changeButton = screen.getByText('変更');
    await userEvent.click(changeButton);

    // サブカテゴリセレクターが表示される
    await waitFor(() => {
      expect(screen.getByTestId('subcategory-selector')).toBeInTheDocument();
    });

    // キャンセルボタンをクリック
    const cancelButton = screen.getByText('キャンセル');
    await userEvent.click(cancelButton);

    // サブカテゴリセレクターが非表示になる
    await waitFor(() => {
      expect(screen.queryByTestId('subcategory-selector')).not.toBeInTheDocument();
    });
  });

  it('useParamsから取得したIDで取引を取得する', async () => {
    mockUseParams.mockReturnValue({ id: 'tx-2' });
    mockTransactionsApi.getTransactionById.mockResolvedValue({
      ...mockTransaction,
      id: 'tx-2',
    });

    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(mockTransactionsApi.getTransactionById).toHaveBeenCalledWith('tx-2');
    });
  });

  it('サブカテゴリ一覧を取得する', async () => {
    const fetchSubcategories = jest.fn().mockResolvedValue(undefined);
    mockSubcategoryStore.useSubcategoryStore.mockReturnValue({
      getSubcategoryById: jest.fn(() => null),
      fetchSubcategories,
    });

    render(<TransactionDetailPage />);

    await waitFor(() => {
      expect(fetchSubcategories).toHaveBeenCalledWith(CategoryType.EXPENSE);
    });
  });
});
