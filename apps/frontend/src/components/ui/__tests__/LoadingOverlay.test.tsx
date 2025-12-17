import { render, screen } from '@testing-library/react';
import { LoadingOverlay } from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  it('should not render overlay when isLoading is false', () => {
    render(
      <LoadingOverlay isLoading={false}>
        <div>Content</div>
      </LoadingOverlay>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
  });

  it('should render overlay when isLoading is true', () => {
    render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(
      <LoadingOverlay isLoading={true} text="カスタムテキスト">
        <div>Content</div>
      </LoadingOverlay>
    );
    expect(screen.getByText('カスタムテキスト')).toBeInTheDocument();
  });

  it('should apply custom overlayClassName', () => {
    const { container } = render(
      <LoadingOverlay isLoading={true} overlayClassName="custom-overlay">
        <div>Content</div>
      </LoadingOverlay>
    );
    const overlay = container.querySelector('.custom-overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <LoadingOverlay isLoading={true} className="custom-class">
        <div>Content</div>
      </LoadingOverlay>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
