import React from 'react';
import { render, screen } from '@testing-library/react';
import { CustomTooltip } from '../CustomTooltip';

describe('CustomTooltip', () => {
  it('active=true, payloadありの場合、ツールチップを表示する', () => {
    const payload = [
      { name: '収入', value: 100000, color: '#4CAF50' },
      { name: '支出', value: 50000, color: '#F44336' },
    ];

    render(<CustomTooltip active={true} payload={payload} />);

    expect(screen.getByText(/収入:/)).toBeInTheDocument();
    expect(screen.getByText(/支出:/)).toBeInTheDocument();
  });

  it('active=falseの場合、何も表示しない', () => {
    const payload = [{ name: '収入', value: 100000, color: '#4CAF50' }];

    const { container } = render(<CustomTooltip active={false} payload={payload} />);
    expect(container.firstChild).toBeNull();
  });

  it('payloadが空の場合、何も表示しない', () => {
    const { container } = render(<CustomTooltip active={true} payload={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('payloadがundefinedの場合、何も表示しない', () => {
    const { container } = render(<CustomTooltip active={true} payload={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('複数のpayload項目を表示する', () => {
    const payload = [
      { name: '収入', value: 100000, color: '#4CAF50' },
      { name: '支出', value: 50000, color: '#F44336' },
      { name: '収支', value: 50000, color: '#2196F3' },
    ];

    render(<CustomTooltip active={true} payload={payload} />);

    expect(screen.getByText(/収入:/)).toBeInTheDocument();
    expect(screen.getByText(/支出:/)).toBeInTheDocument();
    expect(screen.getByText(/収支:/)).toBeInTheDocument();
  });

  it('payloadの色が正しく適用される', () => {
    const payload = [{ name: '収入', value: 100000, color: '#4CAF50' }];

    render(<CustomTooltip active={true} payload={payload} />);

    const element = screen.getByText(/収入:/);
    expect(element).toHaveStyle({ color: '#4CAF50' });
  });
});
