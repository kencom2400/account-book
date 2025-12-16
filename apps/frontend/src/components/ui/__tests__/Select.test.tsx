import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
];

describe('Select', () => {
  it('should render select with options', () => {
    render(<Select id="test-select" options={mockOptions} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('should render placeholder when provided', () => {
    render(<Select id="test-select" options={mockOptions} placeholder="Select an option" />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(<Select id="test-select" options={mockOptions} error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-red-600');
  });

  it('should display helper text', () => {
    render(<Select id="test-select" options={mockOptions} helperText="Select an option" />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
    expect(screen.getByText('Select an option')).toHaveClass('text-gray-500');
  });

  it('should apply error styles when error is present', () => {
    render(<Select id="test-select" options={mockOptions} error="Error" />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('border-red-300');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Select id="test-select" options={mockOptions} disabled />);
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
    expect(select).toHaveClass('bg-gray-100', 'text-gray-600');
  });

  it('should handle value changes', async () => {
    const user = userEvent.setup();
    render(<Select id="test-select" options={mockOptions} />);
    const select = screen.getByRole('combobox');

    await user.selectOptions(select, 'option2');
    expect(select).toHaveValue('option2');
  });

  it('should disable option when disabled prop is set', () => {
    render(<Select id="test-select" options={mockOptions} />);
    const option3 = screen.getByText('Option 3');
    expect(option3.closest('option')).toBeDisabled();
  });

  it('should set aria-invalid when error is present', () => {
    render(<Select id="test-select" options={mockOptions} error="Error" />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('should set aria-describedby when error or helperText is present', () => {
    const { rerender } = render(<Select id="test-select" options={mockOptions} error="Error" />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-describedby', 'test-select-helper');

    rerender(<Select id="test-select" options={mockOptions} helperText="Helper" />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-describedby', 'test-select-helper');
  });

  it('should apply custom className', () => {
    render(<Select id="test-select" options={mockOptions} className="custom-class" />);
    expect(screen.getByRole('combobox')).toHaveClass('custom-class');
  });

  it('should render custom arrow icon', () => {
    const { container } = render(<Select id="test-select" options={mockOptions} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
