import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SubcategorySelector } from '../SubcategorySelector';
import { CategoryType, Subcategory } from '@account-book/types';
import { useSubcategoryStore } from '@/stores/subcategory.store';

// モックの設定
jest.mock('@/stores/subcategory.store');

const mockUseSubcategoryStore = useSubcategoryStore as jest.MockedFunction<
  typeof useSubcategoryStore
>;

describe('SubcategorySelector', () => {
  const mockOnSelect = jest.fn();
  const mockFetchSubcategories = jest.fn();

  const mockSubcategories: Subcategory[] = [
    {
      id: 'sub-1',
      categoryType: CategoryType.EXPENSE,
      name: '食費',
      parentId: null,
      displayOrder: 1,
      icon: '🍔',
      color: '#FF0000',
      isDefault: false,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'sub-2',
      categoryType: CategoryType.EXPENSE,
      name: 'ランチ',
      parentId: 'sub-1',
      displayOrder: 1,
      icon: '🍱',
      color: null,
      isDefault: false,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'sub-3',
      categoryType: CategoryType.EXPENSE,
      name: '交通費',
      parentId: null,
      displayOrder: 2,
      icon: '🚃',
      color: '#0000FF',
      isDefault: false,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSubcategoryStore.mockReturnValue({
      subcategories: mockSubcategories,
      isLoading: false,
      error: null,
      fetchSubcategories: mockFetchSubcategories,
      getSubcategoryById: (id: string) => mockSubcategories.find((sub) => sub.id === id),
      getChildrenByParentId: (parentId: string | null) =>
        mockSubcategories.filter((sub) => sub.parentId === parentId),
      getSubcategoriesByCategory: (categoryType: CategoryType) =>
        mockSubcategories.filter((sub) => sub.categoryType === categoryType && sub.isActive),
      buildTree: (categoryType?: CategoryType) => {
        const filtered = categoryType
          ? mockSubcategories.filter((sub) => sub.categoryType === categoryType && sub.isActive)
          : mockSubcategories.filter((sub) => sub.isActive);
        const rootCategories = filtered.filter((sub) => sub.parentId === null);
        return rootCategories.map((root) => ({
          ...root,
          children: filtered.filter((sub) => sub.parentId === root.id),
        }));
      },
    });
  });

  describe('レンダリング', () => {
    it('コンポーネントが正しくレンダリングされる', () => {
      render(<SubcategorySelector categoryType={CategoryType.EXPENSE} onSelect={mockOnSelect} />);

      expect(screen.getByPlaceholderText('サブカテゴリを検索...')).toBeInTheDocument();
    });

    it('読み込み中の場合、読み込みメッセージが表示される', () => {
      mockUseSubcategoryStore.mockReturnValue({
        subcategories: [],
        isLoading: true,
        error: null,
        fetchSubcategories: mockFetchSubcategories,
        getSubcategoryById: () => undefined,
        getChildrenByParentId: () => [],
        getSubcategoriesByCategory: () => [],
        buildTree: () => [],
      });

      render(<SubcategorySelector categoryType={CategoryType.EXPENSE} onSelect={mockOnSelect} />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('サブカテゴリがない場合、メッセージが表示される', () => {
      mockUseSubcategoryStore.mockReturnValue({
        subcategories: [],
        isLoading: false,
        error: null,
        fetchSubcategories: mockFetchSubcategories,
        getSubcategoryById: () => undefined,
        getChildrenByParentId: () => [],
        getSubcategoriesByCategory: () => [],
        buildTree: () => [],
      });

      render(<SubcategorySelector categoryType={CategoryType.EXPENSE} onSelect={mockOnSelect} />);

      expect(screen.getByText('サブカテゴリが見つかりません')).toBeInTheDocument();
    });
  });

  describe('階層構造の表示', () => {
    it('親サブカテゴリが表示される', () => {
      render(<SubcategorySelector categoryType={CategoryType.EXPENSE} onSelect={mockOnSelect} />);

      expect(screen.getByText('食費')).toBeInTheDocument();
      expect(screen.getByText('交通費')).toBeInTheDocument();
    });

    it('子サブカテゴリが展開ボタンと共に表示される', () => {
      render(<SubcategorySelector categoryType={CategoryType.EXPENSE} onSelect={mockOnSelect} />);

      const expandButton = screen.getByLabelText('展開する');
      expect(expandButton).toBeInTheDocument();
    });

    it('展開ボタンをクリックすると子サブカテゴリが表示される', async () => {
      render(<SubcategorySelector categoryType={CategoryType.EXPENSE} onSelect={mockOnSelect} />);

      const expandButton = screen.getByLabelText('展開する');
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('ランチ')).toBeInTheDocument();
      });
    });
  });

  describe('選択動作', () => {
    it('サブカテゴリをクリックするとonSelectが呼ばれる', () => {
      render(<SubcategorySelector categoryType={CategoryType.EXPENSE} onSelect={mockOnSelect} />);

      const categoryItem = screen.getByText('食費');
      fireEvent.click(categoryItem);

      expect(mockOnSelect).toHaveBeenCalledWith('sub-1');
    });

    it('選択されたサブカテゴリがハイライトされる', () => {
      render(
        <SubcategorySelector
          categoryType={CategoryType.EXPENSE}
          selectedSubcategoryId="sub-1"
          onSelect={mockOnSelect}
        />
      );

      const categoryItem = screen.getByText('食費').closest('div');
      expect(categoryItem).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('disabledの場合、クリックしてもonSelectが呼ばれない', () => {
      render(
        <SubcategorySelector
          categoryType={CategoryType.EXPENSE}
          onSelect={mockOnSelect}
          disabled={true}
        />
      );

      const categoryItem = screen.getByText('食費');
      fireEvent.click(categoryItem);

      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('検索機能', () => {
    it('検索ボックスに入力すると、フィルタリングされる', async () => {
      render(<SubcategorySelector categoryType={CategoryType.EXPENSE} onSelect={mockOnSelect} />);

      const searchBox = screen.getByPlaceholderText('サブカテゴリを検索...');
      fireEvent.change(searchBox, { target: { value: '食' } });

      await waitFor(() => {
        expect(screen.getByText('食費')).toBeInTheDocument();
        expect(screen.queryByText('交通費')).not.toBeInTheDocument();
      });
    });

    it('検索結果が空の場合、メッセージが表示される', async () => {
      render(<SubcategorySelector categoryType={CategoryType.EXPENSE} onSelect={mockOnSelect} />);

      const searchBox = screen.getByPlaceholderText('サブカテゴリを検索...');
      fireEvent.change(searchBox, { target: { value: '存在しない' } });

      await waitFor(() => {
        expect(screen.getByText('サブカテゴリが見つかりません')).toBeInTheDocument();
      });
    });
  });

  describe('アイコン・カラー表示', () => {
    it('アイコンが表示される', () => {
      render(<SubcategorySelector categoryType={CategoryType.EXPENSE} onSelect={mockOnSelect} />);

      expect(screen.getByText('🍔')).toBeInTheDocument();
      expect(screen.getByText('🚃')).toBeInTheDocument();
    });

    it('カラーが表示される', () => {
      render(<SubcategorySelector categoryType={CategoryType.EXPENSE} onSelect={mockOnSelect} />);

      const colorIndicator = screen
        .getByText('食費')
        .closest('div')
        ?.querySelector('span[style*="background-color"]');
      expect(colorIndicator).toBeInTheDocument();
    });
  });

  describe('キーボード操作', () => {
    it('Enterキーでサブカテゴリを選択できる', () => {
      render(<SubcategorySelector categoryType={CategoryType.EXPENSE} onSelect={mockOnSelect} />);

      const categoryItem = screen.getByText('食費');
      fireEvent.keyDown(categoryItem, { key: 'Enter' });

      expect(mockOnSelect).toHaveBeenCalledWith('sub-1');
    });

    it('Spaceキーでサブカテゴリを選択できる', () => {
      render(<SubcategorySelector categoryType={CategoryType.EXPENSE} onSelect={mockOnSelect} />);

      const categoryItem = screen.getByText('食費');
      fireEvent.keyDown(categoryItem, { key: ' ' });

      expect(mockOnSelect).toHaveBeenCalledWith('sub-1');
    });

    it('disabledの場合、キーボード操作が無効になる', () => {
      render(
        <SubcategorySelector
          categoryType={CategoryType.EXPENSE}
          onSelect={mockOnSelect}
          disabled={true}
        />
      );

      const categoryItem = screen.getByText('食費');
      fireEvent.keyDown(categoryItem, { key: 'Enter' });

      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });
});
