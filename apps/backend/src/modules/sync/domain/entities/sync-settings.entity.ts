import { randomUUID } from 'crypto';
import { SyncInterval } from '../value-objects/sync-interval.vo';
import { SyncIntervalType } from '../enums/sync-interval-type.enum';
import { TimeUnit } from '../enums/time-unit.enum';

/**
 * 同期設定オプション
 */
export interface SyncSettingsOptions {
  wifiOnly?: boolean;
  batterySavingMode?: boolean;
  autoRetry?: boolean;
  maxRetryCount?: number;
  nightModeSuspend?: boolean;
  nightModeStart?: string; // HH:mm形式
  nightModeEnd?: string; // HH:mm形式
}

/**
 * 同期設定エンティティ
 *
 * @description
 * 全体の同期設定を管理するエンティティ。
 * 不変（immutable）として扱います。
 * FR-030: データ同期間隔の設定
 */
export class SyncSettings {
  constructor(
    public readonly id: string,
    public readonly defaultInterval: SyncInterval,
    public readonly wifiOnly: boolean,
    public readonly batterySavingMode: boolean,
    public readonly autoRetry: boolean,
    public readonly maxRetryCount: number,
    public readonly nightModeSuspend: boolean,
    public readonly nightModeStart: string,
    public readonly nightModeEnd: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validate();
  }

  /**
   * バリデーション
   */
  private validate(): void {
    // maxRetryCountの範囲チェック
    if (this.maxRetryCount < 1 || this.maxRetryCount > 10) {
      throw new Error('maxRetryCount must be between 1 and 10');
    }

    // 夜間モードのバリデーション
    if (this.nightModeSuspend) {
      if (!this.nightModeStart || !this.nightModeEnd) {
        throw new Error(
          'nightModeStart and nightModeEnd are required when nightModeSuspend is true',
        );
      }

      // 時刻形式のチェック（HH:mm）
      const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timePattern.test(this.nightModeStart)) {
        throw new Error(
          `Invalid nightModeStart format: ${this.nightModeStart}. Expected HH:mm format`,
        );
      }
      if (!timePattern.test(this.nightModeEnd)) {
        throw new Error(
          `Invalid nightModeEnd format: ${this.nightModeEnd}. Expected HH:mm format`,
        );
      }

      // 開始時刻と終了時刻が同一でないこと（日付をまたぐ設定は許容）
      if (this.nightModeStart === this.nightModeEnd) {
        throw new Error('nightModeStart and nightModeEnd must be different');
      }
    }
  }

  /**
   * デフォルト同期間隔を更新
   *
   * @param interval - 新しい同期間隔
   * @returns 更新されたSyncSettingsインスタンス
   */
  updateDefaultInterval(interval: SyncInterval): SyncSettings {
    return new SyncSettings(
      this.id,
      interval,
      this.wifiOnly,
      this.batterySavingMode,
      this.autoRetry,
      this.maxRetryCount,
      this.nightModeSuspend,
      this.nightModeStart,
      this.nightModeEnd,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * 詳細オプションを更新
   *
   * @param options - 更新するオプション
   * @returns 更新されたSyncSettingsインスタンス
   */
  updateOptions(options: SyncSettingsOptions): SyncSettings {
    return new SyncSettings(
      this.id,
      this.defaultInterval,
      options.wifiOnly ?? this.wifiOnly,
      options.batterySavingMode ?? this.batterySavingMode,
      options.autoRetry ?? this.autoRetry,
      options.maxRetryCount ?? this.maxRetryCount,
      options.nightModeSuspend ?? this.nightModeSuspend,
      options.nightModeStart ?? this.nightModeStart,
      options.nightModeEnd ?? this.nightModeEnd,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * デフォルト設定を作成（ファクトリメソッド）
   *
   * @returns デフォルト設定のSyncSettingsインスタンス
   */
  static createDefault(): SyncSettings {
    const now = new Date();
    const defaultInterval = new SyncInterval(SyncIntervalType.STANDARD);

    return new SyncSettings(
      randomUUID(),
      defaultInterval,
      false, // wifiOnly
      false, // batterySavingMode
      true, // autoRetry
      3, // maxRetryCount
      false, // nightModeSuspend
      '22:00', // nightModeStart（デフォルト値）
      '06:00', // nightModeEnd（デフォルト値）
      now,
      now,
    );
  }

  /**
   * プレーンオブジェクトから生成
   *
   * @param plain - プレーンオブジェクト
   * @returns SyncSettingsインスタンス
   */
  static fromPlain(plain: {
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
    createdAt: Date;
    updatedAt: Date;
  }): SyncSettings {
    const interval = SyncInterval.fromPlain(plain.defaultInterval);

    return new SyncSettings(
      plain.id,
      interval,
      plain.wifiOnly,
      plain.batterySavingMode,
      plain.autoRetry,
      plain.maxRetryCount,
      plain.nightModeSuspend,
      plain.nightModeStart,
      plain.nightModeEnd,
      plain.createdAt,
      plain.updatedAt,
    );
  }

  /**
   * JSON形式に変換（APIレスポンス用）
   */
  toJSON(): {
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
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      defaultInterval: this.defaultInterval.toPlain(),
      wifiOnly: this.wifiOnly,
      batterySavingMode: this.batterySavingMode,
      autoRetry: this.autoRetry,
      maxRetryCount: this.maxRetryCount,
      nightModeSuspend: this.nightModeSuspend,
      nightModeStart: this.nightModeStart,
      nightModeEnd: this.nightModeEnd,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
