import React from 'react';
import { render, screen } from '@testing-library/react';
import { PieChartTooltip } from '../CategoryPieChart';

describe('PieChartTooltip', () => {
  it('active=true, payloadありの場合、ツールチップを表示する', () => {
    const payload = [
      {
        name: '食費',
        value: 100000,
        payload: { name: '食費', value: 100000, percentage: 50.0, color: '#FF6B6B' },
      },
    ];

    render(<PieChartTooltip active={true} payload={payload} />);

    expect(screen.getByText('食費')).toBeInTheDocument();
    expect(screen.getByText(/金額:/)).toBeInTheDocument();
    expect(screen.getByText(/割合:/)).toBeInTheDocument();
  });

  it('active=falseの場合、何も表示しない', () => {
    const payload = [
      {
        name: '食費',
        value: 100000,
        payload: { name: '食費', value: 100000, percentage: 50.0, color: '#FF6B6B' },
      },
    ];

    const { container } = render(<PieChartTooltip active={false} payload={payload} />);
    expect(container.firstChild).toBeNull();
  });

  it('payloadが空の場合、何も表示しない', () => {
    const { container } = render(<PieChartTooltip active={true} payload={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('payloadがundefinedの場合、何も表示しない', () => {
    const { container } = render(<PieChartTooltip active={true} payload={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('percentageが数値でない場合でもエラーにならない', () => {
    const payload = [
      {
        name: '食費',
        value: 100000,
        payload: {
          name: '食費',
          value: 100000,
          percentage: undefined as unknown as number,
          color: '#FF6B6B',
        },
      },
    ];

    render(<PieChartTooltip active={true} payload={payload} />);
    // エラーなく表示されることを確認
    expect(screen.getByText('食費')).toBeInTheDocument();
  });
});
