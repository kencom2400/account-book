import React from 'react';
import { render } from '@testing-library/react';
import { TableSkeleton } from '../TableSkeleton';

describe('TableSkeleton', () => {
  it('should render table skeleton', () => {
    const { container } = render(<TableSkeleton />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  it('should render default rows (5) and columns (4)', () => {
    const { container } = render(<TableSkeleton />);
    const rows = container.querySelectorAll('tbody tr');
    const cells = container.querySelectorAll('tbody td');
    expect(rows.length).toBe(5);
    expect(cells.length).toBe(20); // 5 rows × 4 columns
  });

  it('should render specified rows and columns', () => {
    const { container } = render(<TableSkeleton rows={3} columns={2} />);
    const rows = container.querySelectorAll('tbody tr');
    const cells = container.querySelectorAll('tbody td');
    expect(rows.length).toBe(3);
    expect(cells.length).toBe(6); // 3 rows × 2 columns
  });

  it('should render header by default', () => {
    const { container } = render(<TableSkeleton />);
    const header = container.querySelector('thead');
    expect(header).toBeInTheDocument();
    const headerCells = container.querySelectorAll('thead th');
    expect(headerCells.length).toBe(4); // default columns
  });

  it('should not render header when showHeader is false', () => {
    const { container } = render(<TableSkeleton showHeader={false} />);
    const header = container.querySelector('thead');
    expect(header).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<TableSkeleton className="custom-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should disable animation when disableAnimation is true', () => {
    const { container } = render(<TableSkeleton disableAnimation />);
    const skeletons = container.querySelectorAll('[class*="bg-gray-200"]');
    skeletons.forEach((skeleton) => {
      expect(skeleton).not.toHaveClass('animate-pulse');
    });
  });
});
