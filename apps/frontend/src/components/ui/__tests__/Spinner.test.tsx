import React from 'react';
import { render } from '@testing-library/react';
import { Spinner } from '../Spinner';

describe('Spinner', () => {
  it('should render spinner', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should apply default size', () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('h-8', 'w-8');
  });

  it('should apply size styles', () => {
    const { rerender, container } = render(<Spinner size="sm" />);
    expect(container.querySelector('svg')).toHaveClass('h-4', 'w-4');

    rerender(<Spinner size="md" />);
    expect(container.querySelector('svg')).toHaveClass('h-8', 'w-8');

    rerender(<Spinner size="lg" />);
    expect(container.querySelector('svg')).toHaveClass('h-12', 'w-12');
  });

  it('should apply custom className', () => {
    const { container } = render(<Spinner className="custom-class" />);
    expect(container.querySelector('svg')).toHaveClass('custom-class');
  });

  it('should have animation class', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toHaveClass('animate-spin');
  });
});
