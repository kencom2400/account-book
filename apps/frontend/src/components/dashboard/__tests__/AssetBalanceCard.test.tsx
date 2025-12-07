import React from 'react';
import { render, screen } from '@testing-library/react';
import { AssetBalanceCard } from '../AssetBalanceCard';
import type { AssetBalanceResponse } from '@/lib/api/aggregation';
import { InstitutionType, AccountType } from '@account-book/types';

describe('AssetBalanceCard', () => {
  const mockData: AssetBalanceResponse = {
    totalAssets: 5234567,
    totalLiabilities: 123456,
    netWorth: 5111111,
    institutions: [
      {
        institutionId: 'inst-001',
        institutionName: '三菱UFJ銀行',
        institutionType: InstitutionType.BANK,
        icon: '🏦',
        accounts: [
          {
            accountId: 'acc-001',
            accountName: '普通預金',
            accountType: AccountType.SAVINGS,
            balance: 1234567,
            currency: 'JPY',
          },
        ],
        total: 1234567,
        percentage: 23.6,
      },
    ],
    asOfDate: '2025-01-27T00:00:00.000Z',
    previousMonth: {
      diff: 0,
      rate: 0,
    },
    previousYear: {
      diff: 0,
      rate: 0,
    },
  };

  it('総資産、総負債、純資産を表示する', () => {
    render(<AssetBalanceCard data={mockData} />);

    expect(screen.getAllByText('総資産').length).toBeGreaterThan(0);
    expect(screen.getByText(/5,234,567/)).toBeInTheDocument();
    expect(screen.getByText('総負債')).toBeInTheDocument();
    expect(screen.getByText(/123,456/)).toBeInTheDocument();
    expect(screen.getByText('純資産')).toBeInTheDocument();
    expect(screen.getByText(/5,111,111/)).toBeInTheDocument();
  });

  it('基準日を表示する', () => {
    render(<AssetBalanceCard data={mockData} />);

    expect(screen.getByText(/2025年1月27日時点/)).toBeInTheDocument();
  });

  it('前月比・前年比が0の場合は表示しない', () => {
    render(<AssetBalanceCard data={mockData} />);

    expect(screen.queryByText('前月比')).not.toBeInTheDocument();
    expect(screen.queryByText('前年比')).not.toBeInTheDocument();
  });

  it('前月比・前年比が0以外の場合は表示する', () => {
    const dataWithComparison: AssetBalanceResponse = {
      ...mockData,
      previousMonth: {
        diff: 100000,
        rate: 2.0,
      },
      previousYear: {
        diff: 500000,
        rate: 10.0,
      },
    };

    render(<AssetBalanceCard data={dataWithComparison} />);

    expect(screen.getByText('前月比')).toBeInTheDocument();
    expect(screen.getByText(/100,000/)).toBeInTheDocument();
    expect(screen.getByText(/2.0%/)).toBeInTheDocument();
    expect(screen.getByText('前年比')).toBeInTheDocument();
    expect(screen.getByText(/500,000/)).toBeInTheDocument();
    expect(screen.getByText(/10.0%/)).toBeInTheDocument();
  });

  it('前月比がマイナスの場合は赤色で表示する', () => {
    const dataWithNegativeComparison: AssetBalanceResponse = {
      ...mockData,
      previousMonth: {
        diff: -100000,
        rate: -2.0,
      },
      previousYear: {
        diff: 0,
        rate: 0,
      },
    };

    render(<AssetBalanceCard data={dataWithNegativeComparison} />);

    const previousMonthText = screen.getByText(/前月比/);
    const previousMonthValue = previousMonthText.closest('div')?.querySelector('.text-red-600');
    expect(previousMonthValue).toBeInTheDocument();
  });

  it('純資産がマイナスの場合は赤色で表示する', () => {
    const dataWithNegativeNetWorth: AssetBalanceResponse = {
      ...mockData,
      totalAssets: 1000000,
      totalLiabilities: 2000000,
      netWorth: -1000000,
    };

    render(<AssetBalanceCard data={dataWithNegativeNetWorth} />);

    const netWorthLabel = screen.getByText('純資産');
    const netWorthValue = netWorthLabel.closest('div')?.querySelector('.text-red-600');
    expect(netWorthValue).toBeInTheDocument();
    expect(netWorthValue?.textContent).toContain('1,000,000');
  });
});
