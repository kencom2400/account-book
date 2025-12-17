import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from '../Alert';

describe('Alert', () => {
  it('should render alert with message', () => {
    render(<Alert message="Test message" />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render alert with title', () => {
    render(<Alert title="Test title" message="Test message" />);
    expect(screen.getByText('Test title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should apply info variant by default', () => {
    render(<Alert message="Test message" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-blue-50', 'border-blue-200');
  });

  it('should apply success variant', () => {
    render(<Alert variant="success" message="Test message" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-green-50', 'border-green-200');
  });

  it('should apply warning variant', () => {
    render(<Alert variant="warning" message="Test message" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200');
  });

  it('should apply error variant', () => {
    render(<Alert variant="error" message="Test message" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-red-50', 'border-red-200');
  });

  it('should apply size styles', () => {
    const { rerender } = render(<Alert size="sm" message="Test message" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('p-2');
    expect(screen.getByText('Test message')).toHaveClass('text-sm');

    rerender(<Alert size="md" message="Test message" />);
    expect(alert).toHaveClass('p-3');
    expect(screen.getByText('Test message')).toHaveClass('text-base');

    rerender(<Alert size="lg" message="Test message" />);
    expect(alert).toHaveClass('p-4');
    expect(screen.getByText('Test message')).toHaveClass('text-lg');
  });

  it('should show icon by default', () => {
    render(<Alert message="Test message" />);
    const icon = screen.getByRole('alert').querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should hide icon when showIcon is false', () => {
    render(<Alert message="Test message" showIcon={false} />);
    const icon = screen.getByRole('alert').querySelector('svg');
    expect(icon).not.toBeInTheDocument();
  });

  it('should show close button when dismissible is true', () => {
    render(<Alert message="Test message" dismissible onClose={jest.fn()} />);
    const closeButton = screen.getByLabelText('アラートを閉じる');
    expect(closeButton).toBeInTheDocument();
  });

  it('should not show close button when dismissible is false', () => {
    render(<Alert message="Test message" dismissible={false} />);
    const closeButton = screen.queryByLabelText('アラートを閉じる');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<Alert message="Test message" dismissible onClose={onClose} />);
    const closeButton = screen.getByLabelText('アラートを閉じる');
    await user.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render children', () => {
    render(
      <Alert message="Test message">
        <div data-testid="child">Child content</div>
      </Alert>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Alert message="Test message" className="custom-class" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('custom-class');
  });
});
