import {
  getSyncSettings,
  updateSyncSettings,
  getAllInstitutionSyncSettings,
  getInstitutionSyncSettings,
  updateInstitutionSyncSettings,
} from '../sync-settings';
import { apiClient } from '../client';
import type { SyncSettingsDataDto, InstitutionSyncSettingsResponseDto } from '@account-book/types';
import { SyncIntervalType, TimeUnit, InstitutionSyncStatus } from '@account-book/types';

// モック
jest.mock('../client');

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('sync-settings API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSyncSettings', () => {
    it('全体設定を取得する', async () => {
      const mockResponse: SyncSettingsDataDto = {
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

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getSyncSettings();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/sync-settings');
      expect(result).toEqual(mockResponse);
    });

    it('エラー時に例外をスローする', async () => {
      const error = new Error('API Error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(getSyncSettings()).rejects.toThrow('API Error');
    });
  });

  describe('updateSyncSettings', () => {
    it('全体設定を更新する', async () => {
      const request = {
        defaultInterval: {
          type: SyncIntervalType.FREQUENT,
        },
        wifiOnly: true,
        batterySavingMode: false,
        autoRetry: true,
        maxRetryCount: 5,
        nightModeSuspend: true,
        nightModeStart: '23:00',
        nightModeEnd: '07:00',
      };

      const mockResponse: SyncSettingsDataDto = {
        defaultInterval: {
          type: SyncIntervalType.FREQUENT,
        },
        wifiOnly: true,
        batterySavingMode: false,
        autoRetry: true,
        maxRetryCount: 5,
        nightModeSuspend: true,
        nightModeStart: '23:00',
        nightModeEnd: '07:00',
      };

      mockApiClient.patch.mockResolvedValue(mockResponse);

      const result = await updateSyncSettings(request);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/api/sync-settings', request);
      expect(result).toEqual(mockResponse);
    });

    it('部分更新ができる', async () => {
      const request = {
        wifiOnly: true,
      };

      const mockResponse: SyncSettingsDataDto = {
        defaultInterval: {
          type: SyncIntervalType.STANDARD,
        },
        wifiOnly: true,
        batterySavingMode: false,
        autoRetry: true,
        maxRetryCount: 3,
        nightModeSuspend: false,
        nightModeStart: '22:00',
        nightModeEnd: '06:00',
      };

      mockApiClient.patch.mockResolvedValue(mockResponse);

      const result = await updateSyncSettings(request);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/api/sync-settings', request);
      expect(result).toEqual(mockResponse);
    });

    it('カスタム間隔を設定できる', async () => {
      const request = {
        defaultInterval: {
          type: SyncIntervalType.CUSTOM,
          value: 2,
          unit: TimeUnit.HOURS,
        },
      };

      const mockResponse: SyncSettingsDataDto = {
        defaultInterval: {
          type: SyncIntervalType.CUSTOM,
          value: 2,
          unit: TimeUnit.HOURS,
        },
        wifiOnly: false,
        batterySavingMode: false,
        autoRetry: true,
        maxRetryCount: 3,
        nightModeSuspend: false,
        nightModeStart: '22:00',
        nightModeEnd: '06:00',
      };

      mockApiClient.patch.mockResolvedValue(mockResponse);

      const result = await updateSyncSettings(request);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/api/sync-settings', request);
      expect(result).toEqual(mockResponse);
    });

    it('エラー時に例外をスローする', async () => {
      const error = new Error('API Error');
      mockApiClient.patch.mockRejectedValue(error);

      await expect(
        updateSyncSettings({
          wifiOnly: true,
        })
      ).rejects.toThrow('API Error');
    });
  });

  describe('getAllInstitutionSyncSettings', () => {
    it('全金融機関の設定を取得する', async () => {
      const mockResponse: InstitutionSyncSettingsResponseDto[] = [
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

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getAllInstitutionSyncSettings();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/sync-settings/institutions');
      expect(result).toEqual(mockResponse);
    });

    it('空配列を返すことができる', async () => {
      mockApiClient.get.mockResolvedValue([]);

      const result = await getAllInstitutionSyncSettings();

      expect(result).toEqual([]);
    });

    it('エラー時に例外をスローする', async () => {
      const error = new Error('API Error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(getAllInstitutionSyncSettings()).rejects.toThrow('API Error');
    });
  });

  describe('getInstitutionSyncSettings', () => {
    it('特定金融機関の設定を取得する', async () => {
      const institutionId = 'inst-1';
      const mockResponse: InstitutionSyncSettingsResponseDto = {
        id: 'inst-sync-1',
        institutionId: 'inst-1',
        interval: {
          type: SyncIntervalType.FREQUENT,
        },
        enabled: true,
        lastSyncedAt: '2024-01-01T10:00:00Z',
        nextSyncAt: '2024-01-01T11:00:00Z',
        syncStatus: InstitutionSyncStatus.IDLE,
        errorCount: 0,
        lastError: null,
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await getInstitutionSyncSettings(institutionId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/sync-settings/institutions/${institutionId}`
      );
      expect(result).toEqual(mockResponse);
    });

    it('エラー時に例外をスローする', async () => {
      const error = new Error('API Error');
      mockApiClient.get.mockRejectedValue(error);

      await expect(getInstitutionSyncSettings('inst-1')).rejects.toThrow('API Error');
    });
  });

  describe('updateInstitutionSyncSettings', () => {
    it('特定金融機関の設定を更新する', async () => {
      const institutionId = 'inst-1';
      const request = {
        interval: {
          type: SyncIntervalType.INFREQUENT,
        },
        enabled: true,
      };

      const mockResponse: InstitutionSyncSettingsResponseDto = {
        id: 'inst-sync-1',
        institutionId: 'inst-1',
        interval: {
          type: SyncIntervalType.INFREQUENT,
        },
        enabled: true,
        lastSyncedAt: '2024-01-01T10:00:00Z',
        nextSyncAt: '2024-01-02T00:00:00Z',
        syncStatus: InstitutionSyncStatus.IDLE,
        errorCount: 0,
        lastError: null,
      };

      mockApiClient.patch.mockResolvedValue(mockResponse);

      const result = await updateInstitutionSyncSettings(institutionId, request);

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/api/sync-settings/institutions/${institutionId}`,
        request
      );
      expect(result).toEqual(mockResponse);
    });

    it('カスタム間隔を設定できる', async () => {
      const institutionId = 'inst-1';
      const request = {
        interval: {
          type: SyncIntervalType.CUSTOM,
          value: 30,
          unit: TimeUnit.MINUTES,
        },
        enabled: true,
      };

      const mockResponse: InstitutionSyncSettingsResponseDto = {
        id: 'inst-sync-1',
        institutionId: 'inst-1',
        interval: {
          type: SyncIntervalType.CUSTOM,
          value: 30,
          unit: TimeUnit.MINUTES,
        },
        enabled: true,
        lastSyncedAt: '2024-01-01T10:00:00Z',
        nextSyncAt: '2024-01-01T10:30:00Z',
        syncStatus: InstitutionSyncStatus.IDLE,
        errorCount: 0,
        lastError: null,
      };

      mockApiClient.patch.mockResolvedValue(mockResponse);

      const result = await updateInstitutionSyncSettings(institutionId, request);

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/api/sync-settings/institutions/${institutionId}`,
        request
      );
      expect(result).toEqual(mockResponse);
    });

    it('有効/無効のみ更新できる', async () => {
      const institutionId = 'inst-1';
      const request = {
        enabled: false,
      };

      const mockResponse: InstitutionSyncSettingsResponseDto = {
        id: 'inst-sync-1',
        institutionId: 'inst-1',
        interval: {
          type: SyncIntervalType.STANDARD,
        },
        enabled: false,
        lastSyncedAt: '2024-01-01T10:00:00Z',
        nextSyncAt: null,
        syncStatus: InstitutionSyncStatus.IDLE,
        errorCount: 0,
        lastError: null,
      };

      mockApiClient.patch.mockResolvedValue(mockResponse);

      const result = await updateInstitutionSyncSettings(institutionId, request);

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        `/api/sync-settings/institutions/${institutionId}`,
        request
      );
      expect(result).toEqual(mockResponse);
    });

    it('エラー時に例外をスローする', async () => {
      const error = new Error('API Error');
      mockApiClient.patch.mockRejectedValue(error);

      await expect(
        updateInstitutionSyncSettings('inst-1', {
          enabled: true,
        })
      ).rejects.toThrow('API Error');
    });
  });
});
