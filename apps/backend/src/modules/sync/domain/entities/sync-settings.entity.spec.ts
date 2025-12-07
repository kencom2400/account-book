import { SyncSettings } from './sync-settings.entity';
import { SyncInterval } from '../value-objects/sync-interval.vo';
import { SyncIntervalType } from '../enums/sync-interval-type.enum';
import { TimeUnit } from '../enums/time-unit.enum';

describe('SyncSettings', () => {
  const now = new Date('2025-01-01T00:00:00Z');
  const defaultInterval = new SyncInterval(SyncIntervalType.STANDARD);

  const createValidSyncSettings = (): SyncSettings => {
    return new SyncSettings(
      'settings-001',
      defaultInterval,
      false, // wifiOnly
      false, // batterySavingMode
      true, // autoRetry
      3, // maxRetryCount
      false, // nightModeSuspend
      '22:00', // nightModeStart
      '06:00', // nightModeEnd
      now,
      now,
    );
  };

  describe('constructor', () => {
    it('有効なパラメータでインスタンスを作成できる', () => {
      const settings = createValidSyncSettings();

      expect(settings.id).toBe('settings-001');
      expect(settings.defaultInterval).toBe(defaultInterval);
      expect(settings.wifiOnly).toBe(false);
      expect(settings.batterySavingMode).toBe(false);
      expect(settings.autoRetry).toBe(true);
      expect(settings.maxRetryCount).toBe(3);
      expect(settings.nightModeSuspend).toBe(false);
      expect(settings.nightModeStart).toBe('22:00');
      expect(settings.nightModeEnd).toBe('06:00');
    });

    it('maxRetryCountが1未満の場合エラーを投げる', () => {
      expect(
        () =>
          new SyncSettings(
            'settings-001',
            defaultInterval,
            false,
            false,
            true,
            0, // maxRetryCount < 1
            false,
            '22:00',
            '06:00',
            now,
            now,
          ),
      ).toThrow('maxRetryCount must be between 1 and 10');
    });

    it('maxRetryCountが10より大きい場合エラーを投げる', () => {
      expect(
        () =>
          new SyncSettings(
            'settings-001',
            defaultInterval,
            false,
            false,
            true,
            11, // maxRetryCount > 10
            false,
            '22:00',
            '06:00',
            now,
            now,
          ),
      ).toThrow('maxRetryCount must be between 1 and 10');
    });

    it('nightModeSuspendがtrueでnightModeStartが未指定の場合エラーを投げる', () => {
      expect(
        () =>
          new SyncSettings(
            'settings-001',
            defaultInterval,
            false,
            false,
            true,
            3,
            true, // nightModeSuspend = true
            '', // nightModeStart が空
            '06:00',
            now,
            now,
          ),
      ).toThrow(
        'nightModeStart and nightModeEnd are required when nightModeSuspend is true',
      );
    });

    it('nightModeSuspendがtrueでnightModeEndが未指定の場合エラーを投げる', () => {
      expect(
        () =>
          new SyncSettings(
            'settings-001',
            defaultInterval,
            false,
            false,
            true,
            3,
            true, // nightModeSuspend = true
            '22:00',
            '', // nightModeEnd が空
            now,
            now,
          ),
      ).toThrow(
        'nightModeStart and nightModeEnd are required when nightModeSuspend is true',
      );
    });

    it('nightModeStartの形式が不正な場合エラーを投げる', () => {
      expect(
        () =>
          new SyncSettings(
            'settings-001',
            defaultInterval,
            false,
            false,
            true,
            3,
            true,
            '25:00', // 不正な時刻形式
            '06:00',
            now,
            now,
          ),
      ).toThrow('Invalid nightModeStart format: 25:00. Expected HH:mm format');
    });

    it('nightModeEndの形式が不正な場合エラーを投げる', () => {
      expect(
        () =>
          new SyncSettings(
            'settings-001',
            defaultInterval,
            false,
            false,
            true,
            3,
            true,
            '22:00',
            '60:00', // 不正な時刻形式
            now,
            now,
          ),
      ).toThrow('Invalid nightModeEnd format: 60:00. Expected HH:mm format');
    });

    it('nightModeStartとnightModeEndが同一の場合エラーを投げる', () => {
      expect(
        () =>
          new SyncSettings(
            'settings-001',
            defaultInterval,
            false,
            false,
            true,
            3,
            true,
            '22:00',
            '22:00', // 同一時刻
            now,
            now,
          ),
      ).toThrow('nightModeStart and nightModeEnd must be different');
    });

    it('nightModeSuspendがfalseの場合は時刻形式のバリデーションをスキップ', () => {
      const settings = new SyncSettings(
        'settings-001',
        defaultInterval,
        false,
        false,
        true,
        3,
        false, // nightModeSuspend = false
        '', // 空でもOK
        '', // 空でもOK
        now,
        now,
      );

      expect(settings.nightModeSuspend).toBe(false);
    });
  });

  describe('updateDefaultInterval', () => {
    it('デフォルト同期間隔を更新できる', () => {
      const settings = createValidSyncSettings();
      const newInterval = new SyncInterval(SyncIntervalType.FREQUENT);

      const updated = settings.updateDefaultInterval(newInterval);

      expect(updated.defaultInterval).toBe(newInterval);
      expect(updated.id).toBe(settings.id);
      expect(updated.wifiOnly).toBe(settings.wifiOnly);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        settings.updatedAt.getTime(),
      );
    });

    it('元のインスタンスは変更されない（不変性）', () => {
      const settings = createValidSyncSettings();
      const originalInterval = settings.defaultInterval;
      const newInterval = new SyncInterval(SyncIntervalType.FREQUENT);

      settings.updateDefaultInterval(newInterval);

      expect(settings.defaultInterval).toBe(originalInterval);
    });
  });

  describe('updateOptions', () => {
    it('wifiOnlyを更新できる', () => {
      const settings = createValidSyncSettings();

      const updated = settings.updateOptions({ wifiOnly: true });

      expect(updated.wifiOnly).toBe(true);
      expect(updated.batterySavingMode).toBe(settings.batterySavingMode);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        settings.updatedAt.getTime(),
      );
    });

    it('batterySavingModeを更新できる', () => {
      const settings = createValidSyncSettings();

      const updated = settings.updateOptions({ batterySavingMode: true });

      expect(updated.batterySavingMode).toBe(true);
      expect(updated.wifiOnly).toBe(settings.wifiOnly);
    });

    it('autoRetryを更新できる', () => {
      const settings = createValidSyncSettings();

      const updated = settings.updateOptions({ autoRetry: false });

      expect(updated.autoRetry).toBe(false);
    });

    it('maxRetryCountを更新できる', () => {
      const settings = createValidSyncSettings();

      const updated = settings.updateOptions({ maxRetryCount: 5 });

      expect(updated.maxRetryCount).toBe(5);
    });

    it('nightModeSuspendを更新できる', () => {
      const settings = createValidSyncSettings();

      const updated = settings.updateOptions({
        nightModeSuspend: true,
        nightModeStart: '23:00',
        nightModeEnd: '07:00',
      });

      expect(updated.nightModeSuspend).toBe(true);
      expect(updated.nightModeStart).toBe('23:00');
      expect(updated.nightModeEnd).toBe('07:00');
    });

    it('複数のオプションを同時に更新できる', () => {
      const settings = createValidSyncSettings();

      const updated = settings.updateOptions({
        wifiOnly: true,
        batterySavingMode: true,
        maxRetryCount: 5,
      });

      expect(updated.wifiOnly).toBe(true);
      expect(updated.batterySavingMode).toBe(true);
      expect(updated.maxRetryCount).toBe(5);
    });

    it('オプションが未指定の場合は元の値を保持', () => {
      const settings = createValidSyncSettings();

      const updated = settings.updateOptions({});

      expect(updated.wifiOnly).toBe(settings.wifiOnly);
      expect(updated.batterySavingMode).toBe(settings.batterySavingMode);
      expect(updated.autoRetry).toBe(settings.autoRetry);
      expect(updated.maxRetryCount).toBe(settings.maxRetryCount);
    });

    it('nightModeSuspendをtrueに更新する際、時刻形式が不正な場合はエラーを投げる', () => {
      const settings = createValidSyncSettings();

      expect(() =>
        settings.updateOptions({
          nightModeSuspend: true,
          nightModeStart: '25:00', // 不正な時刻形式
          nightModeEnd: '06:00',
        }),
      ).toThrow('Invalid nightModeStart format: 25:00. Expected HH:mm format');
    });
  });

  describe('createDefault', () => {
    it('デフォルト設定を作成できる', () => {
      const settings = SyncSettings.createDefault();

      expect(settings.id).toBeDefined();
      expect(settings.defaultInterval.type).toBe(SyncIntervalType.STANDARD);
      expect(settings.wifiOnly).toBe(false);
      expect(settings.batterySavingMode).toBe(false);
      expect(settings.autoRetry).toBe(true);
      expect(settings.maxRetryCount).toBe(3);
      expect(settings.nightModeSuspend).toBe(false);
      expect(settings.nightModeStart).toBe('22:00');
      expect(settings.nightModeEnd).toBe('06:00');
      expect(settings.createdAt).toBeInstanceOf(Date);
      expect(settings.updatedAt).toBeInstanceOf(Date);
    });

    it('毎回異なるIDが生成される', () => {
      const settings1 = SyncSettings.createDefault();
      const settings2 = SyncSettings.createDefault();

      expect(settings1.id).not.toBe(settings2.id);
    });
  });

  describe('fromPlain', () => {
    it('プレーンオブジェクトからインスタンスを生成できる', () => {
      const plain = {
        id: 'settings-001',
        defaultInterval: {
          type: SyncIntervalType.FREQUENT,
        },
        wifiOnly: true,
        batterySavingMode: true,
        autoRetry: false,
        maxRetryCount: 5,
        nightModeSuspend: true,
        nightModeStart: '23:00',
        nightModeEnd: '07:00',
        createdAt: now,
        updatedAt: now,
      };

      const settings = SyncSettings.fromPlain(plain);

      expect(settings.id).toBe('settings-001');
      expect(settings.defaultInterval.type).toBe(SyncIntervalType.FREQUENT);
      expect(settings.wifiOnly).toBe(true);
      expect(settings.batterySavingMode).toBe(true);
      expect(settings.autoRetry).toBe(false);
      expect(settings.maxRetryCount).toBe(5);
      expect(settings.nightModeSuspend).toBe(true);
      expect(settings.nightModeStart).toBe('23:00');
      expect(settings.nightModeEnd).toBe('07:00');
    });

    it('カスタム間隔のプレーンオブジェクトから生成できる', () => {
      const plain = {
        id: 'settings-001',
        defaultInterval: {
          type: SyncIntervalType.CUSTOM,
          value: 30,
          unit: TimeUnit.MINUTES,
        },
        wifiOnly: false,
        batterySavingMode: false,
        autoRetry: true,
        maxRetryCount: 3,
        nightModeSuspend: false,
        nightModeStart: '22:00',
        nightModeEnd: '06:00',
        createdAt: now,
        updatedAt: now,
      };

      const settings = SyncSettings.fromPlain(plain);

      expect(settings.defaultInterval.type).toBe(SyncIntervalType.CUSTOM);
      expect(settings.defaultInterval.value).toBe(30);
      expect(settings.defaultInterval.unit).toBe(TimeUnit.MINUTES);
    });
  });

  describe('toJSON', () => {
    it('JSON形式に変換できる', () => {
      const settings = createValidSyncSettings();
      const json = settings.toJSON();

      expect(json.id).toBe('settings-001');
      expect(json.defaultInterval.type).toBe(SyncIntervalType.STANDARD);
      expect(json.wifiOnly).toBe(false);
      expect(json.batterySavingMode).toBe(false);
      expect(json.autoRetry).toBe(true);
      expect(json.maxRetryCount).toBe(3);
      expect(json.nightModeSuspend).toBe(false);
      expect(json.nightModeStart).toBe('22:00');
      expect(json.nightModeEnd).toBe('06:00');
      expect(json.createdAt).toBe(now);
      expect(json.updatedAt).toBe(now);
    });

    it('カスタム間隔を含むJSON形式に変換できる', () => {
      const customInterval = new SyncInterval(
        SyncIntervalType.CUSTOM,
        30,
        TimeUnit.MINUTES,
      );
      const settings = new SyncSettings(
        'settings-001',
        customInterval,
        false,
        false,
        true,
        3,
        false,
        '22:00',
        '06:00',
        now,
        now,
      );

      const json = settings.toJSON();

      expect(json.defaultInterval.type).toBe(SyncIntervalType.CUSTOM);
      expect(json.defaultInterval.value).toBe(30);
      expect(json.defaultInterval.unit).toBe(TimeUnit.MINUTES);
    });
  });
});
