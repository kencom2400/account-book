/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InstitutionList } from '../InstitutionList';
import { Institution, InstitutionType } from '@account-book/types';
import * as institutionsApi from '@/lib/api/institutions';
import { useRouter } from 'next/navigation';

// モック
jest.mock('@/lib/api/institutions');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const mockInstitutions: Institution[] = [
  {
    id: 'inst-1',
    name: 'テスト銀行',
    type: InstitutionType.BANK,
    credentials: {
      encrypted: 'encrypted-data',
      iv: 'iv',
      authTag: 'auth-tag',
      algorithm: 'aes-256-gcm',
      version: '1.0',
    },
    isConnected: true,
    lastSyncedAt: new Date('2024-01-01T10:00:00Z'),
    accounts: [
      {
        id: 'acc-1',
        accountNumber: '1234567',
        accountName: '普通預金',
        balance: 1000000,
        currency: 'JPY',
      },
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'inst-2',
    name: 'テストクレジットカード',
    type: InstitutionType.CREDIT_CARD,
    credentials: {
      encrypted: 'encrypted-data',
      iv: 'iv',
      authTag: 'auth-tag',
      algorithm: 'aes-256-gcm',
      version: '1.0',
    },
    isConnected: false,
    lastSyncedAt: undefined,
    accounts: [],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

describe('InstitutionList', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    (institutionsApi.getInstitutions as jest.Mock).mockResolvedValue(mockInstitutions);
  });

  it('ローディング状態を表示する', () => {
    (institutionsApi.getInstitutions as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // 永遠に解決しないPromise
    );

    render(<InstitutionList />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('金融機関一覧を正しく表示する', async () => {
    render(<InstitutionList />);

    await waitFor(() => {
      expect(screen.getByText('金融機関設定')).toBeInTheDocument();
      expect(screen.getByText('登録済みの金融機関を管理します')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
      expect(screen.getByText('テストクレジットカード')).toBeInTheDocument();
    });
  });

  it('金融機関が0件の場合、空状態を表示する', async () => {
    (institutionsApi.getInstitutions as jest.Mock).mockResolvedValue([]);

    render(<InstitutionList />);

    await waitFor(() => {
      expect(screen.getByText('金融機関が登録されていません')).toBeInTheDocument();
      expect(
        screen.getByText('金融機関を追加して、自動で取引履歴を取得しましょう')
      ).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (institutionsApi.getInstitutions as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<InstitutionList />);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('金融機関を追加ボタンをクリックすると、追加画面に遷移する', async () => {
    render(<InstitutionList />);

    await waitFor(() => {
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: '金融機関を追加' });
    fireEvent.click(addButtons[0]); // ヘッダー内のボタン

    expect(mockPush).toHaveBeenCalledWith('/banks/add');
  });

  it('更新ボタンをクリックすると、データを再取得する', async () => {
    render(<InstitutionList />);

    await waitFor(() => {
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('更新');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(institutionsApi.getInstitutions).toHaveBeenCalledTimes(2); // 初回 + リフレッシュ
    });
  });

  it('空状態で金融機関を追加ボタンをクリックすると、追加画面に遷移する', async () => {
    (institutionsApi.getInstitutions as jest.Mock).mockResolvedValue([]);

    render(<InstitutionList />);

    await waitFor(() => {
      expect(screen.getByText('金融機関が登録されていません')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: '金融機関を追加' });
    fireEvent.click(addButtons[addButtons.length - 1]); // 空状態のボタン

    expect(mockPush).toHaveBeenCalledWith('/banks/add');
  });
});
