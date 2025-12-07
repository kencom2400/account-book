import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AssetBalanceContainer } from '../AssetBalanceContainer';
import { aggregationApi } from '@/lib/api/aggregation';
import { InstitutionType, AccountType } from '@account-book/types';
import type { AssetBalanceResponse } from '@/lib/api/aggregation';

// APIモック
jest.mock('@/lib/api/aggregation', () => ({
  aggregationApi: {
    getAssetBalance: jest.fn(),
  },
}));

const mockGetAssetBalance = aggregationApi.getAssetBalance as jest.MockedFunction<
  typeof aggregationApi.getAssetBalance
>;

describe('AssetBalanceContainer', () => {
  const mockData: AssetBalanceResponse = {
    totalAssets: 5358023,
    totalLiabilities: 123456,
    netWorth: 5234567,
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
        total: 3234567,
        percentage: 60.4,
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ローディング中は「読み込み中...」を表示する', async () => {
    mockGetAssetBalance.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockData), 100);
        })
    );

    render(<AssetBalanceContainer />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
    });
  });

  it('データ取得成功時にコンポーネントを表示する', async () => {
    mockGetAssetBalance.mockResolvedValue(mockData);

    render(<AssetBalanceContainer />);

    await waitFor(() => {
      expect(screen.getByText('純資産')).toBeInTheDocument();
    });

    expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
  });

  it('エラー発生時にエラーメッセージを表示する', async () => {
    mockGetAssetBalance.mockRejectedValue(new Error('API Error'));

    render(<AssetBalanceContainer />);

    await waitFor(() => {
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  it('データがnullの場合は「データがありません」を表示する', async () => {
    mockGetAssetBalance.mockResolvedValue(null as unknown as AssetBalanceResponse);

    render(<AssetBalanceContainer />);

    await waitFor(() => {
      expect(screen.getByText('データがありません')).toBeInTheDocument();
    });
  });

  it('asOfDateが指定された場合、APIに正しい日付を渡す', async () => {
    mockGetAssetBalance.mockResolvedValue(mockData);

    const asOfDate = new Date('2025-01-20T12:00:00.000Z');

    render(<AssetBalanceContainer asOfDate={asOfDate} />);

    await waitFor(() => {
      expect(mockGetAssetBalance).toHaveBeenCalledWith('2025-01-20');
    });
  });

  it('asOfDateが未指定の場合、APIにundefinedを渡す', async () => {
    mockGetAssetBalance.mockResolvedValue(mockData);

    render(<AssetBalanceContainer />);

    await waitFor(() => {
      expect(mockGetAssetBalance).toHaveBeenCalledWith(undefined);
    });
  });

  it('asOfDateが変更された場合、データを再取得する', async () => {
    mockGetAssetBalance.mockResolvedValue(mockData);

    const { rerender } = render(<AssetBalanceContainer />);

    await waitFor(() => {
      expect(mockGetAssetBalance).toHaveBeenCalledTimes(1);
    });

    const newAsOfDate = new Date('2025-01-21T12:00:00.000Z');
    rerender(<AssetBalanceContainer asOfDate={newAsOfDate} />);

    await waitFor(() => {
      expect(mockGetAssetBalance).toHaveBeenCalledTimes(2);
      expect(mockGetAssetBalance).toHaveBeenLastCalledWith('2025-01-21');
    });
  });
});
