import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['rectangular', 'circular', 'text'],
    },
    width: {
      control: 'text',
    },
    height: {
      control: 'text',
    },
    disableAnimation: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {},
};

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: 200,
    height: 100,
  },
};

export const Circular: Story = {
  args: {
    variant: 'circular',
    width: 64,
    height: 64,
  },
};

export const Text: Story = {
  args: {
    variant: 'text',
    width: 'w-full',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-600">Rectangular</span>
        <Skeleton variant="rectangular" width={200} height={100} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-600">Circular</span>
        <Skeleton variant="circular" width={64} height={64} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-600">Text</span>
        <Skeleton variant="text" width="w-full" />
        <Skeleton variant="text" width="w-5/6" />
        <Skeleton variant="text" width="w-4/6" />
      </div>
    </div>
  ),
};

export const WithoutAnimation: Story = {
  args: {
    variant: 'rectangular',
    width: 200,
    height: 100,
    disableAnimation: true,
  },
};

export const CustomSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-600">Small (100x50)</span>
        <Skeleton width={100} height={50} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-600">Medium (200x100)</span>
        <Skeleton width={200} height={100} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-gray-600">Large (300x150)</span>
        <Skeleton width={300} height={150} />
      </div>
    </div>
  ),
};
