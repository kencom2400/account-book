import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(<LoadingSpinner text="カスタムテキスト" />);
    expect(screen.getByText('カスタムテキスト')).toBeInTheDocument();
  });

  it('should not render text when showText is false', () => {
    render(<LoadingSpinner showText={false} />);
    expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    rerender(<LoadingSpinner size="md" />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    // classNameは内部のdivに適用される
    const innerDiv = container.querySelector('.flex.flex-col');
    expect(innerDiv).toHaveClass('custom-class');
  });

  it('should apply custom containerClassName', () => {
    const { container } = render(<LoadingSpinner containerClassName="custom-container" />);
    expect(container.firstChild).toHaveClass('custom-container');
  });
});
