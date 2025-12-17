import type { Meta, StoryObj } from '@storybook/react';
import { CardSkeleton } from './CardSkeleton';

const meta: Meta<typeof CardSkeleton> = {
  title: 'UI/CardSkeleton',
  component: CardSkeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    rows: {
      control: 'number',
    },
    disableAnimation: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CardSkeleton>;

export const Default: Story = {
  args: {},
};

export const SingleRow: Story = {
  args: {
    rows: 1,
  },
};

export const MultipleRows: Story = {
  args: {
    rows: 3,
  },
};

export const ManyRows: Story = {
  args: {
    rows: 5,
  },
};

export const WithoutAnimation: Story = {
  args: {
    rows: 2,
    disableAnimation: true,
  },
};

export const MultipleCards: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <CardSkeleton rows={2} />
      <CardSkeleton rows={1} />
      <CardSkeleton rows={3} />
    </div>
  ),
};
