import React from 'react';
import { render, screen } from '@testing-library/react';
import { CustomLegend } from '../CategoryPieChart';

describe('CustomLegend', () => {
  it('payloadありの場合、凡例を表示する', () => {
    const payload = [
      {
        value: '食費',
        color: '#FF6B6B',
        payload: { name: '食費', value: 100000, percentage: 50.0, color: '#FF6B6B' },
      },
      {
        value: '交通費',
        color: '#4ECDC4',
        payload: { name: '交通費', value: 50000, percentage: 25.0, color: '#4ECDC4' },
      },
    ];

    render(<CustomLegend payload={payload} />);

    expect(screen.getByText('食費')).toBeInTheDocument();
    expect(screen.getByText('交通費')).toBeInTheDocument();
    expect(screen.getByText(/50.0%/)).toBeInTheDocument();
    expect(screen.getByText(/25.0%/)).toBeInTheDocument();
  });

  it('payloadが空の場合、何も表示しない', () => {
    const { container } = render(<CustomLegend payload={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('payloadがundefinedの場合、何も表示しない', () => {
    const { container } = render(<CustomLegend payload={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('percentageが数値でない場合でもエラーにならない', () => {
    const payload = [
      {
        value: '食費',
        color: '#FF6B6B',
        payload: {
          name: '食費',
          value: 100000,
          percentage: undefined as unknown as number,
          color: '#FF6B6B',
        },
      },
    ];

    render(<CustomLegend payload={payload} />);
    // エラーなく表示されることを確認
    expect(screen.getByText('食費')).toBeInTheDocument();
  });
});
