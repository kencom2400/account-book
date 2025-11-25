import type { Meta, StoryObj } from '@storybook/react';
import { ClassificationBadge } from './ClassificationBadge';
import { ClassificationReason } from '@account-book/types';

const meta: Meta<typeof ClassificationBadge> = {
  title: 'Subcategories/ClassificationBadge',
  component: ClassificationBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ClassificationBadge>;

export const HighConfidence: Story = {
  args: {
    confidence: 0.95,
    reason: ClassificationReason.MERCHANT_MATCH,
    merchantName: 'スターバックス',
  },
};

export const MediumConfidence: Story = {
  args: {
    confidence: 0.85,
    reason: ClassificationReason.KEYWORD_MATCH,
  },
};

export const LowConfidence: Story = {
  args: {
    confidence: 0.65,
    reason: ClassificationReason.AMOUNT_INFERENCE,
  },
};

export const DefaultConfidence: Story = {
  args: {
    confidence: 0.45,
    reason: ClassificationReason.DEFAULT,
  },
};

export const MerchantMatch: Story = {
  args: {
    confidence: 0.92,
    reason: ClassificationReason.MERCHANT_MATCH,
    merchantName: 'セブンイレブン',
  },
};

export const KeywordMatch: Story = {
  args: {
    confidence: 0.88,
    reason: ClassificationReason.KEYWORD_MATCH,
  },
};

export const RecurringPattern: Story = {
  args: {
    confidence: 0.75,
    reason: ClassificationReason.RECURRING_PATTERN,
  },
};
