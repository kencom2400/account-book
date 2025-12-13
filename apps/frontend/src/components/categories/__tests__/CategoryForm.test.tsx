/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CategoryForm } from '../CategoryForm';
import { Category, CategoryType } from '@account-book/types';

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

describe('CategoryForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('新規作成モード', () => {
    it('新規作成モードで正しく表示される', () => {
      render(<CategoryForm category={null} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('費目作成')).toBeInTheDocument();
      expect(screen.getByLabelText(/費目名/)).toBeInTheDocument();
      expect(screen.getByLabelText(/タイプ/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    it('フォーム送信が正しく動作する', async () => {
      const user = userEvent.setup();

      render(<CategoryForm category={null} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/費目名/);
      await user.type(nameInput, '新しい費目');

      const typeSelect = screen.getByLabelText(/タイプ/);
      await user.selectOptions(typeSelect, CategoryType.INCOME);

      const iconInput = screen.getByLabelText(/アイコン/);
      await user.type(iconInput, '💰');

      const colorInput = screen.getByLabelText(/カラー/);
      await user.type(colorInput, '#4CAF50');

      const submitButton = screen.getByRole('button', { name: '追加' });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: '新しい費目',
        type: CategoryType.INCOME,
        icon: '💰',
        color: '#4CAF50',
      });
    });

    it('空のアイコンと色はnullとして送信される', async () => {
      const user = userEvent.setup();

      render(<CategoryForm category={null} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/費目名/);
      await user.type(nameInput, '新しい費目');

      const submitButton = screen.getByRole('button', { name: '追加' });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: '新しい費目',
        type: CategoryType.EXPENSE, // デフォルト値
        icon: null,
        color: null,
      });
    });

    it('キャンセルボタンをクリックするとonCancelが呼ばれる', async () => {
      const user = userEvent.setup();

      render(<CategoryForm category={null} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('編集モード', () => {
    it('編集モードで正しく表示される', () => {
      render(
        <CategoryForm category={mockCategory} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByText('費目編集')).toBeInTheDocument();
      expect(screen.getByDisplayValue('テスト費目')).toBeInTheDocument();
      expect(screen.getByDisplayValue('🍔')).toBeInTheDocument();
      expect(screen.getByDisplayValue('#FF9800')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    });

    it('カテゴリタイプがグレーアウト表示される', () => {
      render(
        <CategoryForm category={mockCategory} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const typeSelect = screen.getByLabelText(/タイプ/);
      expect(typeSelect).toBeDisabled();
      expect(screen.getByText('カテゴリタイプは変更できません')).toBeInTheDocument();
    });

    it('タイプ選択が表示されない（編集時）', () => {
      render(
        <CategoryForm category={mockCategory} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      // 新規作成時のタイプ選択（id="category-type"）は表示されない
      expect(screen.queryByLabelText(/タイプ.*\*/)).not.toBeInTheDocument();
    });

    it('フォーム送信が正しく動作する', async () => {
      const user = userEvent.setup();

      render(
        <CategoryForm category={mockCategory} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const nameInput = screen.getByLabelText(/費目名/);
      await user.clear(nameInput);
      await user.type(nameInput, '更新された費目');

      const iconInput = screen.getByLabelText(/アイコン/);
      await user.clear(iconInput);
      await user.type(iconInput, '🍕');

      const colorInput = screen.getByLabelText(/カラー/);
      await user.clear(colorInput);
      await user.type(colorInput, '#2196F3');

      const submitButton = screen.getByRole('button', { name: '保存' });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: '更新された費目',
        type: CategoryType.EXPENSE, // 編集時は既存のタイプを使用
        icon: '🍕',
        color: '#2196F3',
      });
    });

    it('categoryが変更されるとフォームが更新される', () => {
      const { rerender } = render(
        <CategoryForm category={mockCategory} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByDisplayValue('テスト費目')).toBeInTheDocument();

      const newCategory: Category = {
        ...mockCategory,
        id: 'cat-2',
        name: '新しい費目',
        icon: '🍕',
      };

      rerender(
        <CategoryForm category={newCategory} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByDisplayValue('新しい費目')).toBeInTheDocument();
      expect(screen.getByDisplayValue('🍕')).toBeInTheDocument();
    });
  });

  describe('バリデーション', () => {
    it('費目名が必須である', async () => {
      const user = userEvent.setup();

      render(<CategoryForm category={null} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByRole('button', { name: '追加' });
      await user.click(submitButton);

      // HTML5のrequired属性により、フォーム送信が阻止される
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('費目名の最大長が50文字である', () => {
      render(<CategoryForm category={null} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/費目名/);
      expect(nameInput).toHaveAttribute('maxLength', '50');
    });

    it('アイコンの最大長が10文字である', () => {
      render(<CategoryForm category={null} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const iconInput = screen.getByLabelText(/アイコン/);
      expect(iconInput).toHaveAttribute('maxLength', '10');
    });
  });

  describe('カラーピッカー', () => {
    it('カラーピッカーが表示される', () => {
      render(<CategoryForm category={null} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const colorPicker = screen.getByDisplayValue('#000000');
      expect(colorPicker).toBeInTheDocument();
      expect(colorPicker).toHaveAttribute('type', 'color');
    });

    it('カラーピッカーとテキスト入力が同期する', async () => {
      const user = userEvent.setup();

      render(<CategoryForm category={null} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const colorTextInput = screen.getByPlaceholderText('#FF9800');
      await user.type(colorTextInput, '#4CAF50');

      // カラーピッカーも更新される（内部的に）
      const colorPicker = screen.getByDisplayValue('#4CAF50');
      expect(colorPicker).toBeInTheDocument();
    });
  });
});
