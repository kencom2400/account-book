import React from 'react';
import { render, screen } from '@testing-library/react';
import { Label } from '../Label';

describe('Label', () => {
  it('should render label with children', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('should show required indicator when required is true', () => {
    render(<Label required>Required Label</Label>);
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveClass('text-red-500');
  });

  it('should not show required indicator when required is false', () => {
    render(<Label>Optional Label</Label>);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Label className="custom-class">Custom Label</Label>);
    expect(screen.getByText('Custom Label')).toHaveClass('custom-class');
  });

  it('should forward htmlFor attribute', () => {
    render(<Label htmlFor="input-id">Label</Label>);
    expect(screen.getByText('Label')).toHaveAttribute('for', 'input-id');
  });
});
