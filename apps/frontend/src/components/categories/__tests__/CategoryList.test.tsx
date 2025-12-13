/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CategoryList } from '../CategoryList';
import { Category, CategoryType } from '@account-book/types';

const mockCategory1: Category = {
  id: 'cat-1',
  name: '食費',
  type: CategoryType.EXPENSE,
  parentId: null,
  icon: '🍔',
  color: '#FF9800',
  isSystemDefined: false,
  order: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockCategory2: Category = {
  id: 'cat-2',
  name: '交通費',
  type: CategoryType.EXPENSE,
  parentId: null,
  icon: '🚗',
  color: '#2196F3',
  isSystemDefined: true,
  order: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockCategory3: Category = {
  id: 'cat-3',
  name: '給与',
  type: CategoryType.INCOME,
  parentId: null,
  icon: null,
  color: null,
  isSystemDefined: false,
  order: 2,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('CategoryList', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('費目一覧が正しく表示される', () => {
    render(
      <CategoryList
        categories={[mockCategory1, mockCategory2]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('食費')).toBeInTheDocument();
    expect(screen.getByText('交通費')).toBeInTheDocument();
  });

  it('費目が空の場合はメッセージが表示される', () => {
    render(<CategoryList categories={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />);

    expect(screen.getByText('費目がありません')).toBeInTheDocument();
  });

  it('アイコンが表示される', () => {
    render(
      <CategoryList categories={[mockCategory1]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByText('🍔')).toBeInTheDocument();
  });

  it('色が表示される', () => {
    const { container } = render(
      <CategoryList categories={[mockCategory1]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    const colorDiv = container.querySelector('div[style*="background-color: rgb(255, 152, 0)"]');
    expect(colorDiv).toBeInTheDocument();
  });

  it('アイコンがない場合は表示されない', () => {
    render(
      <CategoryList categories={[mockCategory3]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByText('給与')).toBeInTheDocument();
    expect(screen.queryByText('🍔')).not.toBeInTheDocument();
  });

  it('色がない場合は表示されない', () => {
    const { container } = render(
      <CategoryList categories={[mockCategory3]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByText('給与')).toBeInTheDocument();
    // 色のdivは存在しない
    const colorDiv = container.querySelector('div[style*="background-color"]');
    expect(colorDiv).not.toBeInTheDocument();
  });

  it('システム定義費目に「システム定義」が表示される', () => {
    render(
      <CategoryList categories={[mockCategory2]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByText(/システム定義/)).toBeInTheDocument();
  });

  it('カスタム費目に編集・削除ボタンが表示される', () => {
    render(
      <CategoryList categories={[mockCategory1]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
  });

  it('システム定義費目に編集・削除ボタンが表示されない', () => {
    render(
      <CategoryList categories={[mockCategory2]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '削除' })).not.toBeInTheDocument();
  });

  it('編集ボタンをクリックするとonEditが呼ばれる', async () => {
    const user = userEvent.setup();

    render(
      <CategoryList categories={[mockCategory1]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    const editButton = screen.getByRole('button', { name: '編集' });
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockCategory1);
  });

  it('削除ボタンをクリックするとonDeleteが呼ばれる', async () => {
    const user = userEvent.setup();

    render(
      <CategoryList categories={[mockCategory1]} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );

    const deleteButton = screen.getByRole('button', { name: '削除' });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockCategory1);
  });

  it('複数の費目が正しく表示される', () => {
    render(
      <CategoryList
        categories={[mockCategory1, mockCategory2, mockCategory3]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('食費')).toBeInTheDocument();
    expect(screen.getByText('交通費')).toBeInTheDocument();
    expect(screen.getByText('給与')).toBeInTheDocument();
  });

  it('カテゴリタイプが表示される', () => {
    render(
      <CategoryList
        categories={[mockCategory1, mockCategory2, mockCategory3]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('EXPENSE')).toBeInTheDocument();
    expect(screen.getByText('INCOME')).toBeInTheDocument();
  });
});
