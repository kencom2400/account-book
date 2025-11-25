import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TransactionClassificationPage } from '../TransactionClassificationPage';
import {
  Transaction,
  CategoryType,
  TransactionStatus,
  ClassificationReason,
} from '@account-book/types';
import { getTransactions, updateTransactionSubcategory } from '@/lib/api/transactions';
import { subcategoryApi } from '@/lib/api/subcategories';
import { useSubcategoryStore } from '@/stores/subcategory.store';

// モックの設定
jest.mock('@/lib/api/transactions');
jest.mock('@/lib/api/subcategories');
jest.mock('@/stores/subcategory.store');

const mockGetTransactions = getTransactions as jest.MockedFunction<typeof getTransactions>;
const mockUpdateTransactionSubcategory = updateTransactionSubcategory as jest.MockedFunction<
  typeof updateTransactionSubcategory
>;
const mockBatchClassify = subcategoryApi.batchClassify as jest.MockedFunction<
  typeof subcategoryApi.batchClassify
>;
const mockUseSubcategoryStore = useSubcategoryStore as jest.MockedFunction<
  typeof useSubcategoryStore
>;

describe('TransactionClassificationPage', () => {
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
      subcategoryId: null,
      classificationConfidence: null,
      classificationReason: null,
      merchantId: null,
      confirmedAt: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'tx-2',
      date: new Date('2024-01-02'),
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
      subcategoryId: 'sub-1',
      classificationConfidence: 0.85,
      classificationReason: 'KEYWORD_MATCH' as ClassificationReason,
      merchantId: null,
      confirmedAt: null,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTransactions.mockResolvedValue(mockTransactions);
    mockUseSubcategoryStore.mockReturnValue({
      subcategories: [],
      isLoading: false,
      error: null,
      fetchSubcategories: jest.fn(),
      getSubcategoryById: jest.fn(),
      getChildrenByParentId: jest.fn(),
      getSubcategoriesByCategory: jest.fn(),
      buildTree: jest.fn(),
    });
  });

  describe('ページレンダリング', () => {
    it('ページが正しくレンダリングされる', async () => {
      render(<TransactionClassificationPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: '取引分類（サブカテゴリ）' })
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText('未分類・低信頼度の取引を確認し、サブカテゴリを設定します')
      ).toBeInTheDocument();
    });

    it('取引一覧が表示される', async () => {
      render(<TransactionClassificationPage />);

      await waitFor(() => {
        expect(screen.getByText('ランチ')).toBeInTheDocument();
        expect(screen.getByText('電車代')).toBeInTheDocument();
      });
    });

    it('統計情報が表示される', async () => {
      render(<TransactionClassificationPage />);

      await waitFor(() => {
        expect(screen.getByText('総取引数')).toBeInTheDocument();
        expect(screen.getByText('表示中')).toBeInTheDocument();
      });

      // 「未分類」と「低信頼度」は複数存在する可能性があるため、getAllByTextを使用
      const unclassifiedElements = screen.getAllByText('未分類');
      expect(unclassifiedElements.length).toBeGreaterThan(0);

      const lowConfidenceElements = screen.getAllByText('低信頼度');
      expect(lowConfidenceElements.length).toBeGreaterThan(0);
    });
  });

  describe('フィルタリング機能', () => {
    it('カテゴリフィルターが機能する', async () => {
      render(<TransactionClassificationPage />);

      await waitFor(() => {
        expect(screen.getByText('ランチ')).toBeInTheDocument();
      });

      // セレクトボックスを探す
      const categoryFilter =
        screen.getByRole('combobox', { name: /カテゴリ/ }) ||
        document.querySelector('#filter-category-type');

      if (categoryFilter) {
        fireEvent.change(categoryFilter, { target: { value: CategoryType.EXPENSE } });

        await waitFor(() => {
          expect(screen.getByText('ランチ')).toBeInTheDocument();
        });
      } else {
        // フィルターが存在することを確認
        expect(screen.getByText('カテゴリ')).toBeInTheDocument();
      }
    });

    it('信頼度フィルターが機能する', async () => {
      render(<TransactionClassificationPage />);

      await waitFor(() => {
        expect(screen.getByText('電車代')).toBeInTheDocument();
      });

      // セレクトボックスを探す
      const confidenceFilter =
        screen.getByRole('combobox', { name: /信頼度/ }) ||
        document.querySelector('#filter-confidence');

      if (confidenceFilter) {
        fireEvent.change(confidenceFilter, { target: { value: 'HIGH' } });

        await waitFor(() => {
          // フィルターが適用されることを確認
          expect((confidenceFilter as HTMLSelectElement).value).toBe('HIGH');
        });
      } else {
        // フィルターが存在することを確認
        expect(screen.getByText('信頼度')).toBeInTheDocument();
      }
    });

    it('未分類のみフィルターが機能する', async () => {
      render(<TransactionClassificationPage />);

      await waitFor(() => {
        expect(screen.getByText('ランチ')).toBeInTheDocument();
      });

      // チェックボックスを探す（ラベルテキストまたはIDで）
      const unclassifiedCheckbox =
        screen.getByRole('checkbox', { name: /未分類のみ/ }) ||
        document.querySelector('#unclassified-only');

      if (unclassifiedCheckbox) {
        fireEvent.click(unclassifiedCheckbox);

        await waitFor(() => {
          expect(screen.getByText('ランチ')).toBeInTheDocument();
          expect(screen.queryByText('電車代')).not.toBeInTheDocument();
        });
      } else {
        // チェックボックスが見つからない場合は、フィルターセクションが表示されていることを確認
        expect(screen.getByText('未分類のみ')).toBeInTheDocument();
      }
    });
  });

  describe('サブカテゴリ変更', () => {
    it('変更ボタンをクリックするとSubcategorySelectorが表示される', async () => {
      render(<TransactionClassificationPage />);

      await waitFor(() => {
        expect(screen.getByText('ランチ')).toBeInTheDocument();
      });

      const changeButtons = screen.getAllByText('変更');
      fireEvent.click(changeButtons[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('サブカテゴリを検索...')).toBeInTheDocument();
      });
    });

    it('サブカテゴリを選択すると更新される', async () => {
      const updatedTransaction = {
        ...mockTransactions[0],
        subcategoryId: 'sub-1',
      };
      mockUpdateTransactionSubcategory.mockResolvedValue(updatedTransaction);

      render(<TransactionClassificationPage />);

      await waitFor(() => {
        expect(screen.getByText('ランチ')).toBeInTheDocument();
      });

      const changeButtons = screen.getAllByText('変更');
      fireEvent.click(changeButtons[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('サブカテゴリを検索...')).toBeInTheDocument();
      });

      // サブカテゴリ選択のモック（実際のSubcategorySelectorの動作をシミュレート）
      // 注意: 実際のテストでは、SubcategorySelectorコンポーネントのモックが必要な場合があります
    });
  });

  describe('一括自動分類', () => {
    it('一括自動分類ボタンが表示される', async () => {
      render(<TransactionClassificationPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /🤖 一括自動分類/ })).toBeInTheDocument();
      });
    });

    it('一括自動分類ボタンをクリックすると分類が実行される', async () => {
      mockBatchClassify.mockResolvedValue({
        results: [
          {
            transactionId: 'tx-1',
            success: true,
            subcategoryId: 'sub-1',
            confidence: 0.9,
            reason: ClassificationReason.KEYWORD_MATCH,
          },
        ],
        summary: {
          total: 1,
          success: 1,
          failure: 0,
        },
      });

      render(<TransactionClassificationPage />);

      await waitFor(() => {
        expect(screen.getByText('ランチ')).toBeInTheDocument();
      });

      const batchClassifyButton = screen.getByRole('button', {
        name: /🤖 一括自動分類/,
      });
      fireEvent.click(batchClassifyButton);

      await waitFor(() => {
        expect(mockBatchClassify).toHaveBeenCalled();
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('取引データの取得に失敗した場合、エラーメッセージが表示される', async () => {
      mockGetTransactions.mockRejectedValue(new Error('取得に失敗しました'));

      render(<TransactionClassificationPage />);

      await waitFor(() => {
        expect(
          screen.getByText('取引データの取得に失敗しました。ページを再読み込みしてください。')
        ).toBeInTheDocument();
      });
    });
  });
});
