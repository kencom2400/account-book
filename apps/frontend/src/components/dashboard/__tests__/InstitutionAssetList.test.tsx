import React from 'react';
import { render, screen } from '@testing-library/react';
import { InstitutionAssetList } from '../InstitutionAssetList';
import type { InstitutionAssetDto } from '@/lib/api/aggregation';
import { InstitutionType, AccountType } from '@account-book/types';

describe('InstitutionAssetList', () => {
  const mockInstitutions: InstitutionAssetDto[] = [
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
        {
          accountId: 'acc-002',
          accountName: '定期預金',
          accountType: AccountType.TIME_DEPOSIT,
          balance: 2000000,
          currency: 'JPY',
        },
      ],
      total: 3234567,
      percentage: 61.8,
    },
    {
      institutionId: 'inst-002',
      institutionName: '楽天カード',
      institutionType: InstitutionType.CREDIT_CARD,
      icon: '💳',
      accounts: [
        {
          accountId: 'acc-003',
          accountName: 'メインカード',
          accountType: AccountType.CREDIT_CARD,
          balance: -123456,
          currency: 'JPY',
        },
      ],
      total: -123456,
      percentage: 0.0,
    },
  ];

  it('金融機関リストを表示する', () => {
    render(<InstitutionAssetList institutions={mockInstitutions} />);

    expect(screen.getByText('金融機関別資産')).toBeInTheDocument();
    expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
    expect(screen.getByText('楽天カード')).toBeInTheDocument();
  });

  it('資産と負債を分けて表示する', () => {
    render(<InstitutionAssetList institutions={mockInstitutions} />);

    expect(screen.getByText('資産')).toBeInTheDocument();
    expect(screen.getByText('負債')).toBeInTheDocument();
  });

  it('口座情報を表示する', () => {
    render(<InstitutionAssetList institutions={mockInstitutions} />);

    expect(screen.getByText('普通預金')).toBeInTheDocument();
    expect(screen.getByText('定期預金')).toBeInTheDocument();
    expect(screen.getByText('メインカード')).toBeInTheDocument();
  });

  it('残高を表示する', () => {
    render(<InstitutionAssetList institutions={mockInstitutions} />);

    expect(screen.getByText(/3,234,567/)).toBeInTheDocument();
    expect(screen.getAllByText(/123,456/).length).toBeGreaterThan(0);
  });

  it('データが空の場合は「データがありません」を表示する', () => {
    render(<InstitutionAssetList institutions={[]} />);

    expect(screen.getByText('データがありません')).toBeInTheDocument();
  });

  it('資産のみの場合は負債セクションを表示しない', () => {
    const assetsOnly: InstitutionAssetDto[] = [
      {
        institutionId: 'inst-001',
        institutionName: '三菱UFJ銀行',
        institutionType: InstitutionType.BANK,
        icon: '🏦',
        accounts: [],
        total: 1000000,
        percentage: 100.0,
      },
    ];

    render(<InstitutionAssetList institutions={assetsOnly} />);

    expect(screen.getByText('資産')).toBeInTheDocument();
    expect(screen.queryByText('負債')).not.toBeInTheDocument();
  });

  it('負債のみの場合は資産セクションを表示しない', () => {
    const liabilitiesOnly: InstitutionAssetDto[] = [
      {
        institutionId: 'inst-001',
        institutionName: '楽天カード',
        institutionType: InstitutionType.CREDIT_CARD,
        icon: '💳',
        accounts: [],
        total: -100000,
        percentage: 0.0,
      },
    ];

    render(<InstitutionAssetList institutions={liabilitiesOnly} />);

    expect(screen.queryByText('資産')).not.toBeInTheDocument();
    expect(screen.getByText('負債')).toBeInTheDocument();
  });
});
