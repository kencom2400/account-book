import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../Textarea';

describe('Textarea', () => {
  it('should render textarea', () => {
    render(<Textarea id="test-textarea" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('should display error message', () => {
    render(<Textarea id="test-textarea" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-red-600');
  });

  it('should display helper text', () => {
    render(<Textarea id="test-textarea" helperText="Enter your message" />);
    expect(screen.getByText('Enter your message')).toBeInTheDocument();
    expect(screen.getByText('Enter your message')).toHaveClass('text-gray-500');
  });

  it('should apply error styles when error is present', () => {
    render(<Textarea id="test-textarea" error="Error" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('border-red-300');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Textarea id="test-textarea" disabled />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveClass('bg-gray-100', 'text-gray-600');
  });

  it('should handle value changes', async () => {
    const user = userEvent.setup();
    render(<Textarea id="test-textarea" />);
    const textarea = screen.getByRole('textbox');

    await user.type(textarea, 'Test message');
    expect(textarea).toHaveValue('Test message');
  });

  it('should set aria-invalid when error is present', () => {
    render(<Textarea id="test-textarea" error="Error" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('should set aria-describedby when error or helperText is present', () => {
    const { rerender } = render(<Textarea id="test-textarea" error="Error" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'test-textarea-helper');

    rerender(<Textarea id="test-textarea" helperText="Helper" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'test-textarea-helper');
  });

  it('should apply custom className', () => {
    render(<Textarea id="test-textarea" className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('should support placeholder', () => {
    render(<Textarea id="test-textarea" placeholder="Enter text here" />);
    expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
  });

  it('should support rows attribute', () => {
    render(<Textarea id="test-textarea" rows={5} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
  });
});
