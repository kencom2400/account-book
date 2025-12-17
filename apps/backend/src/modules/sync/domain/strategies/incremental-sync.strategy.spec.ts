import { Test, TestingModule } from '@nestjs/testing';
import { IncrementalSyncStrategy } from './incremental-sync.strategy';
import { SyncHistory } from '../entities/sync-history.entity';
import { SyncStatus } from '../enums/sync-status.enum';
import { InstitutionType } from '@account-book/types';

describe('IncrementalSyncStrategy', () => {
  let strategy: IncrementalSyncStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncrementalSyncStrategy],
    }).compile();

    strategy = module.get<IncrementalSyncStrategy>(IncrementalSyncStrategy);
  });

  const createSyncHistory = (
    id: string,
    institutionId: string,
    status: SyncStatus,
    completedAt: Date | null = null,
  ): SyncHistory => {
    return new SyncHistory(
      id,
      institutionId,
      'Test Bank',
      InstitutionType.BANK,
      status,
      new Date('2025-01-01'),
      completedAt,
      0,
      0,
      0,
      null,
      0,
      new Date(),
      new Date(),
    );
  };

  describe('determineStartDate', () => {
    it('全件同期が強制されている場合、デフォルト開始日を返す', () => {
      const institutionId = 'inst-1';
      const lastSync = createSyncHistory(
        'sync-1',
        institutionId,
        SyncStatus.COMPLETED,
        new Date('2025-01-10'),
      );

      const startDate = strategy.determineStartDate(
        institutionId,
        lastSync,
        true,
      );

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 90);
      expect(startDate.getTime()).toBeCloseTo(expectedDate.getTime(), -3); // ミリ秒単位の誤差を許容
    });

    it('前回の成功した同期がある場合、完了日時から1日前を返す', () => {
      const institutionId = 'inst-1';
      const completedAt = new Date('2025-01-15T10:00:00Z');
      const lastSync = createSyncHistory(
        'sync-1',
        institutionId,
        SyncStatus.COMPLETED,
        completedAt,
      );

      const startDate = strategy.determineStartDate(
        institutionId,
        lastSync,
        false,
      );

      const expectedDate = new Date(completedAt);
      expectedDate.setDate(expectedDate.getDate() - 1);
      expect(startDate.getTime()).toBe(expectedDate.getTime());
    });

    it('初回同期の場合、デフォルト開始日を返す', () => {
      const institutionId = 'inst-1';

      const startDate = strategy.determineStartDate(institutionId, null, false);

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 90);
      expect(startDate.getTime()).toBeCloseTo(expectedDate.getTime(), -3);
    });

    it('前回の同期が完了していない場合、デフォルト開始日を返す', () => {
      const institutionId = 'inst-1';
      const lastSync = createSyncHistory(
        'sync-1',
        institutionId,
        SyncStatus.FAILED,
        null,
      );

      const startDate = strategy.determineStartDate(
        institutionId,
        lastSync,
        false,
      );

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - 90);
      expect(startDate.getTime()).toBeCloseTo(expectedDate.getTime(), -3);
    });
  });

  describe('filterDuplicates', () => {
    it('重複がない場合、すべてのレコードを新規として返す', () => {
      const transactions = [
        { id: 'tx-1', amount: 1000 },
        { id: 'tx-2', amount: 2000 },
        { id: 'tx-3', amount: 3000 },
      ];
      const existingIds = new Set<string>();

      const result = strategy.filterDuplicates(transactions, existingIds);

      expect(result.newRecords.length).toBe(3);
      expect(result.duplicateRecords.length).toBe(0);
      expect(result.stats.total).toBe(3);
      expect(result.stats.new).toBe(3);
      expect(result.stats.duplicate).toBe(0);
    });

    it('重複がある場合、重複を除外する', () => {
      const transactions = [
        { id: 'tx-1', amount: 1000 },
        { id: 'tx-2', amount: 2000 },
        { id: 'tx-3', amount: 3000 },
      ];
      const existingIds = new Set<string>(['tx-1', 'tx-3']);

      const result = strategy.filterDuplicates(transactions, existingIds);

      expect(result.newRecords.length).toBe(1);
      expect(result.newRecords[0].id).toBe('tx-2');
      expect(result.duplicateRecords.length).toBe(2);
      expect(result.duplicateRecords.map((t) => t.id)).toEqual(
        expect.arrayContaining(['tx-1', 'tx-3']),
      );
      expect(result.stats.total).toBe(3);
      expect(result.stats.new).toBe(1);
      expect(result.stats.duplicate).toBe(2);
    });

    it('IDがないレコードは新規として扱う', () => {
      const transactions = [
        { id: 'tx-1', amount: 1000 },
        { amount: 2000 }, // IDなし
        { id: 'tx-3', amount: 3000 },
      ];
      const existingIds = new Set<string>(['tx-1']);

      const result = strategy.filterDuplicates(transactions, existingIds);

      expect(result.newRecords.length).toBe(2);
      expect(result.newRecords.some((t) => !t.id)).toBe(true);
      expect(result.duplicateRecords.length).toBe(1);
      expect(result.duplicateRecords[0].id).toBe('tx-1');
    });

    it('空の配列を処理できる', () => {
      const transactions: Array<{ id?: string }> = [];
      const existingIds = new Set<string>();

      const result = strategy.filterDuplicates(transactions, existingIds);

      expect(result.newRecords.length).toBe(0);
      expect(result.duplicateRecords.length).toBe(0);
      expect(result.stats.total).toBe(0);
      expect(result.stats.new).toBe(0);
      expect(result.stats.duplicate).toBe(0);
    });
  });

  describe('validateSyncPeriod', () => {
    it('有効な期間の場合、valid: trueを返す', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-15');

      const result = strategy.validateSyncPeriod(startDate, endDate);

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('開始日が終了日より後の場合、valid: falseを返す', () => {
      const startDate = new Date('2025-01-15');
      const endDate = new Date('2025-01-01');

      const result = strategy.validateSyncPeriod(startDate, endDate);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('開始日が終了日より後になっています');
    });

    it('期間が365日を超える場合、valid: falseを返す', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2025-01-10'); // 375日

      const result = strategy.validateSyncPeriod(startDate, endDate);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('同期期間が長すぎます');
      expect(result.reason).toContain('最大365日まで');
    });

    it('終了日が未来の日付の場合、valid: falseを返す', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1); // 明日

      const result = strategy.validateSyncPeriod(startDate, endDate);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('終了日が未来の日付です');
    });

    it('開始日と終了日が同じ場合、valid: trueを返す', () => {
      const date = new Date('2025-01-15');
      const startDate = date;
      const endDate = new Date(date);

      const result = strategy.validateSyncPeriod(startDate, endDate);

      expect(result.valid).toBe(true);
    });

    it('ちょうど365日の期間は有効', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31'); // 365日

      const result = strategy.validateSyncPeriod(startDate, endDate);

      expect(result.valid).toBe(true);
    });
  });

  describe('optimizeSyncPeriod', () => {
    it('期間がmaxDays以下の場合、調整なしで返す', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-15'); // 14日

      const result = strategy.optimizeSyncPeriod(startDate, endDate, 90);

      expect(result.adjusted).toBe(false);
      expect(result.startDate.getTime()).toBe(startDate.getTime());
      expect(result.endDate.getTime()).toBe(endDate.getTime());
    });

    it('期間がmaxDaysを超える場合、最近のデータを優先して調整する', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2025-01-15'); // 380日
      const maxDays = 90;

      const result = strategy.optimizeSyncPeriod(startDate, endDate, maxDays);

      expect(result.adjusted).toBe(true);
      expect(result.endDate.getTime()).toBe(endDate.getTime());
      const daysDiff = Math.ceil(
        (result.endDate.getTime() - result.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      expect(daysDiff).toBe(maxDays);
    });

    it('デフォルトのmaxDaysは90日', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2025-01-15'); // 380日

      const result = strategy.optimizeSyncPeriod(startDate, endDate);

      expect(result.adjusted).toBe(true);
      const daysDiff = Math.ceil(
        (result.endDate.getTime() - result.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      expect(daysDiff).toBe(90);
    });

    it('カスタムのmaxDaysを指定できる', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2025-01-15'); // 380日
      const maxDays = 30;

      const result = strategy.optimizeSyncPeriod(startDate, endDate, maxDays);

      expect(result.adjusted).toBe(true);
      const daysDiff = Math.ceil(
        (result.endDate.getTime() - result.startDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      expect(daysDiff).toBe(maxDays);
    });
  });
});
