import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import type { ISyncSettingsRepository } from '../../domain/repositories/sync-settings.repository.interface';
import { SyncSettings } from '../../domain/entities/sync-settings.entity';
import { InstitutionSyncSettings } from '../../domain/entities/institution-sync-settings.entity';
import { SyncIntervalType } from '../../domain/enums/sync-interval-type.enum';
import { TimeUnit } from '../../domain/enums/time-unit.enum';
import { InstitutionSyncStatus } from '../../domain/enums/institution-sync-status.enum';

const DATA_DIR = path.join(process.cwd(), 'data');
const SYNC_SETTINGS_FILE = path.join(DATA_DIR, 'sync-settings.json');
const INSTITUTION_SETTINGS_FILE = path.join(
  DATA_DIR,
  'institution-sync-settings.json',
);

interface SyncSettingsJSON {
  id: string;
  defaultInterval: {
    type: SyncIntervalType;
    value?: number;
    unit?: TimeUnit;
    customSchedule?: string;
  };
  wifiOnly: boolean;
  batterySavingMode: boolean;
  autoRetry: boolean;
  maxRetryCount: number;
  nightModeSuspend: boolean;
  nightModeStart: string;
  nightModeEnd: string;
  createdAt: string;
  updatedAt: string;
}

interface InstitutionSyncSettingsJSON {
  id: string;
  institutionId: string;
  interval: {
    type: SyncIntervalType;
    value?: number;
    unit?: TimeUnit;
    customSchedule?: string;
  };
  enabled: boolean;
  lastSyncedAt: string | null;
  nextSyncAt: string | null;
  syncStatus: InstitutionSyncStatus;
  errorCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * JSON形式での同期設定リポジトリ実装
 *
 * @description
 * 開発環境用のJSONファイルベースの永続化
 *
 * @infrastructure
 * @layer Infrastructure
 */
@Injectable()
export class JsonSyncSettingsRepository implements ISyncSettingsRepository {
  private readonly logger = new Logger(JsonSyncSettingsRepository.name);
  private syncSettingsCache: SyncSettings | null = null;
  private institutionSettingsCache: InstitutionSyncSettings[] | null = null;

  constructor() {
    void this.ensureDataDirectory();
  }

  /**
   * 全体設定を取得
   */
  async find(): Promise<SyncSettings | null> {
    if (this.syncSettingsCache !== null) {
      return this.syncSettingsCache;
    }

    await this.ensureDataDirectory();

    try {
      const content = await fs.readFile(SYNC_SETTINGS_FILE, 'utf-8');
      const json = JSON.parse(content) as SyncSettingsJSON;
      const settings = SyncSettings.fromPlain({
        ...json,
        createdAt: new Date(json.createdAt),
        updatedAt: new Date(json.updatedAt),
      });

      this.syncSettingsCache = settings;
      return settings;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        // ファイルが存在しない場合はnullを返す
        this.syncSettingsCache = null;
        return null;
      }
      this.logger.error('Failed to load sync settings', error);
      throw error;
    }
  }

  /**
   * 全体設定を保存
   */
  async save(settings: SyncSettings): Promise<SyncSettings> {
    await this.ensureDataDirectory();

    const json: SyncSettingsJSON = {
      id: settings.id,
      defaultInterval: settings.defaultInterval.toPlain(),
      wifiOnly: settings.wifiOnly,
      batterySavingMode: settings.batterySavingMode,
      autoRetry: settings.autoRetry,
      maxRetryCount: settings.maxRetryCount,
      nightModeSuspend: settings.nightModeSuspend,
      nightModeStart: settings.nightModeStart,
      nightModeEnd: settings.nightModeEnd,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    };

    await fs.writeFile(
      SYNC_SETTINGS_FILE,
      JSON.stringify(json, null, 2),
      'utf-8',
    );

    this.syncSettingsCache = settings;
    return settings;
  }

  /**
   * 特定金融機関の設定を取得
   */
  async findInstitutionSettings(
    institutionId: string,
  ): Promise<InstitutionSyncSettings | null> {
    const allSettings = await this.findAllInstitutionSettings();
    return allSettings.find((s) => s.institutionId === institutionId) ?? null;
  }

  /**
   * 全金融機関の設定を取得
   */
  async findAllInstitutionSettings(): Promise<InstitutionSyncSettings[]> {
    if (this.institutionSettingsCache !== null) {
      return this.institutionSettingsCache;
    }

    await this.ensureDataDirectory();

    try {
      const content = await fs.readFile(INSTITUTION_SETTINGS_FILE, 'utf-8');
      const data = JSON.parse(content) as unknown;
      const jsonArray = Array.isArray(data) ? data : [];

      const settings = jsonArray.map((json) =>
        InstitutionSyncSettings.fromPlain({
          ...(json as InstitutionSyncSettingsJSON),
          lastSyncedAt: (json as InstitutionSyncSettingsJSON).lastSyncedAt
            ? new Date((json as InstitutionSyncSettingsJSON).lastSyncedAt!)
            : null,
          nextSyncAt: (json as InstitutionSyncSettingsJSON).nextSyncAt
            ? new Date((json as InstitutionSyncSettingsJSON).nextSyncAt!)
            : null,
          createdAt: new Date((json as InstitutionSyncSettingsJSON).createdAt),
          updatedAt: new Date((json as InstitutionSyncSettingsJSON).updatedAt),
        }),
      );

      this.institutionSettingsCache = settings;
      return settings;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        // ファイルが存在しない場合は空配列を返す
        this.institutionSettingsCache = [];
        return [];
      }
      this.logger.error('Failed to load institution sync settings', error);
      throw error;
    }
  }

  /**
   * 金融機関設定を保存
   */
  async saveInstitutionSettings(
    settings: InstitutionSyncSettings,
  ): Promise<InstitutionSyncSettings> {
    const allSettings = await this.findAllInstitutionSettings();

    // 既存データを検索（institutionIdのみで検索）
    const existingIndex = allSettings.findIndex(
      (s) => s.institutionId === settings.institutionId,
    );

    if (existingIndex >= 0) {
      // 既存データを更新
      allSettings[existingIndex] = settings;
    } else {
      // 新規データを追加
      allSettings.push(settings);
    }

    await this.saveInstitutionSettingsToFile(allSettings);
    this.institutionSettingsCache = allSettings;

    return settings;
  }

  /**
   * 金融機関設定を削除
   */
  async deleteInstitutionSettings(institutionId: string): Promise<void> {
    const allSettings = await this.findAllInstitutionSettings();
    const filtered = allSettings.filter(
      (s) => s.institutionId !== institutionId,
    );

    await this.saveInstitutionSettingsToFile(filtered);
    this.institutionSettingsCache = filtered;
  }

  /**
   * データディレクトリを確保
   */
  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create data directory', error);
      throw error;
    }
  }

  /**
   * 金融機関設定をファイルに保存
   */
  private async saveInstitutionSettingsToFile(
    settings: InstitutionSyncSettings[],
  ): Promise<void> {
    await this.ensureDataDirectory();

    const jsonArray: InstitutionSyncSettingsJSON[] = settings.map((s) => ({
      id: s.id,
      institutionId: s.institutionId,
      interval: s.interval.toPlain(),
      enabled: s.enabled,
      lastSyncedAt: s.lastSyncedAt?.toISOString() ?? null,
      nextSyncAt: s.nextSyncAt?.toISOString() ?? null,
      syncStatus: s.syncStatus,
      errorCount: s.errorCount,
      lastError: s.lastError,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    await fs.writeFile(
      INSTITUTION_SETTINGS_FILE,
      JSON.stringify(jsonArray, null, 2),
      'utf-8',
    );
  }
}
