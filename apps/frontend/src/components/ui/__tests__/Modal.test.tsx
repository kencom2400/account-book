import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <p>Modal Content</p>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // bodyのoverflowをリセット
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // クリーンアップ
    document.body.style.overflow = '';
  });

  it('should not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    render(<Modal {...defaultProps} title="Modal Title" />);
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Modal Title')).toHaveAttribute('id', 'modal-title');
  });

  it('should not render title when not provided', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('should render close button by default', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByLabelText('閉じる')).toBeInTheDocument();
  });

  it('should not render close button when showCloseButton is false', () => {
    render(<Modal {...defaultProps} showCloseButton={false} />);
    expect(screen.queryByLabelText('閉じる')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<Modal {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByLabelText('閉じる'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<Modal {...defaultProps} onClose={onClose} />);

    const overlay = screen.getByLabelText('モーダルを閉じる');
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when ESC key is pressed', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<Modal {...defaultProps} onClose={onClose} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Enter key is pressed on overlay', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<Modal {...defaultProps} onClose={onClose} />);

    const overlay = screen.getByLabelText('モーダルを閉じる');
    overlay.focus();
    await user.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Space key is pressed on overlay', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    render(<Modal {...defaultProps} onClose={onClose} />);

    const overlay = screen.getByLabelText('モーダルを閉じる');
    overlay.focus();
    await user.keyboard(' ');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should apply size styles', () => {
    const { rerender, container } = render(<Modal {...defaultProps} size="sm" />);
    let modalContent = container.querySelector('.max-w-md');
    expect(modalContent).toBeInTheDocument();

    rerender(<Modal {...defaultProps} size="md" />);
    modalContent = container.querySelector('.max-w-lg');
    expect(modalContent).toBeInTheDocument();

    rerender(<Modal {...defaultProps} size="lg" />);
    modalContent = container.querySelector('.max-w-2xl');
    expect(modalContent).toBeInTheDocument();

    rerender(<Modal {...defaultProps} size="xl" />);
    modalContent = container.querySelector('.max-w-4xl');
    expect(modalContent).toBeInTheDocument();
  });

  it('should set body overflow to hidden when modal is open', () => {
    render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body overflow when modal is closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Modal {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('should set aria-modal attribute', () => {
    const { container } = render(<Modal {...defaultProps} />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should set aria-labelledby when title is provided', () => {
    const { container } = render(<Modal {...defaultProps} title="Modal Title" />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('should not set aria-labelledby when title is not provided', () => {
    const { container } = render(<Modal {...defaultProps} />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toHaveAttribute('aria-labelledby');
  });

  it('should render children', () => {
    render(
      <Modal {...defaultProps}>
        <div>Custom Content</div>
      </Modal>
    );
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('should render header when title or showCloseButton is true', () => {
    const { rerender } = render(<Modal {...defaultProps} title="Title" />);
    expect(screen.getByText('Title')).toBeInTheDocument();

    rerender(<Modal {...defaultProps} showCloseButton />);
    expect(screen.getByLabelText('閉じる')).toBeInTheDocument();
  });

  it('should not render header when title and showCloseButton are both false', () => {
    const { container } = render(
      <Modal {...defaultProps} title={undefined} showCloseButton={false} />
    );
    const header = container.querySelector('.border-b');
    expect(header).not.toBeInTheDocument();
  });
});
