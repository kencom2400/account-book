import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'warning', 'error', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    showIcon: {
      control: 'boolean',
    },
    dismissible: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    message: 'これは情報メッセージです。',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    message: '操作が正常に完了しました。',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    message: '警告: この操作には注意が必要です。',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    message: 'エラーが発生しました。もう一度お試しください。',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    message: '情報: 新しい機能が利用可能です。',
  },
};

export const WithTitle: Story = {
  args: {
    variant: 'error',
    title: 'エラー',
    message: 'エラーが発生しました。もう一度お試しください。',
  },
};

export const Dismissible: Story = {
  args: {
    variant: 'warning',
    message: 'このメッセージは閉じることができます。',
    dismissible: true,
    onClose: () => {
      console.log('Alert closed');
    },
  },
};

export const WithoutIcon: Story = {
  args: {
    variant: 'info',
    message: 'アイコンなしのアラートです。',
    showIcon: false,
  },
};

export const Small: Story = {
  args: {
    variant: 'info',
    message: '小さいサイズのアラートです。',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    variant: 'info',
    message: '中サイズのアラートです。',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    variant: 'info',
    message: '大きいサイズのアラートです。',
    size: 'lg',
  },
};

export const WithChildren: Story = {
  args: {
    variant: 'error',
    title: 'エラー',
    message: 'エラーが発生しました。',
    children: (
      <div className="mt-2 text-sm">
        <ul className="list-disc list-inside space-y-1">
          <li>ネットワーク接続を確認してください</li>
          <li>しばらく時間をおいてから再度お試しください</li>
        </ul>
      </div>
    ),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Alert variant="success" message="成功メッセージ" />
      <Alert variant="warning" message="警告メッセージ" />
      <Alert variant="error" message="エラーメッセージ" />
      <Alert variant="info" message="情報メッセージ" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <Alert size="sm" message="小さいサイズのアラート" />
      <Alert size="md" message="中サイズのアラート" />
      <Alert size="lg" message="大きいサイズのアラート" />
    </div>
  ),
};
