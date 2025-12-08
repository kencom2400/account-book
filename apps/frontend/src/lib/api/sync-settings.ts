/**
 * 同期設定API
 * FR-030: データ同期間隔の設定
 */

import { apiClient } from './client';
import type {
  SyncSettingsDataDto,
  UpdateSyncSettingsRequestDto,
  InstitutionSyncSettingsResponseDto,
  UpdateInstitutionSyncSettingsRequestDto,
} from '@account-book/types';

/**
 * 全体設定を取得
 */
export async function getSyncSettings(): Promise<SyncSettingsDataDto> {
  return await apiClient.get<SyncSettingsDataDto>('/api/sync-settings');
}

/**
 * 全体設定を更新
 */
export async function updateSyncSettings(
  request: UpdateSyncSettingsRequestDto
): Promise<SyncSettingsDataDto> {
  return await apiClient.patch<SyncSettingsDataDto>('/api/sync-settings', request);
}

/**
 * 全金融機関の設定を取得
 */
export async function getAllInstitutionSyncSettings(): Promise<
  InstitutionSyncSettingsResponseDto[]
> {
  return await apiClient.get<InstitutionSyncSettingsResponseDto[]>(
    '/api/sync-settings/institutions'
  );
}

/**
 * 特定金融機関の設定を取得
 */
export async function getInstitutionSyncSettings(
  institutionId: string
): Promise<InstitutionSyncSettingsResponseDto> {
  return await apiClient.get<InstitutionSyncSettingsResponseDto>(
    `/api/sync-settings/institutions/${institutionId}`
  );
}

/**
 * 特定金融機関の設定を更新
 */
export async function updateInstitutionSyncSettings(
  institutionId: string,
  request: UpdateInstitutionSyncSettingsRequestDto
): Promise<InstitutionSyncSettingsResponseDto> {
  return await apiClient.patch<InstitutionSyncSettingsResponseDto>(
    `/api/sync-settings/institutions/${institutionId}`,
    request
  );
}
