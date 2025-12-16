import React from 'react';
import { render } from '@testing-library/react';
import { ListSkeleton } from '../ListSkeleton';

describe('ListSkeleton', () => {
  it('should render list skeleton', () => {
    const { container } = render(<ListSkeleton />);
    const list = container.firstChild as HTMLElement;
    expect(list).toBeInTheDocument();
    expect(list).toHaveClass('space-y-2');
  });

  it('should render default count (5)', () => {
    const { container } = render(<ListSkeleton />);
    const items = container.querySelectorAll('[class*="flex items-center gap-4"]');
    expect(items.length).toBe(5);
  });

  it('should render specified count', () => {
    const { container } = render(<ListSkeleton count={3} />);
    const items = container.querySelectorAll('[class*="flex items-center gap-4"]');
    expect(items.length).toBe(3);
  });

  it('should render circular skeleton for avatar', () => {
    const { container } = render(<ListSkeleton count={1} />);
    const circularSkeleton = container.querySelector('[class*="rounded-full"]');
    expect(circularSkeleton).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<ListSkeleton className="custom-class" />);
    const list = container.firstChild as HTMLElement;
    expect(list).toHaveClass('custom-class');
  });

  it('should disable animation when disableAnimation is true', () => {
    const { container } = render(<ListSkeleton disableAnimation />);
    const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
    skeletons.forEach((skeleton) => {
      expect(skeleton).not.toHaveClass('animate-pulse');
    });
  });
});
