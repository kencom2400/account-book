import type { Meta, StoryObj } from '@storybook/react';
import { TableSkeleton } from './TableSkeleton';

const meta: Meta<typeof TableSkeleton> = {
  title: 'UI/TableSkeleton',
  component: TableSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    rows: {
      control: 'number',
    },
    columns: {
      control: 'number',
    },
    showHeader: {
      control: 'boolean',
    },
    disableAnimation: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TableSkeleton>;

export const Default: Story = {
  args: {},
};

export const SmallTable: Story = {
  args: {
    rows: 3,
    columns: 3,
  },
};

export const LargeTable: Story = {
  args: {
    rows: 10,
    columns: 6,
  },
};

export const WithoutHeader: Story = {
  args: {
    rows: 5,
    columns: 4,
    showHeader: false,
  },
};

export const WithoutAnimation: Story = {
  args: {
    rows: 5,
    columns: 4,
    disableAnimation: true,
  },
};

export const InContainer: Story = {
  render: () => (
    <div className="w-full max-w-4xl p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">取引履歴</h2>
      <TableSkeleton rows={5} columns={4} />
    </div>
  ),
};
