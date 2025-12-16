import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';
import { Button } from './Button';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

const ModalWrapper = ({
  children,
  ...props
}: React.ComponentProps<typeof Modal>): React.JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal {...props} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {children}
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: () => (
    <ModalWrapper title="Default Modal">
      <p>This is a default modal dialog.</p>
    </ModalWrapper>
  ),
};

export const Small: Story = {
  render: () => (
    <ModalWrapper title="Small Modal" size="sm">
      <p>This is a small modal dialog.</p>
    </ModalWrapper>
  ),
};

export const Medium: Story = {
  render: () => (
    <ModalWrapper title="Medium Modal" size="md">
      <p>This is a medium modal dialog.</p>
    </ModalWrapper>
  ),
};

export const Large: Story = {
  render: () => (
    <ModalWrapper title="Large Modal" size="lg">
      <p>This is a large modal dialog with more content.</p>
      <p>You can add multiple paragraphs here.</p>
    </ModalWrapper>
  ),
};

export const ExtraLarge: Story = {
  render: () => (
    <ModalWrapper title="Extra Large Modal" size="xl">
      <p>This is an extra large modal dialog.</p>
      <p>It can contain even more content.</p>
    </ModalWrapper>
  ),
};

export const WithoutTitle: Story = {
  render: () => (
    <ModalWrapper>
      <p>This modal has no title.</p>
    </ModalWrapper>
  ),
};

export const WithForm: Story = {
  render: () => (
    <ModalWrapper title="Form Modal" size="md">
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter your email"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Submit</Button>
        </div>
      </form>
    </ModalWrapper>
  ),
};
