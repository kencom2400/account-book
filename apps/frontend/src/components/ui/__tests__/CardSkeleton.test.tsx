import React from 'react';
import { render } from '@testing-library/react';
import { CardSkeleton } from '../CardSkeleton';

describe('CardSkeleton', () => {
  it('should render card skeleton', () => {
    const { container } = render(<CardSkeleton />);
    const card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'p-6');
  });

  it('should render default rows (1)', () => {
    const { container } = render(<CardSkeleton />);
    const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
    // ヘッダー部分（2つ） + コンテンツ部分（2つ） = 4つ
    expect(skeletons.length).toBe(4);
  });

  it('should render specified number of rows', () => {
    const { container } = render(<CardSkeleton rows={3} />);
    const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
    // ヘッダー部分（2つ） + コンテンツ部分（3行 × 2つ） = 8つ
    expect(skeletons.length).toBe(8);
  });

  it('should apply custom className', () => {
    const { container } = render(<CardSkeleton className="custom-class" />);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
  });

  it('should disable animation when disableAnimation is true', () => {
    const { container } = render(<CardSkeleton disableAnimation />);
    const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
    skeletons.forEach((skeleton) => {
      expect(skeleton).not.toHaveClass('animate-pulse');
    });
  });
});
