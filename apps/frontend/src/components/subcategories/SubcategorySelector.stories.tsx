import type { Meta, StoryObj } from '@storybook/react';
import { SubcategorySelector } from './SubcategorySelector';
import { CategoryType, Subcategory } from '@account-book/types';
import { useSubcategoryStore } from '@/stores/subcategory.store';

// モックデータ
const mockSubcategories: Subcategory[] = [
  {
    id: 'sub-food',
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
    id: 'sub-lunch',
    categoryType: CategoryType.EXPENSE,
    name: 'ランチ',
    parentId: 'sub-food',
    displayOrder: 1,
    icon: '🍱',
    color: null,
    isDefault: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sub-dinner',
    categoryType: CategoryType.EXPENSE,
    name: 'ディナー',
    parentId: 'sub-food',
    displayOrder: 2,
    icon: '🍽️',
    color: null,
    isDefault: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sub-transport',
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

const meta: Meta<typeof SubcategorySelector> = {
  title: 'Subcategories/SubcategorySelector',
  component: SubcategorySelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => {
      // ストアの状態を設定（Storybook用）
      // 注意: 実際のAPI呼び出しは行われないため、ストアの状態を直接設定
      useSubcategoryStore.setState({
        subcategories: mockSubcategories,
        isLoading: false,
        error: null,
      });
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof SubcategorySelector>;

export const Default: Story = {
  args: {
    categoryType: CategoryType.EXPENSE,
    onSelect: () => {
      // Storybook用のコールバック
    },
  },
};

export const WithSelected: Story = {
  args: {
    categoryType: CategoryType.EXPENSE,
    selectedSubcategoryId: 'sub-food',
    onSelect: () => {
      // Storybook用のコールバック
    },
  },
};

export const Disabled: Story = {
  args: {
    categoryType: CategoryType.EXPENSE,
    disabled: true,
    onSelect: () => {
      // Storybook用のコールバック
    },
  },
};

export const IncomeCategory: Story = {
  args: {
    categoryType: CategoryType.INCOME,
    onSelect: () => {
      // Storybook用のコールバック
    },
  },
};
