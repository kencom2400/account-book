/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InstitutionSettingsTab } from '../InstitutionSettingsTab';
import * as syncSettingsApi from '@/lib/api/sync-settings';
import * as institutionsApi from '@/lib/api/institutions';
import type { InstitutionSyncSettingsResponseDto, Institution } from '@account-book/types';
import {
  SyncIntervalType,
  TimeUnit,
  InstitutionSyncStatus,
  InstitutionType,
} from '@account-book/types';

// モック
jest.mock('@/lib/api/sync-settings');
jest.mock('@/lib/api/institutions');

const mockSyncSettingsApi = syncSettingsApi as jest.Mocked<typeof syncSettingsApi>;
const mockInstitutionsApi = institutionsApi as jest.Mocked<typeof institutionsApi>;

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
    accounts: [],
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
    isConnected: true,
    lastSyncedAt: new Date('2024-01-01T00:00:00Z'),
    accounts: [],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

const mockSettings: InstitutionSyncSettingsResponseDto[] = [
  {
    id: 'inst-sync-1',
    institutionId: 'inst-1',
    interval: {
      type: SyncIntervalType.STANDARD,
    },
    enabled: true,
    lastSyncedAt: '2024-01-01T10:00:00Z',
    nextSyncAt: '2024-01-01T16:00:00Z',
    syncStatus: InstitutionSyncStatus.IDLE,
    errorCount: 0,
    lastError: null,
  },
  {
    id: 'inst-sync-2',
    institutionId: 'inst-2',
    interval: {
      type: SyncIntervalType.INFREQUENT,
    },
    enabled: true,
    lastSyncedAt: '2024-01-01T00:00:00Z',
    nextSyncAt: '2024-01-02T00:00:00Z',
    syncStatus: InstitutionSyncStatus.IDLE,
    errorCount: 0,
    lastError: null,
  },
];

describe('InstitutionSettingsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSyncSettingsApi.getAllInstitutionSyncSettings.mockResolvedValue(mockSettings);
    mockInstitutionsApi.getInstitutions.mockResolvedValue(mockInstitutions);
  });

  it('ローディング状態を表示する', () => {
    mockSyncSettingsApi.getAllInstitutionSyncSettings.mockImplementation(
      () => new Promise(() => {}) // 永遠に解決しないPromise
    );

    render(<InstitutionSettingsTab />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('金融機関設定一覧を正しく表示する', async () => {
    render(<InstitutionSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
      expect(screen.getByText('テストクレジットカード')).toBeInTheDocument();
    });

    // 同期間隔が表示されることを確認
    expect(screen.getByText('標準（6時間ごと）')).toBeInTheDocument();
    expect(screen.getByText('低頻度（1日1回）')).toBeInTheDocument();
  });

  it('金融機関設定が0件の場合、空状態を表示する', async () => {
    mockSyncSettingsApi.getAllInstitutionSyncSettings.mockResolvedValue([]);

    render(<InstitutionSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('金融機関の設定がありません')).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSyncSettingsApi.getAllInstitutionSyncSettings.mockRejectedValue(new Error('API Error'));

    render(<InstitutionSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('編集ボタンをクリックすると編集フォームが表示される', async () => {
    render(<InstitutionSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
    });

    // 編集ボタンをクリック
    const editButtons = screen.getAllByText('編集');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      // 編集フォームが表示されることを確認
      expect(screen.getByText('同期間隔')).toBeInTheDocument();
      expect(screen.getByLabelText('標準（6時間ごと）')).toBeInTheDocument();
    });
  });

  it('編集フォームで同期間隔を変更できる', async () => {
    render(<InstitutionSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
    });

    // 編集ボタンをクリック
    const editButtons = screen.getAllByText('編集');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('同期間隔')).toBeInTheDocument();
    });

    // 高頻度を選択
    const frequentRadio = screen.getByLabelText('高頻度（1時間ごと）');
    fireEvent.click(frequentRadio);

    expect(frequentRadio).toBeChecked();
  });

  it('編集フォームでカスタム間隔を設定できる', async () => {
    render(<InstitutionSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
    });

    // 編集ボタンをクリック
    const editButtons = screen.getAllByText('編集');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('同期間隔')).toBeInTheDocument();
    });

    // カスタムを選択
    const customRadio = screen.getByLabelText('カスタム');
    fireEvent.click(customRadio);

    await waitFor(() => {
      expect(customRadio).toBeChecked();
    });

    // カスタム入力フィールドが表示されることを確認
    const valueInput = screen.getByDisplayValue('6');
    const unitSelect = screen.getByDisplayValue('時間');

    expect(valueInput).toBeInTheDocument();
    expect(unitSelect).toBeInTheDocument();

    // 値を変更
    fireEvent.change(valueInput, { target: { value: '30' } });
    fireEvent.change(unitSelect, { target: { value: TimeUnit.MINUTES } });

    expect(valueInput).toHaveValue(30);
  });

  it('編集フォームで有効/無効を切り替えられる', async () => {
    render(<InstitutionSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
    });

    // 編集ボタンをクリック
    const editButtons = screen.getAllByText('編集');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('同期間隔')).toBeInTheDocument();
    });

    // 有効チェックボックスを無効化
    const enabledCheckbox = screen.getByLabelText('有効');
    fireEvent.click(enabledCheckbox);

    expect(enabledCheckbox).not.toBeChecked();
  });

  it('編集フォームで保存できる', async () => {
    const updatedSetting: InstitutionSyncSettingsResponseDto = {
      ...mockSettings[0],
      interval: {
        type: SyncIntervalType.FREQUENT,
      },
    };

    mockSyncSettingsApi.updateInstitutionSyncSettings.mockResolvedValue(updatedSetting);
    mockSyncSettingsApi.getAllInstitutionSyncSettings.mockResolvedValue([
      updatedSetting,
      mockSettings[1],
    ]);

    render(<InstitutionSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
    });

    // 編集ボタンをクリック
    const editButtons = screen.getAllByText('編集');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('同期間隔')).toBeInTheDocument();
    });

    // 高頻度を選択
    const frequentRadio = screen.getByLabelText('高頻度（1時間ごと）');
    fireEvent.click(frequentRadio);

    // 保存ボタンをクリック
    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSyncSettingsApi.updateInstitutionSyncSettings).toHaveBeenCalledWith('inst-1', {
        interval: {
          type: SyncIntervalType.FREQUENT,
        },
        enabled: true,
      });
    });

    // 編集フォームが閉じられることを確認
    await waitFor(() => {
      expect(screen.queryByText('同期間隔')).not.toBeInTheDocument();
    });
  });

  it('編集フォームでキャンセルできる', async () => {
    render(<InstitutionSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
    });

    // 編集ボタンをクリック
    const editButtons = screen.getAllByText('編集');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('同期間隔')).toBeInTheDocument();
    });

    // キャンセルボタンをクリック
    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    // 編集フォームが閉じられることを確認
    await waitFor(() => {
      expect(screen.queryByText('同期間隔')).not.toBeInTheDocument();
    });
  });

  it('バリデーションエラーを表示する', async () => {
    render(<InstitutionSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
    });

    // 編集ボタンをクリック
    const editButtons = screen.getAllByText('編集');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('同期間隔')).toBeInTheDocument();
    });

    // カスタム間隔に無効な値を設定
    const customRadio = screen.getByLabelText('カスタム');
    fireEvent.click(customRadio);

    await waitFor(() => {
      const valueInput = screen.getByDisplayValue('6');
      fireEvent.change(valueInput, { target: { value: '1' } });
    });

    // 保存ボタンをクリック
    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('カスタム間隔は5分以上を指定してください')).toBeInTheDocument();
    });
  });

  it('保存エラー時にエラーメッセージを表示する', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSyncSettingsApi.updateInstitutionSyncSettings.mockRejectedValue(new Error('保存エラー'));

    render(<InstitutionSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
    });

    // 編集ボタンをクリック
    const editButtons = screen.getAllByText('編集');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('同期間隔')).toBeInTheDocument();
    });

    // 保存ボタンをクリック
    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('保存エラー')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('同期ステータスを正しく表示する', async () => {
    const errorSetting: InstitutionSyncSettingsResponseDto = {
      ...mockSettings[0],
      syncStatus: InstitutionSyncStatus.ERROR,
      lastError: '接続エラー',
    };

    mockSyncSettingsApi.getAllInstitutionSyncSettings.mockResolvedValue([errorSetting]);

    render(<InstitutionSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('エラー')).toBeInTheDocument();
      expect(screen.getByText('エラー: 接続エラー')).toBeInTheDocument();
    });
  });

  it('最終同期日時と次回同期予定日時を表示する', async () => {
    render(<InstitutionSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('テスト銀行')).toBeInTheDocument();
    });

    // 日時が表示されることを確認（フォーマットは実装に依存）
    // 複数の金融機関があるため、getAllByTextを使用
    const lastSyncTexts = screen.getAllByText(/最終同期/);
    const nextSyncTexts = screen.getAllByText(/次回同期/);

    expect(lastSyncTexts.length).toBeGreaterThan(0);
    expect(nextSyncTexts.length).toBeGreaterThan(0);
  });
});
