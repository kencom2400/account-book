import { SyncInterval } from './sync-interval.vo';
import { SyncIntervalType } from '../enums/sync-interval-type.enum';
import { TimeUnit } from '../enums/time-unit.enum';

describe('SyncInterval', () => {
  describe('constructor', () => {
    it('プリセット間隔を作成できる', () => {
      const interval = new SyncInterval(SyncIntervalType.STANDARD);
      expect(interval.type).toBe(SyncIntervalType.STANDARD);
      expect(interval.value).toBeUndefined();
      expect(interval.unit).toBeUndefined();
    });

    it('カスタム間隔を作成できる', () => {
      const interval = new SyncInterval(
        SyncIntervalType.CUSTOM,
        30,
        TimeUnit.MINUTES,
      );
      expect(interval.type).toBe(SyncIntervalType.CUSTOM);
      expect(interval.value).toBe(30);
      expect(interval.unit).toBe(TimeUnit.MINUTES);
    });

    it('無効なSyncIntervalTypeでエラーを投げる', () => {
      expect(() => {
        new SyncInterval('invalid' as SyncIntervalType);
      }).toThrow();
    });

    it('カスタム間隔でvalueとunitが未指定の場合エラーを投げる', () => {
      expect(() => {
        new SyncInterval(SyncIntervalType.CUSTOM);
      }).toThrow('Value is required for custom interval');
    });

    it('カスタム間隔で無効なTimeUnitの場合エラーを投げる', () => {
      expect(() => {
        new SyncInterval(SyncIntervalType.CUSTOM, 30, 'invalid' as TimeUnit);
      }).toThrow('Invalid TimeUnit');
    });

    it('カスタム間隔が最小値未満の場合エラーを投げる', () => {
      expect(() => {
        new SyncInterval(SyncIntervalType.CUSTOM, 4, TimeUnit.MINUTES);
      }).toThrow(
        'Custom interval value must be between 5 minutes and 43200 minutes',
      );
    });

    it('カスタム間隔が最大値を超える場合エラーを投げる', () => {
      expect(() => {
        new SyncInterval(SyncIntervalType.CUSTOM, 31, TimeUnit.DAYS);
      }).toThrow(
        'Custom interval value must be between 5 minutes and 43200 minutes',
      );
    });

    it('プリセット間隔でvalue/unit/customScheduleが指定されている場合エラーを投げる', () => {
      expect(() => {
        new SyncInterval(
          SyncIntervalType.STANDARD,
          30,
          TimeUnit.MINUTES,
          '0 */6 * * *',
        );
      }).toThrow(
        'Value, unit, and customSchedule must not be set for preset intervals',
      );
    });

    it('無効なCron式の場合エラーを投げる', () => {
      expect(() => {
        new SyncInterval(
          SyncIntervalType.CUSTOM,
          30,
          TimeUnit.MINUTES,
          'invalid cron',
        );
      }).toThrow('Invalid cron expression');
    });
  });

  describe('toMinutes', () => {
    it('プリセット間隔を分に変換できる', () => {
      const realtime = new SyncInterval(SyncIntervalType.REALTIME);
      expect(realtime.toMinutes()).toBe(5);

      const frequent = new SyncInterval(SyncIntervalType.FREQUENT);
      expect(frequent.toMinutes()).toBe(60);

      const standard = new SyncInterval(SyncIntervalType.STANDARD);
      expect(standard.toMinutes()).toBe(360);

      const infrequent = new SyncInterval(SyncIntervalType.INFREQUENT);
      expect(infrequent.toMinutes()).toBe(1440);
    });

    it('カスタム間隔を分に変換できる', () => {
      const minutes = new SyncInterval(
        SyncIntervalType.CUSTOM,
        30,
        TimeUnit.MINUTES,
      );
      expect(minutes.toMinutes()).toBe(30);

      const hours = new SyncInterval(
        SyncIntervalType.CUSTOM,
        2,
        TimeUnit.HOURS,
      );
      expect(hours.toMinutes()).toBe(120);

      const days = new SyncInterval(SyncIntervalType.CUSTOM, 1, TimeUnit.DAYS);
      expect(days.toMinutes()).toBe(1440);
    });

    it('手動同期タイプは0を返す', () => {
      const manual = new SyncInterval(SyncIntervalType.MANUAL);
      expect(manual.toMinutes()).toBe(0);
    });
  });

  describe('toCronExpression', () => {
    it('プリセット間隔をCron式に変換できる', () => {
      const realtime = new SyncInterval(SyncIntervalType.REALTIME);
      expect(realtime.toCronExpression()).toBe('*/5 * * * *');

      const frequent = new SyncInterval(SyncIntervalType.FREQUENT);
      expect(frequent.toCronExpression()).toBe('0 * * * *');

      const standard = new SyncInterval(SyncIntervalType.STANDARD);
      expect(standard.toCronExpression()).toBe('0 */6 * * *');

      const infrequent = new SyncInterval(SyncIntervalType.INFREQUENT);
      expect(infrequent.toCronExpression()).toBe('0 0 * * *');
    });

    it('手動同期タイプはnullを返す', () => {
      const manual = new SyncInterval(SyncIntervalType.MANUAL);
      expect(manual.toCronExpression()).toBeNull();
    });

    it('カスタムスケジュールを返す', () => {
      const custom = new SyncInterval(
        SyncIntervalType.CUSTOM,
        30,
        TimeUnit.MINUTES,
        '0 */2 * * *',
      );
      expect(custom.toCronExpression()).toBe('0 */2 * * *');
    });

    it('カスタム間隔でcustomScheduleがない場合エラーを投げる', () => {
      const custom = new SyncInterval(
        SyncIntervalType.CUSTOM,
        30,
        TimeUnit.MINUTES,
      );
      expect(() => {
        custom.toCronExpression();
      }).toThrow(
        'Custom interval without customSchedule cannot be converted to cron expression',
      );
    });
  });

  describe('calculateNextSyncAt', () => {
    it('プリセット間隔の次回同期時刻を計算できる', () => {
      const interval = new SyncInterval(SyncIntervalType.FREQUENT);
      const lastSyncAt = new Date('2025-01-15T10:00:00Z');
      const nextSyncAt = interval.calculateNextSyncAt(lastSyncAt);

      expect(nextSyncAt).toBeInstanceOf(Date);
      expect(nextSyncAt.getTime()).toBeGreaterThan(lastSyncAt.getTime());
    });

    it('手動同期タイプはエラーを投げる', () => {
      const manual = new SyncInterval(SyncIntervalType.MANUAL);
      expect(() => {
        manual.calculateNextSyncAt();
      }).toThrow('Cannot calculate next sync time for manual interval');
    });

    it('カスタムスケジュールの次回同期時刻を計算できる', () => {
      const custom = new SyncInterval(
        SyncIntervalType.CUSTOM,
        30,
        TimeUnit.MINUTES,
        '0 */2 * * *',
      );
      const lastSyncAt = new Date('2025-01-15T10:00:00Z');
      const nextSyncAt = custom.calculateNextSyncAt(lastSyncAt);

      expect(nextSyncAt).toBeInstanceOf(Date);
    });
  });

  describe('equals', () => {
    it('同じプリセット間隔は等しい', () => {
      const interval1 = new SyncInterval(SyncIntervalType.STANDARD);
      const interval2 = new SyncInterval(SyncIntervalType.STANDARD);
      expect(interval1.equals(interval2)).toBe(true);
    });

    it('異なるプリセット間隔は等しくない', () => {
      const interval1 = new SyncInterval(SyncIntervalType.STANDARD);
      const interval2 = new SyncInterval(SyncIntervalType.FREQUENT);
      expect(interval1.equals(interval2)).toBe(false);
    });

    it('同じカスタム間隔は等しい', () => {
      const interval1 = new SyncInterval(
        SyncIntervalType.CUSTOM,
        30,
        TimeUnit.MINUTES,
      );
      const interval2 = new SyncInterval(
        SyncIntervalType.CUSTOM,
        30,
        TimeUnit.MINUTES,
      );
      expect(interval1.equals(interval2)).toBe(true);
    });

    it('異なるカスタム間隔は等しくない', () => {
      const interval1 = new SyncInterval(
        SyncIntervalType.CUSTOM,
        30,
        TimeUnit.MINUTES,
      );
      const interval2 = new SyncInterval(
        SyncIntervalType.CUSTOM,
        60,
        TimeUnit.MINUTES,
      );
      expect(interval1.equals(interval2)).toBe(false);
    });
  });

  describe('fromPlain', () => {
    it('プレーンオブジェクトからSyncIntervalを作成できる', () => {
      const plain = {
        type: SyncIntervalType.STANDARD,
      };
      const interval = SyncInterval.fromPlain(plain);
      expect(interval.type).toBe(SyncIntervalType.STANDARD);
    });

    it('カスタム間隔のプレーンオブジェクトから作成できる', () => {
      const plain = {
        type: SyncIntervalType.CUSTOM,
        value: 30,
        unit: TimeUnit.MINUTES,
      };
      const interval = SyncInterval.fromPlain(plain);
      expect(interval.type).toBe(SyncIntervalType.CUSTOM);
      expect(interval.value).toBe(30);
      expect(interval.unit).toBe(TimeUnit.MINUTES);
    });
  });

  describe('toPlain', () => {
    it('プレーンオブジェクトに変換できる', () => {
      const interval = new SyncInterval(SyncIntervalType.STANDARD);
      const plain = interval.toPlain();
      expect(plain.type).toBe(SyncIntervalType.STANDARD);
      expect(plain.value).toBeUndefined();
      expect(plain.unit).toBeUndefined();
    });

    it('カスタム間隔をプレーンオブジェクトに変換できる', () => {
      const interval = new SyncInterval(
        SyncIntervalType.CUSTOM,
        30,
        TimeUnit.MINUTES,
        '0 */2 * * *',
      );
      const plain = interval.toPlain();
      expect(plain.type).toBe(SyncIntervalType.CUSTOM);
      expect(plain.value).toBe(30);
      expect(plain.unit).toBe(TimeUnit.MINUTES);
      expect(plain.customSchedule).toBe('0 */2 * * *');
    });
  });
});
