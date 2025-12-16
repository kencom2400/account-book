import React from 'react';
import { render } from '@testing-library/react';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('should render skeleton', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toBeInTheDocument();
  });

  it('should apply default variant (rectangular)', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('bg-gray-200', 'rounded', 'animate-pulse');
  });

  it('should apply circular variant', () => {
    const { container } = render(<Skeleton variant="circular" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded-full');
  });

  it('should apply text variant', () => {
    const { container } = render(<Skeleton variant="text" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('h-4');
  });

  it('should apply width class', () => {
    const { container } = render(<Skeleton width="w-full" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('w-full');
  });

  it('should apply height class', () => {
    const { container } = render(<Skeleton height="h-8" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('h-8');
  });

  it('should apply numeric width as inline style', () => {
    const { container } = render(<Skeleton width={100} />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveStyle({ width: '100px' });
  });

  it('should apply numeric height as inline style', () => {
    const { container } = render(<Skeleton height={50} />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveStyle({ height: '50px' });
  });

  it('should apply custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('custom-class');
  });

  it('should disable animation when disableAnimation is true', () => {
    const { container } = render(<Skeleton disableAnimation />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).not.toHaveClass('animate-pulse');
  });

  it('should apply both width and height', () => {
    const { container } = render(<Skeleton width={100} height={50} />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveStyle({ width: '100px', height: '50px' });
  });
});
