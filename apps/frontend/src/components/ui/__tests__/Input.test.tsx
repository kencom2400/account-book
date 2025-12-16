import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  it('should render input with default type', () => {
    render(<Input id="test-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should render input with specified type', () => {
    const { rerender, container } = render(<Input id="test-input" type="number" />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');

    rerender(<Input id="test-input" type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input id="test-input" type="password" />);
    const passwordInput = container.querySelector('input[type="password"]');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should display error message', () => {
    render(<Input id="test-input" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-red-600');
  });

  it('should display helper text', () => {
    render(<Input id="test-input" helperText="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address')).toHaveClass('text-gray-500');
  });

  it('should apply error styles when error is present', () => {
    render(<Input id="test-input" error="Error" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-300');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input id="test-input" disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('bg-gray-100', 'text-gray-600');
  });

  it('should handle value changes', async () => {
    const user = userEvent.setup();
    render(<Input id="test-input" />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'test value');
    expect(input).toHaveValue('test value');
  });

  it('should apply custom className', () => {
    render(<Input id="test-input" className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });
});
