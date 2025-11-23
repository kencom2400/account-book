import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TransactionList } from '../TransactionList';
import { Transaction, CategoryType, TransactionStatus } from '@account-book/types';
import { updateTransactionCategory } from '@/lib/api/transactions';
import { getCategories } from '@/lib/api/categories';

// モックの設定
jest.mock('@/lib/api/transactions');
jest.mock('@/lib/api/categories');

const mockUpdateTransactionCategory = updateTransactionCategory as jest.MockedFunction<
  typeof updateTransactionCategory
>;
const mockGetCategories = getCategories as jest.MockedFunction<typeof getCategories>;

describe('TransactionList', () => {
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
  ];

  const mockCategories = [
    { id: 'cat-food', name: '食費', type: CategoryType.EXPENSE, isSystemDefined: true, order: 1 },
    {
      id: 'cat-transport',
      name: '交通費',
      type: CategoryType.EXPENSE,
      isSystemDefined: true,
      order: 2,
    },
    {
      id: 'cat-salary',
      name: '給与',
      type: CategoryType.INCOME,
      isSystemDefined: true,
      order: 3,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCategories.mockResolvedValue(mockCategories);
  });

  it('取引一覧を正しく表示する', async () => {
    render(<TransactionList transactions={mockTransactions} />);

    await waitFor(() => {
      expect(screen.getByText('ランチ')).toBeInTheDocument();
      expect(screen.getByText('月給')).toBeInTheDocument();
      expect(screen.getByText('食費')).toBeInTheDocument();
      expect(screen.getByText('給与')).toBeInTheDocument();
    });
  });

  it('金額を正しいフォーマットで表示する', async () => {
    render(<TransactionList transactions={mockTransactions} />);

    await waitFor(() => {
      // 支出は「-」付き
      expect(screen.getByText('-¥1,000')).toBeInTheDocument();
      // 収入は「+」付き
      expect(screen.getByText('+¥50,000')).toBeInTheDocument();
    });
  });

  it('カテゴリクリックで編集モードになる', async () => {
    render(<TransactionList transactions={mockTransactions} />);

    await waitFor(() => {
      expect(screen.getByText('食費')).toBeInTheDocument();
    });

    const categoryButton = screen.getByText('食費');
    fireEvent.click(categoryButton);

    await waitFor(() => {
      // セレクトボックスが表示される
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      // キャンセルボタンが表示される
      expect(screen.getByText('キャンセル')).toBeInTheDocument();
    });
  });

  it('カテゴリを変更できる', async () => {
    const updatedTransaction: Transaction = {
      ...mockTransactions[0],
      category: {
        id: 'cat-transport',
        name: '交通費',
        type: CategoryType.EXPENSE,
      },
    };

    mockUpdateTransactionCategory.mockResolvedValue(updatedTransaction);

    const onTransactionUpdate = jest.fn();
    render(
      <TransactionList transactions={mockTransactions} onTransactionUpdate={onTransactionUpdate} />
    );

    await waitFor(() => {
      expect(screen.getByText('食費')).toBeInTheDocument();
    });

    // カテゴリをクリックして編集モードに
    const categoryButton = screen.getByText('食費');
    fireEvent.click(categoryButton);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    // カテゴリを変更
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'cat-transport' } });

    await waitFor(() => {
      expect(mockUpdateTransactionCategory).toHaveBeenCalledWith('tx-1', {
        id: 'cat-transport',
        name: '交通費',
        type: CategoryType.EXPENSE,
      });
      expect(onTransactionUpdate).toHaveBeenCalledWith(updatedTransaction);
    });
  });

  it('編集をキャンセルできる', async () => {
    render(<TransactionList transactions={mockTransactions} />);

    await waitFor(() => {
      expect(screen.getByText('食費')).toBeInTheDocument();
    });

    // カテゴリをクリックして編集モードに
    const categoryButton = screen.getByText('食費');
    fireEvent.click(categoryButton);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    // キャンセルボタンをクリック
    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      // セレクトボックスが消える
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      // 元のカテゴリ名が表示される
      expect(screen.getByText('食費')).toBeInTheDocument();
    });
  });

  it('カテゴリ更新エラーを表示する', async () => {
    mockUpdateTransactionCategory.mockRejectedValue(new Error('更新失敗'));

    render(<TransactionList transactions={mockTransactions} />);

    await waitFor(() => {
      expect(screen.getByText('食費')).toBeInTheDocument();
    });

    // カテゴリをクリックして編集モードに
    const categoryButton = screen.getByText('食費');
    fireEvent.click(categoryButton);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    // カテゴリを変更
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'cat-transport' } });

    await waitFor(() => {
      expect(screen.getByText('カテゴリの更新に失敗しました')).toBeInTheDocument();
    });
  });

  it('取引がない場合はメッセージを表示する', () => {
    render(<TransactionList transactions={[]} />);

    expect(screen.getByText('取引データがありません')).toBeInTheDocument();
  });

  it('照合ステータスを正しく表示する', async () => {
    render(<TransactionList transactions={mockTransactions} />);

    await waitFor(() => {
      // 未照合
      expect(screen.getByText('未照合')).toBeInTheDocument();
      // 照合済
      expect(screen.getByText('照合済')).toBeInTheDocument();
    });
  });
});
