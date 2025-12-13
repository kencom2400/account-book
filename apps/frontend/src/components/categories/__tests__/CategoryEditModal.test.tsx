/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CategoryEditModal } from '../CategoryEditModal';
import { Category, CategoryType } from '@account-book/types';
import * as categoriesApi from '@/lib/api/categories';

// APIをモック
jest.mock('@/lib/api/categories');

const mockGetCategoryById = categoriesApi.getCategoryById as jest.MockedFunction<
  typeof categoriesApi.getCategoryById
>;
const mockUpdateCategory = categoriesApi.updateCategory as jest.MockedFunction<
  typeof categoriesApi.updateCategory
>;

const mockCategory: Category = {
  id: 'cat-1',
  name: 'テスト費目',
  type: CategoryType.EXPENSE,
  parentId: null,
  icon: '🍔',
  color: '#FF9800',
  isSystemDefined: false,
  order: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('CategoryEditModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isOpenがfalseの場合は何も表示されない', () => {
    const { container } = render(
      <CategoryEditModal
        categoryId="cat-1"
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('isOpenがtrueの場合にモーダルが表示される', async () => {
    mockGetCategoryById.mockResolvedValue(mockCategory);

    render(
      <CategoryEditModal
        categoryId="cat-1"
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // ローディング状態を確認
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    // データ取得後、モーダルが表示されることを確認
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('費目を編集')).toBeInTheDocument();
    });

    expect(mockGetCategoryById).toHaveBeenCalledWith('cat-1');
  });

  it('費目データが正しく表示される', async () => {
    mockGetCategoryById.mockResolvedValue(mockCategory);

    render(
      <CategoryEditModal
        categoryId="cat-1"
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('テスト費目')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/費目名/);
    expect(nameInput).toHaveValue('テスト費目');
  });

  it('閉じるボタンをクリックするとonCloseが呼ばれる', async () => {
    mockGetCategoryById.mockResolvedValue(mockCategory);

    const user = userEvent.setup();

    render(
      <CategoryEditModal
        categoryId="cat-1"
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('モーダルを閉じる');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('オーバーレイをクリックするとonCloseが呼ばれる', async () => {
    mockGetCategoryById.mockResolvedValue(mockCategory);

    const user = userEvent.setup();

    const { container } = render(
      <CategoryEditModal
        categoryId="cat-1"
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // オーバーレイはaria-hidden="true"のdiv
    const overlay = container.querySelector('div[aria-hidden="true"]');
    expect(overlay).toBeInTheDocument();
    if (overlay) {
      await user.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('フォーム送信が成功するとonSuccessが呼ばれる', async () => {
    mockGetCategoryById.mockResolvedValue(mockCategory);
    mockUpdateCategory.mockResolvedValue({
      ...mockCategory,
      name: '更新された費目',
    });

    const user = userEvent.setup();

    render(
      <CategoryEditModal
        categoryId="cat-1"
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // 費目名を変更
    const nameInput = screen.getByLabelText(/費目名/);
    // 全選択してから新しい値を入力
    await user.tripleClick(nameInput);
    await user.keyboard('{Delete}');
    await user.type(nameInput, '更新された費目');

    // 保存ボタンをクリック
    const saveButton = screen.getByRole('button', { name: '保存' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateCategory).toHaveBeenCalled();
      const callArgs = mockUpdateCategory.mock.calls[0];
      expect(callArgs[0]).toBe('cat-1');
      expect(callArgs[1].name).toBe('更新された費目');
      expect(callArgs[1].icon).toBe(mockCategory.icon);
      expect(callArgs[1].color).toBe(mockCategory.color);
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('APIエラー時にエラーメッセージが表示される', async () => {
    mockGetCategoryById.mockRejectedValue(new Error('費目の取得に失敗しました'));

    render(
      <CategoryEditModal
        categoryId="cat-1"
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('費目の取得に失敗しました')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: '閉じる' });
    expect(closeButton).toBeInTheDocument();
  });

  it('更新エラー時にエラーメッセージが表示される', async () => {
    mockGetCategoryById.mockResolvedValue(mockCategory);
    mockUpdateCategory.mockRejectedValue(new Error('費目の更新に失敗しました'));

    const user = userEvent.setup();

    render(
      <CategoryEditModal
        categoryId="cat-1"
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: '保存' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('費目の更新に失敗しました')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('categoryIdがnullの場合はモーダルが表示されるがデータ取得は実行されない', async () => {
    render(
      <CategoryEditModal
        categoryId={null}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // モーダルは表示されるが、データ取得は実行されない
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // categoryIdがnullの場合はgetCategoryByIdが呼ばれない
    expect(mockGetCategoryById).not.toHaveBeenCalled();
  });

  it('モーダルが閉じられたときに状態がリセットされる', async () => {
    mockGetCategoryById.mockResolvedValue(mockCategory);

    const { rerender } = render(
      <CategoryEditModal
        categoryId="cat-1"
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // モーダルを閉じる
    rerender(
      <CategoryEditModal
        categoryId="cat-1"
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // 再度開いたときにデータが再取得されることを確認
    rerender(
      <CategoryEditModal
        categoryId="cat-1"
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await waitFor(() => {
      expect(mockGetCategoryById).toHaveBeenCalledTimes(2);
    });
  });
});
