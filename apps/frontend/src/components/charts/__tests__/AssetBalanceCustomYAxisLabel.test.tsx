import React from 'react';
import { render } from '@testing-library/react';
import { AssetBalanceCustomYAxisLabel } from '../AssetBalanceGraph';

describe('AssetBalanceCustomYAxisLabel', () => {
  const mockGraphData = [
    { name: '三菱UFJ銀行', value: 3234567, percentage: 61.8, icon: '🏦' },
    { name: 'SBI証券', value: 2000000, percentage: 38.2, icon: '📈' },
  ];

  it('institutionが見つかる場合、アイコンと名前を表示する', () => {
    const { container } = render(
      <AssetBalanceCustomYAxisLabel
        y={100}
        payload={{ value: '三菱UFJ銀行' }}
        graphData={mockGraphData}
      />
    );

    const textElement = container.querySelector('text');
    expect(textElement).toBeInTheDocument();
    expect(textElement?.textContent).toContain('🏦');
    expect(textElement?.textContent).toContain('三菱UFJ銀行');
  });

  it('institutionが見つからない場合、名前のみを表示する', () => {
    const { container } = render(
      <AssetBalanceCustomYAxisLabel
        y={100}
        payload={{ value: '存在しない銀行' }}
        graphData={mockGraphData}
      />
    );

    const textElement = container.querySelector('text');
    expect(textElement).toBeInTheDocument();
    expect(textElement?.textContent).toBe('存在しない銀行');
    expect(textElement?.textContent).not.toContain('🏦');
  });

  it('payloadがundefinedの場合、何も表示しない', () => {
    const { container } = render(
      <AssetBalanceCustomYAxisLabel y={100} payload={undefined} graphData={mockGraphData} />
    );

    const textElement = container.querySelector('text');
    expect(textElement).toBeInTheDocument();
    expect(textElement?.textContent).toBe('');
  });

  it('graphDataがundefinedの場合、名前のみを表示する', () => {
    const { container } = render(
      <AssetBalanceCustomYAxisLabel
        y={100}
        payload={{ value: '三菱UFJ銀行' }}
        graphData={undefined}
      />
    );

    const textElement = container.querySelector('text');
    expect(textElement).toBeInTheDocument();
    expect(textElement?.textContent).toBe('三菱UFJ銀行');
  });
});
