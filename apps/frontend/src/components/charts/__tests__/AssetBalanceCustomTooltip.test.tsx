import React from 'react';
import { render, screen } from '@testing-library/react';
import { AssetBalanceCustomTooltip } from '../AssetBalanceGraph';

describe('AssetBalanceCustomTooltip', () => {
  it('active=true, payloadありの場合、ツールチップを表示する', () => {
    const payload = [
      {
        value: 1000000,
        payload: { percentage: 50.0, icon: '🏦', name: 'テスト銀行', value: 1000000 },
      },
    ];

    render(<AssetBalanceCustomTooltip active={true} payload={payload} />);

    expect(screen.getByText('テスト銀行')).toBeInTheDocument();
    expect(screen.getByText(/金額:/)).toBeInTheDocument();
    expect(screen.getByText(/構成比:/)).toBeInTheDocument();
  });

  it('active=falseの場合、何も表示しない', () => {
    const payload = [
      {
        value: 1000000,
        payload: { percentage: 50.0, icon: '🏦', name: 'テスト銀行', value: 1000000 },
      },
    ];

    const { container } = render(<AssetBalanceCustomTooltip active={false} payload={payload} />);
    expect(container.firstChild).toBeNull();
  });

  it('payloadが空の場合、何も表示しない', () => {
    const { container } = render(<AssetBalanceCustomTooltip active={true} payload={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('payloadがundefinedの場合、何も表示しない', () => {
    const { container } = render(<AssetBalanceCustomTooltip active={true} payload={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('payload[0]?.payloadがundefinedの場合、何も表示しない', () => {
    const payload = [
      {
        value: 1000000,
        payload: undefined as unknown as {
          percentage: number;
          icon: string;
          name: string;
          value: number;
        },
      },
    ];

    const { container } = render(<AssetBalanceCustomTooltip active={true} payload={payload} />);
    expect(container.firstChild).toBeNull();
  });
});
