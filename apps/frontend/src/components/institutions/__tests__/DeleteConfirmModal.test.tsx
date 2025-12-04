/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DeleteConfirmModal } from '../DeleteConfirmModal';
import { Institution, InstitutionType } from '@account-book/types';

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
  accounts: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('DeleteConfirmModal', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('モーダルが正しく表示される', () => {
    render(
      <DeleteConfirmModal
        institution={mockInstitution}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('金融機関を削除しますか？')).toBeInTheDocument();
    expect(screen.getByText('テスト銀行')).toBeInTheDocument();
    expect(
      screen.getByText(/を削除しようとしています。この操作は取り消せません。/)
    ).toBeInTheDocument();
  });

  it('削除ボタンをクリックすると、onConfirmが呼ばれる', () => {
    render(
      <DeleteConfirmModal
        institution={mockInstitution}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const modal = screen.getByRole('dialog');
    const deleteButton = within(modal).getByRole('button', { name: '削除' });
    fireEvent.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('キャンセルボタンをクリックすると、onCancelが呼ばれる', () => {
    render(
      <DeleteConfirmModal
        institution={mockInstitution}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('オーバーレイをクリックすると、onCancelが呼ばれる', () => {
    render(
      <DeleteConfirmModal
        institution={mockInstitution}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const overlay = screen.getByLabelText('モーダルを閉じる');
    fireEvent.click(overlay);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('Escapeキーを押すと、onCancelが呼ばれる', () => {
    render(
      <DeleteConfirmModal
        institution={mockInstitution}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const overlay = screen.getByLabelText('モーダルを閉じる');
    fireEvent.keyDown(overlay, { key: 'Escape' });

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('onConfirmがPromiseを返す場合でも正しく動作する', async () => {
    const asyncOnConfirm = jest.fn().mockResolvedValue(undefined);

    render(
      <DeleteConfirmModal
        institution={mockInstitution}
        onConfirm={asyncOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const modal = screen.getByRole('dialog');
    const deleteButton = within(modal).getByRole('button', { name: '削除' });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(asyncOnConfirm).toHaveBeenCalled();
    });

    // モック関数が呼ばれたことを確認
    expect(asyncOnConfirm).toHaveBeenCalledTimes(1);
  });
});
