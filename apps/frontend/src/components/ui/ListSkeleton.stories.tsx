import type { Meta, StoryObj } from '@storybook/react';
import { ListSkeleton } from './ListSkeleton';

const meta: Meta<typeof ListSkeleton> = {
  title: 'UI/ListSkeleton',
  component: ListSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    count: {
      control: 'number',
    },
    disableAnimation: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ListSkeleton>;

export const Default: Story = {
  args: {},
};

export const FewItems: Story = {
  args: {
    count: 3,
  },
};

export const ManyItems: Story = {
  args: {
    count: 10,
  },
};

export const WithoutAnimation: Story = {
  args: {
    count: 5,
    disableAnimation: true,
  },
};

export const InContainer: Story = {
  render: () => (
    <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">取引一覧</h2>
      <ListSkeleton count={5} />
    </div>
  ),
};
