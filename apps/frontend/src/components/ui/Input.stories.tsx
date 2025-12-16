import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Label } from './Label';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    type: {
      control: 'select',
      options: [
        'text',
        'number',
        'email',
        'password',
        'search',
        'tel',
        'url',
        'date',
        'month',
        'time',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    id: 'input-default',
    placeholder: 'Enter text...',
  },
  render: (args) => (
    <div className="w-64">
      <Label htmlFor="input-default">Default Input</Label>
      <Input {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-64">
      <Label htmlFor="input-label" required>
        Email Address
      </Label>
      <Input id="input-label" type="email" placeholder="example@email.com" />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="w-64">
      <Label htmlFor="input-error" required>
        Email Address
      </Label>
      <Input id="input-error" type="email" error="Please enter a valid email address" />
    </div>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <div className="w-64">
      <Label htmlFor="input-helper">Password</Label>
      <Input id="input-helper" type="password" helperText="Must be at least 8 characters" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-64">
      <Label htmlFor="input-disabled">Disabled Input</Label>
      <Input id="input-disabled" value="Disabled value" disabled />
    </div>
  ),
};

export const AllTypes: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <div>
        <Label htmlFor="input-text">Text</Label>
        <Input id="input-text" type="text" placeholder="Text input" />
      </div>
      <div>
        <Label htmlFor="input-number">Number</Label>
        <Input id="input-number" type="number" placeholder="123" />
      </div>
      <div>
        <Label htmlFor="input-email">Email</Label>
        <Input id="input-email" type="email" placeholder="email@example.com" />
      </div>
      <div>
        <Label htmlFor="input-password">Password</Label>
        <Input id="input-password" type="password" placeholder="Password" />
      </div>
      <div>
        <Label htmlFor="input-date">Date</Label>
        <Input id="input-date" type="date" />
      </div>
    </div>
  ),
};
