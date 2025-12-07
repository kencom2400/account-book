import { randomUUID } from 'crypto';
import { SyncInterval } from '../value-objects/sync-interval.vo';
import { InstitutionSyncStatus } from '../enums/institution-sync-status.enum';
import { SyncIntervalType } from '../enums/sync-interval-type.enum';
import { TimeUnit } from '../enums/time-unit.enum';

/**
 * 金融機関同期設定エンティティ
 *
 * @description
 * 金融機関ごとの同期設定を管理するエンティティ。
 * 不変（immutable）として扱います。
 * FR-030: データ同期間隔の設定
 */
export class InstitutionSyncSettings {
  constructor(
    public readonly id: string,
    public readonly institutionId: string,
    public readonly interval: SyncInterval,
    public readonly enabled: boolean,
    public readonly lastSyncedAt: Date | null,
    public readonly nextSyncAt: Date | null,
    public readonly syncStatus: InstitutionSyncStatus,
    public readonly errorCount: number,
    public readonly lastError: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * 同期間隔を更新
   *
   * @param interval - 新しい同期間隔
   * @returns 更新されたInstitutionSyncSettingsインスタンス
   */
  updateInterval(interval: SyncInterval): InstitutionSyncSettings {
    // 次回同期時刻を再計算
    const nextSyncAt = this.calculateNextSyncAt();

    return new InstitutionSyncSettings(
      this.id,
      this.institutionId,
      interval,
      this.enabled,
      this.lastSyncedAt,
      nextSyncAt,
      this.syncStatus,
      this.errorCount,
      this.lastError,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 有効/無効を設定
   *
   * @param enabled - 有効/無効フラグ
   * @returns 更新されたInstitutionSyncSettingsインスタンス
   */
  setEnabled(enabled: boolean): InstitutionSyncSettings {
    return new InstitutionSyncSettings(
      this.id,
      this.institutionId,
      this.interval,
      enabled,
      this.lastSyncedAt,
      this.nextSyncAt,
      this.syncStatus,
      this.errorCount,
      this.lastError,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 同期ステータスを更新
   *
   * @param status - 新しいステータス
   * @returns 更新されたInstitutionSyncSettingsインスタンス
   */
  updateSyncStatus(status: InstitutionSyncStatus): InstitutionSyncSettings {
    return new InstitutionSyncSettings(
      this.id,
      this.institutionId,
      this.interval,
      this.enabled,
      this.lastSyncedAt,
      this.nextSyncAt,
      status,
      this.errorCount,
      this.lastError,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 次回同期時刻を計算
   *
   * @returns 次回同期予定時刻
   */
  calculateNextSyncAt(): Date | null {
    if (!this.enabled) {
      return null;
    }

    if (this.interval.type === SyncIntervalType.MANUAL) {
      return null;
    }

    try {
      return this.interval.calculateNextSyncAt(this.lastSyncedAt);
    } catch {
      // 手動のみの場合はnullを返す
      return null;
    }
  }

  /**
   * エラー回数を増加
   *
   * @returns 更新されたInstitutionSyncSettingsインスタンス
   */
  incrementErrorCount(): InstitutionSyncSettings {
    return new InstitutionSyncSettings(
      this.id,
      this.institutionId,
      this.interval,
      this.enabled,
      this.lastSyncedAt,
      this.nextSyncAt,
      InstitutionSyncStatus.ERROR,
      this.errorCount + 1,
      this.lastError,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * エラー回数をリセット
   *
   * @returns 更新されたInstitutionSyncSettingsインスタンス
   */
  resetErrorCount(): InstitutionSyncSettings {
    return new InstitutionSyncSettings(
      this.id,
      this.institutionId,
      this.interval,
      this.enabled,
      this.lastSyncedAt,
      this.nextSyncAt,
      this.syncStatus,
      0,
      null,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 最終同期日時を更新
   *
   * @param lastSyncedAt - 最終同期日時
   * @returns 更新されたInstitutionSyncSettingsインスタンス
   */
  updateLastSyncedAt(lastSyncedAt: Date): InstitutionSyncSettings {
    // 次回同期時刻を再計算
    const nextSyncAt = this.interval.calculateNextSyncAt(lastSyncedAt);

    return new InstitutionSyncSettings(
      this.id,
      this.institutionId,
      this.interval,
      this.enabled,
      lastSyncedAt,
      nextSyncAt,
      InstitutionSyncStatus.IDLE,
      this.errorCount,
      null, // エラーをクリア
      this.createdAt,
      new Date(),
    );
  }

  /**
   * エラーメッセージを設定
   *
   * @param error - エラーメッセージ
   * @returns 更新されたInstitutionSyncSettingsインスタンス
   */
  setLastError(error: string): InstitutionSyncSettings {
    return new InstitutionSyncSettings(
      this.id,
      this.institutionId,
      this.interval,
      this.enabled,
      this.lastSyncedAt,
      this.nextSyncAt,
      InstitutionSyncStatus.ERROR,
      this.errorCount,
      error,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 新規作成（ファクトリメソッド）
   *
   * @param institutionId - 金融機関ID
   * @param interval - 同期間隔（デフォルト設定を使用する場合はnull）
   * @param defaultInterval - デフォルト同期間隔（intervalがnullの場合に使用）
   * @returns 新規InstitutionSyncSettingsインスタンス
   */
  static create(
    institutionId: string,
    interval: SyncInterval | null,
    defaultInterval: SyncInterval,
  ): InstitutionSyncSettings {
    const now = new Date();
    const syncInterval = interval ?? defaultInterval;
    const nextSyncAt = syncInterval.calculateNextSyncAt(null);

    return new InstitutionSyncSettings(
      randomUUID(),
      institutionId,
      syncInterval,
      true, // enabled
      null, // lastSyncedAt
      nextSyncAt,
      InstitutionSyncStatus.IDLE,
      0, // errorCount
      null, // lastError
      now,
      now,
    );
  }

  /**
   * プレーンオブジェクトから生成
   *
   * @param plain - プレーンオブジェクト
   * @returns InstitutionSyncSettingsインスタンス
   */
  static fromPlain(plain: {
    id: string;
    institutionId: string;
    interval: {
      type: SyncIntervalType;
      value?: number;
      unit?: TimeUnit;
      customSchedule?: string;
    };
    enabled: boolean;
    lastSyncedAt: Date | null;
    nextSyncAt: Date | null;
    syncStatus: InstitutionSyncStatus;
    errorCount: number;
    lastError: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): InstitutionSyncSettings {
    const interval = SyncInterval.fromPlain(plain.interval);

    return new InstitutionSyncSettings(
      plain.id,
      plain.institutionId,
      interval,
      plain.enabled,
      plain.lastSyncedAt,
      plain.nextSyncAt,
      plain.syncStatus,
      plain.errorCount,
      plain.lastError,
      plain.createdAt,
      plain.updatedAt,
    );
  }

  /**
   * JSON形式に変換（APIレスポンス用）
   */
  toJSON(): {
    id: string;
    institutionId: string;
    interval: {
      type: SyncIntervalType;
      value?: number;
      unit?: TimeUnit;
      customSchedule?: string;
    };
    enabled: boolean;
    lastSyncedAt: Date | null;
    nextSyncAt: Date | null;
    syncStatus: InstitutionSyncStatus;
    errorCount: number;
    lastError: string | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      institutionId: this.institutionId,
      interval: this.interval.toPlain(),
      enabled: this.enabled,
      lastSyncedAt: this.lastSyncedAt,
      nextSyncAt: this.nextSyncAt,
      syncStatus: this.syncStatus,
      errorCount: this.errorCount,
      lastError: this.lastError,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
