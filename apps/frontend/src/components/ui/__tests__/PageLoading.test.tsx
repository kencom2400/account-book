import { render, screen } from '@testing-library/react';
import { PageLoading } from '../PageLoading';

describe('PageLoading', () => {
  it('should render with default text', () => {
    render(<PageLoading />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(<PageLoading text="カスタムテキスト" />);
    expect(screen.getByText('カスタムテキスト')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<PageLoading className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should have min-h-screen class', () => {
    const { container } = render(<PageLoading />);
    expect(container.firstChild).toHaveClass('min-h-screen');
  });
});
