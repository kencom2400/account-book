/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CategoryList } from '../CategoryList';
import { Category, CategoryType } from '@account-book/types';

const mockCategories: Category[] = [
  {
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
  },
  {
    id: 'cat-2',
    name: '交通費',
    type: CategoryType.EXPENSE,
    parentId: null,
    icon: '🚃',
    color: '#2196F3',
    isSystemDefined: true,
    order: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

describe('CategoryList', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty message when categories is empty', () => {
    render(<CategoryList categories={[]} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText('費目がありません')).toBeInTheDocument();
  });

  it('should render categories list', () => {
    render(
      <CategoryList categories={mockCategories} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    expect(screen.getByText('食費')).toBeInTheDocument();
    expect(screen.getByText('交通費')).toBeInTheDocument();
  });

  it('should display category icon when provided', () => {
    render(
      <CategoryList categories={mockCategories} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    expect(screen.getByText('🍔')).toBeInTheDocument();
    expect(screen.getByText('🚃')).toBeInTheDocument();
  });

  it('should display category color when provided', () => {
    render(
      <CategoryList categories={mockCategories} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    const colorDivs = screen.getAllByRole('generic').filter((el) => {
      return (
        el.style.backgroundColor === 'rgb(255, 152, 0)' ||
        el.style.backgroundColor === 'rgb(33, 150, 243)'
      );
    });
    expect(colorDivs.length).toBeGreaterThan(0);
  });

  it('should display category type', () => {
    render(
      <CategoryList categories={mockCategories} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    const expenseTexts = screen.getAllByText(/EXPENSE/);
    expect(expenseTexts.length).toBeGreaterThan(0);
  });

  it('should display system defined label for system categories', () => {
    render(
      <CategoryList categories={mockCategories} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    expect(screen.getByText(/（システム定義）/)).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CategoryList categories={mockCategories} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    const editButtons = screen.getAllByRole('button', { name: '編集' });
    await user.click(editButtons[0]);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CategoryList categories={mockCategories} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    const deleteButtons = screen.getAllByRole('button', { name: '削除' });
    await user.click(deleteButtons[0]);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('should not show edit and delete buttons for system defined categories', () => {
    const systemOnlyCategories: Category[] = [
      {
        id: 'cat-2',
        name: '交通費',
        type: CategoryType.EXPENSE,
        parentId: null,
        icon: '🚃',
        color: '#2196F3',
        isSystemDefined: true,
        order: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];
    render(
      <CategoryList categories={systemOnlyCategories} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    expect(screen.queryByRole('button', { name: '編集' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '削除' })).not.toBeInTheDocument();
  });
});
