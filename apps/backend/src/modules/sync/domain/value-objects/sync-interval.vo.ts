import { SyncIntervalType } from '../enums/sync-interval-type.enum';
import { TimeUnit } from '../enums/time-unit.enum';

/**
 * 同期間隔 Value Object
 *
 * @description
 * データ同期間隔を表す値オブジェクト。
 * 不変（immutable）として扱います。
 * FR-030: データ同期間隔の設定
 */
export class SyncInterval {
  // プリセット間隔の値（分単位）
  private static readonly PRESET_INTERVALS = {
    [SyncIntervalType.REALTIME]: 5, // 5分
    [SyncIntervalType.FREQUENT]: 60, // 1時間
    [SyncIntervalType.STANDARD]: 360, // 6時間
    [SyncIntervalType.INFREQUENT]: 1440, // 1日
    [SyncIntervalType.MANUAL]: 0, // 手動のみ（同期なし）
  };

  // バリデーション範囲（分単位）
  private static readonly MIN_INTERVAL_MINUTES = 5; // 最小5分
  private static readonly MAX_INTERVAL_MINUTES = 43200; // 最大30日（30 * 24 * 60）

  constructor(
    public readonly type: SyncIntervalType,
    public readonly value?: number,
    public readonly unit?: TimeUnit,
    public readonly customSchedule?: string,
  ) {
    this.validate();
  }

  /**
   * バリデーション
   */
  private validate(): void {
    // プリセット間隔の場合、value/unit/customScheduleは不要
    if (
      this.type !== SyncIntervalType.CUSTOM &&
      this.type !== SyncIntervalType.MANUAL
    ) {
      if (this.value !== undefined || this.unit !== undefined) {
        throw new Error(
          `Value and unit should not be specified for preset interval type: ${String(this.type)}`,
        );
      }
    }

    // カスタム間隔の場合、valueとunitは必須
    if (this.type === SyncIntervalType.CUSTOM) {
      if (this.value === undefined || this.value === null) {
        throw new Error('Value is required for custom interval');
      }
      if (this.unit === undefined) {
        throw new Error('Unit is required for custom interval');
      }

      // 値の範囲チェック（分単位に換算）
      const minutes = this.toMinutes();
      if (
        minutes < SyncInterval.MIN_INTERVAL_MINUTES ||
        minutes > SyncInterval.MAX_INTERVAL_MINUTES
      ) {
        throw new Error(
          `Interval must be between ${SyncInterval.MIN_INTERVAL_MINUTES} minutes and ${SyncInterval.MAX_INTERVAL_MINUTES} minutes (30 days)`,
        );
      }
    }

    // MANUALの場合はvalue/unit/customScheduleは不要
    if (this.type === SyncIntervalType.MANUAL) {
      if (this.value !== undefined || this.unit !== undefined) {
        throw new Error(
          'Value and unit should not be specified for manual interval',
        );
      }
    }
  }

  /**
   * 分単位に換算
   */
  private toMinutes(): number {
    if (this.type === SyncIntervalType.MANUAL) {
      return 0;
    }

    if (this.type === SyncIntervalType.CUSTOM) {
      if (this.value === undefined || this.unit === undefined) {
        throw new Error('Value and unit are required for custom interval');
      }

      switch (this.unit) {
        case TimeUnit.MINUTES:
          return this.value;
        case TimeUnit.HOURS:
          return this.value * 60;
        case TimeUnit.DAYS:
          return this.value * 24 * 60;
        default:
          throw new Error(`Unknown unit: ${String(this.unit)}`);
      }
    }

    // プリセット間隔の場合
    const presetMinutes = SyncInterval.PRESET_INTERVALS[this.type];
    if (presetMinutes === undefined) {
      throw new Error(`Unknown preset interval type: ${this.type}`);
    }
    return presetMinutes;
  }

  /**
   * 最終同期日時から次回同期時刻を計算
   */
  calculateNextSyncAt(lastSyncAt: Date | null): Date {
    const now = new Date();

    // 手動のみの場合は次回同期時刻なし
    if (this.type === SyncIntervalType.MANUAL) {
      throw new Error('Cannot calculate next sync time for manual interval');
    }

    // 初回同期の場合
    if (!lastSyncAt) {
      return now;
    }

    const minutes = this.toMinutes();
    const nextSyncAt = new Date(lastSyncAt);
    nextSyncAt.setMinutes(nextSyncAt.getMinutes() + minutes);

    // 過去の時刻の場合は現在時刻を返す
    if (nextSyncAt < now) {
      return now;
    }

    return nextSyncAt;
  }

  /**
   * Cron式に変換
   */
  toCronExpression(): string {
    if (this.customSchedule) {
      return this.customSchedule;
    }

    const minutes = this.toMinutes();

    // 分単位の間隔をCron式に変換
    if (minutes < 60) {
      // 分単位（5分ごと、10分ごと等）
      return `*/${minutes} * * * *`;
    } else if (minutes < 1440) {
      // 時間単位（1時間ごと、6時間ごと等）
      const hours = Math.floor(minutes / 60);
      return `0 */${hours} * * *`;
    } else {
      // 日単位（1日ごと等）
      const days = Math.floor(minutes / 1440);
      return `0 0 */${days} * *`;
    }
  }

  /**
   * 等価性の判定
   */
  equals(other: SyncInterval): boolean {
    return (
      this.type === other.type &&
      this.value === other.value &&
      this.unit === other.unit &&
      this.customSchedule === other.customSchedule
    );
  }

  /**
   * プレーンオブジェクトに変換
   */
  toPlain(): {
    type: SyncIntervalType;
    value?: number;
    unit?: TimeUnit;
    customSchedule?: string;
  } {
    return {
      type: this.type,
      value: this.value,
      unit: this.unit,
      customSchedule: this.customSchedule,
    };
  }

  /**
   * プレーンオブジェクトから生成
   */
  static fromPlain(plain: {
    type: SyncIntervalType;
    value?: number;
    unit?: TimeUnit;
    customSchedule?: string;
  }): SyncInterval {
    return new SyncInterval(
      plain.type,
      plain.value,
      plain.unit,
      plain.customSchedule,
    );
  }
}
