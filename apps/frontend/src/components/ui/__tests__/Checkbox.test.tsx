import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox } from '../Checkbox';

describe('Checkbox', () => {
  it('should render checkbox', () => {
    render(<Checkbox id="test-checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('should render checkbox with label', () => {
    render(<Checkbox id="test-checkbox" label="Check me" />);
    expect(screen.getByText('Check me')).toBeInTheDocument();
    expect(screen.getByLabelText('Check me')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(<Checkbox id="test-checkbox" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-red-600');
  });

  it('should be checked when checked prop is true', () => {
    const handleChange = jest.fn();
    render(<Checkbox id="test-checkbox" checked onChange={handleChange} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Checkbox id="test-checkbox" disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('should handle onChange', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(<Checkbox id="test-checkbox" onChange={handleChange} />);

    await user.click(screen.getByRole('checkbox'));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('should not call onChange when disabled', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(<Checkbox id="test-checkbox" disabled onChange={handleChange} />);

    await user.click(screen.getByRole('checkbox'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should generate id when id is not provided', () => {
    render(<Checkbox label="Test" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id');
    expect(checkbox.getAttribute('id')).toMatch(/^checkbox-/);
  });

  it('should use provided id', () => {
    render(<Checkbox id="custom-id" label="Test" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'custom-id');
    expect(screen.getByText('Test')).toHaveAttribute('for', 'custom-id');
  });

  it('should apply custom className', () => {
    render(<Checkbox id="test-checkbox" className="custom-class" />);
    expect(screen.getByRole('checkbox')).toHaveClass('custom-class');
  });

  it('should set aria-invalid when error is present', () => {
    render(<Checkbox id="test-checkbox" error="Error" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('should not set aria-invalid when error is not present', () => {
    render(<Checkbox id="test-checkbox" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'false');
  });
});
