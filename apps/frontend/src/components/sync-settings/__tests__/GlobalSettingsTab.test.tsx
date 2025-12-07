/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GlobalSettingsTab } from '../GlobalSettingsTab';
import * as syncSettingsApi from '@/lib/api/sync-settings';
import type { SyncSettingsDataDto } from '@account-book/types';
import { SyncIntervalType, TimeUnit } from '@account-book/types';

// モック
jest.mock('@/lib/api/sync-settings');

const mockSyncSettingsApi = syncSettingsApi as jest.Mocked<typeof syncSettingsApi>;

const mockSettings: SyncSettingsDataDto = {
  defaultInterval: {
    type: SyncIntervalType.STANDARD,
  },
  wifiOnly: false,
  batterySavingMode: false,
  autoRetry: true,
  maxRetryCount: 3,
  nightModeSuspend: false,
  nightModeStart: '22:00',
  nightModeEnd: '06:00',
};

describe('GlobalSettingsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSyncSettingsApi.getSyncSettings.mockResolvedValue(mockSettings);
  });

  it('ローディング状態を表示する', () => {
    mockSyncSettingsApi.getSyncSettings.mockImplementation(
      () => new Promise(() => {}) // 永遠に解決しないPromise
    );

    render(<GlobalSettingsTab />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('設定を正しく表示する', async () => {
    render(<GlobalSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('デフォルト同期間隔')).toBeInTheDocument();
    });

    // 標準（6時間ごと）が選択されていることを確認
    const standardRadio = screen.getByLabelText('標準（6時間ごと）【推奨】');
    expect(standardRadio).toBeChecked();
  });

  it('同期間隔を変更できる', async () => {
    render(<GlobalSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('デフォルト同期間隔')).toBeInTheDocument();
    });

    // 高頻度を選択
    const frequentRadio = screen.getByLabelText('高頻度（1時間ごと）');
    fireEvent.click(frequentRadio);

    expect(frequentRadio).toBeChecked();
  });

  it('カスタム間隔を設定できる', async () => {
    render(<GlobalSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('デフォルト同期間隔')).toBeInTheDocument();
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
    fireEvent.change(valueInput, { target: { value: '2' } });
    fireEvent.change(unitSelect, { target: { value: TimeUnit.HOURS } });

    expect(valueInput).toHaveValue(2);
  });

  it('詳細オプションを変更できる', async () => {
    render(<GlobalSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('詳細オプション')).toBeInTheDocument();
    });

    // Wi-Fiのみ同期を有効化
    const wifiOnlyCheckbox = screen.getByLabelText('Wi-Fi接続時のみ自動同期する');
    fireEvent.click(wifiOnlyCheckbox);

    expect(wifiOnlyCheckbox).toBeChecked();
  });

  it('夜間モードを有効化できる', async () => {
    render(<GlobalSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('詳細オプション')).toBeInTheDocument();
    });

    // 夜間モードを有効化
    const nightModeCheckbox = screen.getByLabelText('夜間モードを有効にする');
    fireEvent.click(nightModeCheckbox);

    await waitFor(() => {
      expect(nightModeCheckbox).toBeChecked();
    });

    // 時刻入力フィールドが表示されることを確認
    const startTimeInput = screen.getByDisplayValue('22:00');
    const endTimeInput = screen.getByDisplayValue('06:00');

    expect(startTimeInput).toBeInTheDocument();
    expect(endTimeInput).toBeInTheDocument();
  });

  it('設定を保存できる', async () => {
    const updatedSettings: SyncSettingsDataDto = {
      ...mockSettings,
      defaultInterval: {
        type: SyncIntervalType.FREQUENT,
      },
      wifiOnly: true,
    };

    mockSyncSettingsApi.updateSyncSettings.mockResolvedValue(updatedSettings);

    render(<GlobalSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('デフォルト同期間隔')).toBeInTheDocument();
    });

    // 高頻度を選択
    const frequentRadio = screen.getByLabelText('高頻度（1時間ごと）');
    fireEvent.click(frequentRadio);

    // Wi-Fiのみ同期を有効化
    const wifiOnlyCheckbox = screen.getByLabelText('Wi-Fi接続時のみ自動同期する');
    fireEvent.click(wifiOnlyCheckbox);

    // 保存ボタンをクリック
    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSyncSettingsApi.updateSyncSettings).toHaveBeenCalledWith({
        defaultInterval: {
          type: SyncIntervalType.FREQUENT,
        },
        wifiOnly: true,
        batterySavingMode: false,
        autoRetry: true,
        maxRetryCount: 3,
        nightModeSuspend: false,
      });
    });

    // 成功メッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('設定を保存しました')).toBeInTheDocument();
    });
  });

  it('バリデーションエラーを表示する', async () => {
    mockSyncSettingsApi.updateSyncSettings.mockRejectedValue(new Error('不正な同期間隔'));

    render(<GlobalSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('デフォルト同期間隔')).toBeInTheDocument();
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

  it('夜間モードの時刻が同じ場合、エラーを表示する', async () => {
    render(<GlobalSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('詳細オプション')).toBeInTheDocument();
    });

    // 夜間モードを有効化
    const nightModeCheckbox = screen.getByLabelText('夜間モードを有効にする');
    fireEvent.click(nightModeCheckbox);

    await waitFor(() => {
      const startTimeInput = screen.getByDisplayValue('22:00');
      const endTimeInput = screen.getByDisplayValue('06:00');

      // 同じ時刻に設定
      fireEvent.change(startTimeInput, { target: { value: '22:00' } });
      fireEvent.change(endTimeInput, { target: { value: '22:00' } });
    });

    // 保存ボタンをクリック
    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('夜間モードの開始時刻と終了時刻は異なる必要があります')
      ).toBeInTheDocument();
    });
  });

  it('エラー時にエラーメッセージを表示する', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSyncSettingsApi.getSyncSettings.mockRejectedValue(new Error('API Error'));

    render(<GlobalSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('保存中は保存ボタンが無効化される', async () => {
    mockSyncSettingsApi.updateSyncSettings.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockSettings), 100))
    );

    render(<GlobalSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('デフォルト同期間隔')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    // 保存中はボタンが無効化される
    expect(saveButton).toBeDisabled();
    expect(screen.getByText('保存中...')).toBeInTheDocument();
  });

  it('自動リトライが有効な場合、最大リトライ回数を設定できる', async () => {
    render(<GlobalSettingsTab />);

    await waitFor(() => {
      expect(screen.getByText('詳細オプション')).toBeInTheDocument();
    });

    // 自動リトライが有効なことを確認
    const autoRetryCheckbox = screen.getByLabelText('エラー時は自動リトライする');
    expect(autoRetryCheckbox).toBeChecked();

    // 最大リトライ回数の入力フィールドが表示されることを確認
    const maxRetryCountInput = screen.getByDisplayValue('3');
    expect(maxRetryCountInput).toBeInTheDocument();

    // 値を変更
    fireEvent.change(maxRetryCountInput, { target: { value: '5' } });
    expect(maxRetryCountInput).toHaveValue(5);
  });
});
