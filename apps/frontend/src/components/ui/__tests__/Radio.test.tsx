import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Radio } from '../Radio';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
];

describe('Radio', () => {
  it('should render radio buttons for all options', () => {
    render(<Radio name="test-radio" options={mockOptions} />);
    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Option 3')).toBeInTheDocument();
  });

  it('should render all radio buttons with same name', () => {
    render(<Radio name="test-radio" options={mockOptions} />);
    const radios = screen.getAllByRole('radio');
    radios.forEach((radio) => {
      expect(radio).toHaveAttribute('name', 'test-radio');
    });
  });

  it('should set correct values for each option', () => {
    render(<Radio name="test-radio" options={mockOptions} />);
    expect(screen.getByLabelText('Option 1')).toHaveAttribute('value', 'option1');
    expect(screen.getByLabelText('Option 2')).toHaveAttribute('value', 'option2');
    expect(screen.getByLabelText('Option 3')).toHaveAttribute('value', 'option3');
  });

  it('should disable option when disabled prop is set', () => {
    render(<Radio name="test-radio" options={mockOptions} />);
    expect(screen.getByLabelText('Option 3')).toBeDisabled();
  });

  it('should disable all options when disabled prop is true', () => {
    render(<Radio name="test-radio" options={mockOptions} disabled />);
    const radios = screen.getAllByRole('radio');
    radios.forEach((radio) => {
      expect(radio).toBeDisabled();
    });
  });

  it('should display error message', () => {
    render(<Radio name="test-radio" options={mockOptions} error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-red-600');
  });

  it('should display helper text', () => {
    render(<Radio name="test-radio" options={mockOptions} helperText="Select an option" />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
    expect(screen.getByText('Select an option')).toHaveClass('text-gray-500');
  });

  it('should handle onChange', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(<Radio name="test-radio" options={mockOptions} onChange={handleChange} />);

    await user.click(screen.getByLabelText('Option 1'));
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('should set checked value when defaultChecked is used', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(<Radio name="test-radio" options={mockOptions} onChange={handleChange} />);

    // オプション2をクリックして選択
    await user.click(screen.getByLabelText('Option 2'));
    expect(screen.getByLabelText('Option 2')).toBeChecked();
    expect(screen.getByLabelText('Option 1')).not.toBeChecked();
  });

  it('should set aria-invalid when error is present', () => {
    render(<Radio name="test-radio" options={mockOptions} error="Error" />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-invalid', 'true');
  });

  it('should set aria-describedby when error or helperText is present', () => {
    const { rerender } = render(<Radio name="test-radio" options={mockOptions} error="Error" />);
    let group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-describedby', 'radio-group-test-radio-helper');

    rerender(<Radio name="test-radio" options={mockOptions} helperText="Helper" />);
    group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-describedby', 'radio-group-test-radio-helper');
  });

  it('should apply custom className', () => {
    render(<Radio name="test-radio" options={mockOptions} className="custom-class" />);
    const radios = screen.getAllByRole('radio');
    radios.forEach((radio) => {
      expect(radio).toHaveClass('custom-class');
    });
  });
});
