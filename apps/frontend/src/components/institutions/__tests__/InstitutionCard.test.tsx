/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InstitutionCard } from '../InstitutionCard';
import { Institution, InstitutionType } from '@account-book/types';
import * as syncApi from '@/lib/api/sync';

// モック
jest.mock('@/lib/api/sync');

const mockInstitution: Institution = {
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
};

describe('InstitutionCard', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (syncApi.startSync as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
      summary: {
        totalInstitutions: 1,
        successCount: 1,
        failureCount: 0,
        totalFetched: 0,
        totalNew: 0,
        totalDuplicate: 0,
        duration: 100,
      },
    });
  });

  it('金融機関情報を正しく表示する', () => {
    render(<InstitutionCard institution={mockInstitution} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('テスト銀行')).toBeInTheDocument();
    expect(screen.getByText('普通預金')).toBeInTheDocument();
    expect(screen.getByText('正常')).toBeInTheDocument();
  });

  it('接続状態がfalseの場合、エラー状態を表示する', () => {
    const disconnectedInstitution: Institution = {
      ...mockInstitution,
      isConnected: false,
    };

    render(<InstitutionCard institution={disconnectedInstitution} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('エラー')).toBeInTheDocument();
  });

  it('最終同期日時を正しく表示する', () => {
    render(<InstitutionCard institution={mockInstitution} onUpdate={mockOnUpdate} />);

    expect(screen.getByText(/2024-01-01/)).toBeInTheDocument();
  });

  it('最終同期日時が未設定の場合、未同期を表示する', () => {
    const noSyncInstitution: Institution = {
      ...mockInstitution,
      lastSyncedAt: undefined,
    };

    render(<InstitutionCard institution={noSyncInstitution} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('未同期')).toBeInTheDocument();
  });

  it('金融機関タイプに応じたアイコンを表示する', () => {
    const bankInstitution: Institution = {
      ...mockInstitution,
      type: InstitutionType.BANK,
    };
    const { rerender } = render(
      <InstitutionCard institution={bankInstitution} onUpdate={mockOnUpdate} />
    );

    expect(screen.getByText('🏦')).toBeInTheDocument();

    const creditCardInstitution: Institution = {
      ...mockInstitution,
      type: InstitutionType.CREDIT_CARD,
    };
    rerender(<InstitutionCard institution={creditCardInstitution} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('💳')).toBeInTheDocument();

    const securitiesInstitution: Institution = {
      ...mockInstitution,
      type: InstitutionType.SECURITIES,
    };
    rerender(<InstitutionCard institution={securitiesInstitution} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('📈')).toBeInTheDocument();
  });

  it('今すぐ同期ボタンをクリックすると、同期APIを呼び出す', async () => {
    render(<InstitutionCard institution={mockInstitution} onUpdate={mockOnUpdate} />);

    const syncButton = screen.getByText('今すぐ同期');
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(syncApi.startSync).toHaveBeenCalledWith({
        institutionIds: ['inst-1'],
        forceFullSync: false,
      });
    });

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('同期中はボタンが無効化される', async () => {
    (syncApi.startSync as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // 永遠に解決しないPromise
    );

    render(<InstitutionCard institution={mockInstitution} onUpdate={mockOnUpdate} />);

    const syncButton = screen.getByText('今すぐ同期');
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(screen.getByText('同期中...')).toBeInTheDocument();
    });

    const disabledButton = screen.getByText('同期中...').closest('button');
    expect(disabledButton).toBeDisabled();
  });

  it('同期エラー時にエラーログを出力する', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (syncApi.startSync as jest.Mock).mockRejectedValue(new Error('Sync Error'));

    render(<InstitutionCard institution={mockInstitution} onUpdate={mockOnUpdate} />);

    const syncButton = screen.getByText('今すぐ同期');
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '同期処理中にエラーが発生しました:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('削除ボタンをクリックすると、削除確認モーダルが表示される', async () => {
    render(<InstitutionCard institution={mockInstitution} onUpdate={mockOnUpdate} />);

    const deleteButtons = screen.getAllByText('削除');
    fireEvent.click(deleteButtons[0]); // カード内の削除ボタン

    await waitFor(() => {
      expect(screen.getByText('金融機関を削除しますか？')).toBeInTheDocument();
    });

    // モーダル内のテキストを確認（strongタグ内のテキスト）
    const modalText = screen.getByText(/を削除しようとしています/);
    expect(modalText).toBeInTheDocument();
  });

  it('削除確認モーダルでキャンセルをクリックすると、モーダルが閉じる', () => {
    render(<InstitutionCard institution={mockInstitution} onUpdate={mockOnUpdate} />);

    const deleteButton = screen.getByText('削除');
    fireEvent.click(deleteButton);

    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('金融機関を削除しますか？')).not.toBeInTheDocument();
  });

  it('削除確認モーダルで削除をクリックすると、onUpdateが呼ばれる', async () => {
    render(<InstitutionCard institution={mockInstitution} onUpdate={mockOnUpdate} />);

    const deleteButtons = screen.getAllByText('削除');
    fireEvent.click(deleteButtons[0]); // カード内の削除ボタン

    await waitFor(() => {
      expect(screen.getByText('金融機関を削除しますか？')).toBeInTheDocument();
    });

    const confirmButtons = screen.getAllByText('削除');
    fireEvent.click(confirmButtons[confirmButtons.length - 1]); // モーダル内の削除ボタン

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('編集ボタンが表示される', () => {
    render(<InstitutionCard institution={mockInstitution} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('編集')).toBeInTheDocument();
  });

  it('口座情報がない場合、口座情報なしを表示する', () => {
    const noAccountInstitution: Institution = {
      ...mockInstitution,
      accounts: [],
    };

    render(<InstitutionCard institution={noAccountInstitution} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('口座情報なし')).toBeInTheDocument();
  });
});
