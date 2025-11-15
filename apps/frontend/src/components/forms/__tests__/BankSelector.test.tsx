/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BankSelector } from '../BankSelector';
import { Bank, BankCategory } from '@account-book/types';
import * as institutionsApi from '@/lib/api/institutions';

// モック
jest.mock('@/lib/api/institutions');

const mockBanks: Bank[] = [
  {
    id: 'bank_mufg',
    code: '0005',
    name: '三菱UFJ銀行',
    category: BankCategory.MEGA_BANK,
    isSupported: true,
  },
  {
    id: 'bank_smbc',
    code: '0009',
    name: '三井住友銀行',
    category: BankCategory.MEGA_BANK,
    isSupported: true,
  },
  {
    id: 'bank_rakuten',
    code: '0036',
    name: '楽天銀行',
    category: BankCategory.ONLINE_BANK,
    isSupported: true,
  },
  {
    id: 'bank_yokohama',
    code: '0138',
    name: '横浜銀行',
    category: BankCategory.REGIONAL_BANK,
    isSupported: true,
  },
];

describe('BankSelector', () => {
  const mockOnSelectBank = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (institutionsApi.getSupportedBanks as jest.Mock).mockResolvedValue(
      mockBanks,
    );
  });

  it('should render loading state initially', () => {
    render(<BankSelector onSelectBank={mockOnSelectBank} />);

    const loadingElement = screen.getByRole('status', { hidden: true });
    expect(loadingElement).toBeInTheDocument();
  });

  it('should display banks after loading', async () => {
    render(<BankSelector onSelectBank={mockOnSelectBank} />);

    await waitFor(() => {
      expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
      expect(screen.getByText('三井住友銀行')).toBeInTheDocument();
      expect(screen.getByText('楽天銀行')).toBeInTheDocument();
      expect(screen.getByText('横浜銀行')).toBeInTheDocument();
    });
  });

  it('should display search box', async () => {
    render(<BankSelector onSelectBank={mockOnSelectBank} />);

    await waitFor(() => {
      const searchBox = screen.getByPlaceholderText(
        '銀行名または銀行コードで検索',
      );
      expect(searchBox).toBeInTheDocument();
    });
  });

  it('should display category tabs', async () => {
    render(<BankSelector onSelectBank={mockOnSelectBank} />);

    await waitFor(() => {
      expect(screen.getByText('すべて')).toBeInTheDocument();
      expect(screen.getByText('メガバンク')).toBeInTheDocument();
      expect(screen.getByText('地方銀行')).toBeInTheDocument();
      expect(screen.getByText('ネット銀行')).toBeInTheDocument();
    });
  });

  it('should filter banks by category', async () => {
    render(<BankSelector onSelectBank={mockOnSelectBank} />);

    await waitFor(() => {
      expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
    });

    // メガバンクタブをクリック
    fireEvent.click(screen.getByText('メガバンク'));

    await waitFor(() => {
      expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
      expect(screen.getByText('三井住友銀行')).toBeInTheDocument();
      expect(screen.queryByText('楽天銀行')).not.toBeInTheDocument();
      expect(screen.queryByText('横浜銀行')).not.toBeInTheDocument();
    });
  });

  it('should filter banks by search term', async () => {
    render(<BankSelector onSelectBank={mockOnSelectBank} />);

    await waitFor(() => {
      expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
    });

    const searchBox = screen.getByPlaceholderText(
      '銀行名または銀行コードで検索',
    );
    fireEvent.change(searchBox, { target: { value: '三菱' } });

    await waitFor(() => {
      expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
      expect(screen.queryByText('三井住友銀行')).not.toBeInTheDocument();
      expect(screen.queryByText('楽天銀行')).not.toBeInTheDocument();
    });
  });

  it('should search by bank code', async () => {
    render(<BankSelector onSelectBank={mockOnSelectBank} />);

    await waitFor(() => {
      expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
    });

    const searchBox = screen.getByPlaceholderText(
      '銀行名または銀行コードで検索',
    );
    fireEvent.change(searchBox, { target: { value: '0005' } });

    await waitFor(() => {
      expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
      expect(screen.queryByText('三井住友銀行')).not.toBeInTheDocument();
    });
  });

  it('should call onSelectBank when bank is clicked', async () => {
    render(<BankSelector onSelectBank={mockOnSelectBank} />);

    await waitFor(() => {
      expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('三菱UFJ銀行'));

    expect(mockOnSelectBank).toHaveBeenCalledWith(mockBanks[0]);
  });

  it('should highlight selected bank', async () => {
    render(
      <BankSelector
        onSelectBank={mockOnSelectBank}
        selectedBank={mockBanks[0]}
      />,
    );

    await waitFor(() => {
      const bankButton = screen.getByText('三菱UFJ銀行').closest('button');
      expect(bankButton).toHaveClass('border-blue-600');
    });
  });

  it('should display "no results" message when search returns nothing', async () => {
    render(<BankSelector onSelectBank={mockOnSelectBank} />);

    await waitFor(() => {
      expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
    });

    const searchBox = screen.getByPlaceholderText(
      '銀行名または銀行コードで検索',
    );
    fireEvent.change(searchBox, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(
        screen.getByText('該当する銀行が見つかりませんでした'),
      ).toBeInTheDocument();
    });
  });

  it('should display error message when API fails', async () => {
    (institutionsApi.getSupportedBanks as jest.Mock).mockRejectedValue(
      new Error('API Error'),
    );

    render(<BankSelector onSelectBank={mockOnSelectBank} />);

    await waitFor(() => {
      expect(
        screen.getByText('銀行一覧の取得に失敗しました'),
      ).toBeInTheDocument();
    });
  });

  it('should combine category filter and search', async () => {
    render(<BankSelector onSelectBank={mockOnSelectBank} />);

    await waitFor(() => {
      expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
    });

    // メガバンクタブをクリック
    fireEvent.click(screen.getByText('メガバンク'));

    // 検索
    const searchBox = screen.getByPlaceholderText(
      '銀行名または銀行コードで検索',
    );
    fireEvent.change(searchBox, { target: { value: '三菱' } });

    await waitFor(() => {
      expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument();
      expect(screen.queryByText('三井住友銀行')).not.toBeInTheDocument();
      expect(screen.queryByText('楽天銀行')).not.toBeInTheDocument();
    });
  });

  it('should display bank code with each bank', async () => {
    render(<BankSelector onSelectBank={mockOnSelectBank} />);

    await waitFor(() => {
      expect(screen.getByText('銀行コード: 0005')).toBeInTheDocument();
      expect(screen.getByText('銀行コード: 0009')).toBeInTheDocument();
    });
  });

  it('should display bank category with each bank', async () => {
    render(<BankSelector onSelectBank={mockOnSelectBank} />);

    await waitFor(() => {
      expect(screen.getAllByText('メガバンク').length).toBeGreaterThan(1);
      expect(screen.getByText('ネット銀行')).toBeInTheDocument();
      expect(screen.getByText('地方銀行')).toBeInTheDocument();
    });
  });
});

