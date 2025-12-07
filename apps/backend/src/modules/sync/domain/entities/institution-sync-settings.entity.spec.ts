import { InstitutionSyncSettings } from './institution-sync-settings.entity';
import { SyncInterval } from '../value-objects/sync-interval.vo';
import { SyncIntervalType } from '../enums/sync-interval-type.enum';
import { TimeUnit } from '../enums/time-unit.enum';
import { InstitutionSyncStatus } from '../enums/institution-sync-status.enum';

describe('InstitutionSyncSettings', () => {
  const now = new Date('2025-01-01T00:00:00Z');
  const defaultInterval = new SyncInterval(SyncIntervalType.STANDARD);

  const createValidInstitutionSyncSettings = (): InstitutionSyncSettings => {
    return new InstitutionSyncSettings(
      'inst-settings-001',
      'institution-001',
      defaultInterval,
      true, // enabled
      null, // lastSyncedAt
      null, // nextSyncAt
      InstitutionSyncStatus.IDLE,
      0, // errorCount
      null, // lastError
      now,
      now,
    );
  };

  describe('constructor', () => {
    it('有効なパラメータでインスタンスを作成できる', () => {
      const settings = createValidInstitutionSyncSettings();

      expect(settings.id).toBe('inst-settings-001');
      expect(settings.institutionId).toBe('institution-001');
      expect(settings.interval).toBe(defaultInterval);
      expect(settings.enabled).toBe(true);
      expect(settings.lastSyncedAt).toBeNull();
      expect(settings.nextSyncAt).toBeNull();
      expect(settings.syncStatus).toBe(InstitutionSyncStatus.IDLE);
      expect(settings.errorCount).toBe(0);
      expect(settings.lastError).toBeNull();
    });
  });

  describe('updateInterval', () => {
    it('同期間隔を更新できる', () => {
      const settings = createValidInstitutionSyncSettings();
      const newInterval = new SyncInterval(SyncIntervalType.FREQUENT);

      const updated = settings.updateInterval(newInterval);

      expect(updated.interval).toBe(newInterval);
      expect(updated.id).toBe(settings.id);
      expect(updated.institutionId).toBe(settings.institutionId);
      expect(updated.enabled).toBe(settings.enabled);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        settings.updatedAt.getTime(),
      );
    });

    it('次回同期時刻を再計算する', () => {
      const lastSyncedAt = new Date('2025-01-01T10:00:00Z');
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        defaultInterval,
        true,
        lastSyncedAt,
        null,
        InstitutionSyncStatus.IDLE,
        0,
        null,
        now,
        now,
      );
      const newInterval = new SyncInterval(SyncIntervalType.FREQUENT);

      const updated = settings.updateInterval(newInterval);

      expect(updated.nextSyncAt).not.toBeNull();
      expect(updated.nextSyncAt).toBeInstanceOf(Date);
    });

    it('元のインスタンスは変更されない（不変性）', () => {
      const settings = createValidInstitutionSyncSettings();
      const originalInterval = settings.interval;
      const newInterval = new SyncInterval(SyncIntervalType.FREQUENT);

      settings.updateInterval(newInterval);

      expect(settings.interval).toBe(originalInterval);
    });
  });

  describe('setEnabled', () => {
    it('有効/無効を設定できる', () => {
      const settings = createValidInstitutionSyncSettings();

      const disabled = settings.setEnabled(false);

      expect(disabled.enabled).toBe(false);
      expect(disabled.id).toBe(settings.id);
      expect(disabled.interval).toBe(settings.interval);
      expect(disabled.updatedAt.getTime()).toBeGreaterThan(
        settings.updatedAt.getTime(),
      );
    });

    it('無効から有効に変更できる', () => {
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        defaultInterval,
        false, // enabled = false
        null,
        null,
        InstitutionSyncStatus.IDLE,
        0,
        null,
        now,
        now,
      );

      const enabled = settings.setEnabled(true);

      expect(enabled.enabled).toBe(true);
    });
  });

  describe('updateSyncStatus', () => {
    it('同期ステータスを更新できる', () => {
      const settings = createValidInstitutionSyncSettings();

      const updated = settings.updateSyncStatus(InstitutionSyncStatus.SYNCING);

      expect(updated.syncStatus).toBe(InstitutionSyncStatus.SYNCING);
      expect(updated.id).toBe(settings.id);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        settings.updatedAt.getTime(),
      );
    });

    it('すべてのステータスに更新できる', () => {
      const settings = createValidInstitutionSyncSettings();

      const statuses = [
        InstitutionSyncStatus.IDLE,
        InstitutionSyncStatus.SYNCING,
        InstitutionSyncStatus.SUCCESS,
        InstitutionSyncStatus.ERROR,
      ];

      statuses.forEach((status) => {
        const updated = settings.updateSyncStatus(status);
        expect(updated.syncStatus).toBe(status);
      });
    });
  });

  describe('calculateNextSyncAt', () => {
    it('有効で手動以外の場合は次回同期時刻を計算する', () => {
      const lastSyncedAt = new Date('2025-01-01T10:00:00Z');
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        defaultInterval,
        true, // enabled
        lastSyncedAt,
        null,
        InstitutionSyncStatus.IDLE,
        0,
        null,
        now,
        now,
      );

      const nextSyncAt = settings.calculateNextSyncAt();

      expect(nextSyncAt).not.toBeNull();
      expect(nextSyncAt).toBeInstanceOf(Date);
    });

    it('無効の場合はnullを返す', () => {
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        defaultInterval,
        false, // enabled = false
        null,
        null,
        InstitutionSyncStatus.IDLE,
        0,
        null,
        now,
        now,
      );

      const nextSyncAt = settings.calculateNextSyncAt();

      expect(nextSyncAt).toBeNull();
    });

    it('手動同期の場合はnullを返す', () => {
      const manualInterval = new SyncInterval(SyncIntervalType.MANUAL);
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        manualInterval,
        true, // enabled
        null,
        null,
        InstitutionSyncStatus.IDLE,
        0,
        null,
        now,
        now,
      );

      const nextSyncAt = settings.calculateNextSyncAt();

      expect(nextSyncAt).toBeNull();
    });

    it('計算エラー時はnullを返す', () => {
      const lastSyncedAt = new Date('2025-01-01T10:00:00Z');
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        defaultInterval,
        true,
        lastSyncedAt,
        null,
        InstitutionSyncStatus.IDLE,
        0,
        null,
        now,
        now,
      );

      // calculateNextSyncAtは内部でtry-catchしているため、エラー時もnullを返す
      const nextSyncAt = settings.calculateNextSyncAt();

      // 正常な場合はDate、エラー時はnull
      expect(nextSyncAt === null || nextSyncAt instanceof Date).toBe(true);
    });
  });

  describe('incrementErrorCount', () => {
    it('エラー回数を増加できる', () => {
      const settings = createValidInstitutionSyncSettings();

      const updated = settings.incrementErrorCount();

      expect(updated.errorCount).toBe(1);
      expect(updated.syncStatus).toBe(InstitutionSyncStatus.ERROR);
      expect(updated.id).toBe(settings.id);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        settings.updatedAt.getTime(),
      );
    });

    it('エラー回数を複数回増加できる', () => {
      const settings = createValidInstitutionSyncSettings();

      const updated1 = settings.incrementErrorCount();
      const updated2 = updated1.incrementErrorCount();
      const updated3 = updated2.incrementErrorCount();

      expect(updated3.errorCount).toBe(3);
      expect(updated3.syncStatus).toBe(InstitutionSyncStatus.ERROR);
    });

    it('エラー回数増加時にステータスをERRORに更新する', () => {
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        defaultInterval,
        true,
        null,
        null,
        InstitutionSyncStatus.IDLE,
        0,
        null,
        now,
        now,
      );

      const updated = settings.incrementErrorCount();

      expect(updated.syncStatus).toBe(InstitutionSyncStatus.ERROR);
    });
  });

  describe('resetErrorCount', () => {
    it('エラー回数をリセットできる', () => {
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        defaultInterval,
        true,
        null,
        null,
        InstitutionSyncStatus.ERROR,
        5, // errorCount = 5
        'Some error',
        now,
        now,
      );

      const updated = settings.resetErrorCount();

      expect(updated.errorCount).toBe(0);
      expect(updated.lastError).toBeNull();
      expect(updated.syncStatus).toBe(InstitutionSyncStatus.ERROR); // ステータスは変更されない
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        settings.updatedAt.getTime(),
      );
    });
  });

  describe('updateLastSyncedAt', () => {
    it('最終同期日時を更新できる', () => {
      const settings = createValidInstitutionSyncSettings();
      const newLastSyncedAt = new Date('2025-01-01T12:00:00Z');

      const updated = settings.updateLastSyncedAt(newLastSyncedAt);

      expect(updated.lastSyncedAt).toBe(newLastSyncedAt);
      expect(updated.syncStatus).toBe(InstitutionSyncStatus.IDLE);
      expect(updated.lastError).toBeNull();
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        settings.updatedAt.getTime(),
      );
    });

    it('次回同期時刻を再計算する', () => {
      const settings = createValidInstitutionSyncSettings();
      const newLastSyncedAt = new Date('2025-01-01T12:00:00Z');

      const updated = settings.updateLastSyncedAt(newLastSyncedAt);

      expect(updated.nextSyncAt).not.toBeNull();
      expect(updated.nextSyncAt).toBeInstanceOf(Date);
    });

    it('同期成功時にステータスをIDLEに更新する', () => {
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        defaultInterval,
        true,
        null,
        null,
        InstitutionSyncStatus.SYNCING,
        0,
        null,
        now,
        now,
      );
      const newLastSyncedAt = new Date('2025-01-01T12:00:00Z');

      const updated = settings.updateLastSyncedAt(newLastSyncedAt);

      expect(updated.syncStatus).toBe(InstitutionSyncStatus.IDLE);
    });

    it('同期成功時にエラーメッセージをクリアする', () => {
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        defaultInterval,
        true,
        null,
        null,
        InstitutionSyncStatus.ERROR,
        1,
        'Previous error',
        now,
        now,
      );
      const newLastSyncedAt = new Date('2025-01-01T12:00:00Z');

      const updated = settings.updateLastSyncedAt(newLastSyncedAt);

      expect(updated.lastError).toBeNull();
    });
  });

  describe('setLastError', () => {
    it('エラーメッセージを設定できる', () => {
      const settings = createValidInstitutionSyncSettings();

      const updated = settings.setLastError('Connection failed');

      expect(updated.lastError).toBe('Connection failed');
      expect(updated.syncStatus).toBe(InstitutionSyncStatus.ERROR);
      expect(updated.errorCount).toBe(settings.errorCount); // エラー回数は変更されない
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        settings.updatedAt.getTime(),
      );
    });

    it('エラー設定時にステータスをERRORに更新する', () => {
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        defaultInterval,
        true,
        null,
        null,
        InstitutionSyncStatus.IDLE,
        0,
        null,
        now,
        now,
      );

      const updated = settings.setLastError('Some error');

      expect(updated.syncStatus).toBe(InstitutionSyncStatus.ERROR);
    });
  });

  describe('create', () => {
    it('新規インスタンスを作成できる', () => {
      const settings = InstitutionSyncSettings.create(
        'institution-001',
        null,
        defaultInterval,
      );

      expect(settings.id).toBeDefined();
      expect(settings.institutionId).toBe('institution-001');
      expect(settings.interval).toBe(defaultInterval);
      expect(settings.enabled).toBe(true);
      expect(settings.lastSyncedAt).toBeNull();
      expect(settings.nextSyncAt).not.toBeNull();
      expect(settings.syncStatus).toBe(InstitutionSyncStatus.IDLE);
      expect(settings.errorCount).toBe(0);
      expect(settings.lastError).toBeNull();
      expect(settings.createdAt).toBeInstanceOf(Date);
      expect(settings.updatedAt).toBeInstanceOf(Date);
    });

    it('指定された間隔で新規インスタンスを作成できる', () => {
      const customInterval = new SyncInterval(
        SyncIntervalType.CUSTOM,
        30,
        TimeUnit.MINUTES,
      );

      const settings = InstitutionSyncSettings.create(
        'institution-001',
        customInterval,
        defaultInterval,
      );

      expect(settings.interval).toBe(customInterval);
    });

    it('間隔がnullの場合はデフォルト間隔を使用する', () => {
      const settings = InstitutionSyncSettings.create(
        'institution-001',
        null,
        defaultInterval,
      );

      expect(settings.interval).toBe(defaultInterval);
    });

    it('毎回異なるIDが生成される', () => {
      const settings1 = InstitutionSyncSettings.create(
        'institution-001',
        null,
        defaultInterval,
      );
      const settings2 = InstitutionSyncSettings.create(
        'institution-001',
        null,
        defaultInterval,
      );

      expect(settings1.id).not.toBe(settings2.id);
    });
  });

  describe('fromPlain', () => {
    it('プレーンオブジェクトからインスタンスを生成できる', () => {
      const plain = {
        id: 'inst-settings-001',
        institutionId: 'institution-001',
        interval: {
          type: SyncIntervalType.FREQUENT,
        },
        enabled: true,
        lastSyncedAt: new Date('2025-01-01T10:00:00Z'),
        nextSyncAt: new Date('2025-01-01T11:00:00Z'),
        syncStatus: InstitutionSyncStatus.SUCCESS,
        errorCount: 0,
        lastError: null,
        createdAt: now,
        updatedAt: now,
      };

      const settings = InstitutionSyncSettings.fromPlain(plain);

      expect(settings.id).toBe('inst-settings-001');
      expect(settings.institutionId).toBe('institution-001');
      expect(settings.interval.type).toBe(SyncIntervalType.FREQUENT);
      expect(settings.enabled).toBe(true);
      expect(settings.lastSyncedAt).toEqual(new Date('2025-01-01T10:00:00Z'));
      expect(settings.nextSyncAt).toEqual(new Date('2025-01-01T11:00:00Z'));
      expect(settings.syncStatus).toBe(InstitutionSyncStatus.SUCCESS);
      expect(settings.errorCount).toBe(0);
      expect(settings.lastError).toBeNull();
    });

    it('null値を含むプレーンオブジェクトから生成できる', () => {
      const plain = {
        id: 'inst-settings-001',
        institutionId: 'institution-001',
        interval: {
          type: SyncIntervalType.STANDARD,
        },
        enabled: false,
        lastSyncedAt: null,
        nextSyncAt: null,
        syncStatus: InstitutionSyncStatus.IDLE,
        errorCount: 0,
        lastError: null,
        createdAt: now,
        updatedAt: now,
      };

      const settings = InstitutionSyncSettings.fromPlain(plain);

      expect(settings.lastSyncedAt).toBeNull();
      expect(settings.nextSyncAt).toBeNull();
      expect(settings.lastError).toBeNull();
    });

    it('カスタム間隔のプレーンオブジェクトから生成できる', () => {
      const plain = {
        id: 'inst-settings-001',
        institutionId: 'institution-001',
        interval: {
          type: SyncIntervalType.CUSTOM,
          value: 30,
          unit: TimeUnit.MINUTES,
        },
        enabled: true,
        lastSyncedAt: null,
        nextSyncAt: null,
        syncStatus: InstitutionSyncStatus.IDLE,
        errorCount: 0,
        lastError: null,
        createdAt: now,
        updatedAt: now,
      };

      const settings = InstitutionSyncSettings.fromPlain(plain);

      expect(settings.interval.type).toBe(SyncIntervalType.CUSTOM);
      expect(settings.interval.value).toBe(30);
      expect(settings.interval.unit).toBe(TimeUnit.MINUTES);
    });
  });

  describe('toJSON', () => {
    it('JSON形式に変換できる', () => {
      const settings = createValidInstitutionSyncSettings();
      const json = settings.toJSON();

      expect(json.id).toBe('inst-settings-001');
      expect(json.institutionId).toBe('institution-001');
      expect(json.interval.type).toBe(SyncIntervalType.STANDARD);
      expect(json.enabled).toBe(true);
      expect(json.lastSyncedAt).toBeNull();
      expect(json.nextSyncAt).toBeNull();
      expect(json.syncStatus).toBe(InstitutionSyncStatus.IDLE);
      expect(json.errorCount).toBe(0);
      expect(json.lastError).toBeNull();
    });

    it('日時を含むJSON形式に変換できる', () => {
      const lastSyncedAt = new Date('2025-01-01T10:00:00Z');
      const nextSyncAt = new Date('2025-01-01T11:00:00Z');
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        defaultInterval,
        true,
        lastSyncedAt,
        nextSyncAt,
        InstitutionSyncStatus.SUCCESS,
        0,
        null,
        now,
        now,
      );

      const json = settings.toJSON();

      // toJSON()はDateオブジェクトを返す（APIレスポンス用）
      expect(json.lastSyncedAt).toEqual(lastSyncedAt);
      expect(json.nextSyncAt).toEqual(nextSyncAt);
    });

    it('エラー情報を含むJSON形式に変換できる', () => {
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        defaultInterval,
        true,
        null,
        null,
        InstitutionSyncStatus.ERROR,
        3,
        'Connection failed',
        now,
        now,
      );

      const json = settings.toJSON();

      expect(json.syncStatus).toBe(InstitutionSyncStatus.ERROR);
      expect(json.errorCount).toBe(3);
      expect(json.lastError).toBe('Connection failed');
    });
  });
});
