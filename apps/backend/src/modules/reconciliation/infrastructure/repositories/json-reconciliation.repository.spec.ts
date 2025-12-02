import { Test, TestingModule } from '@nestjs/testing';
import { promises as fs } from 'fs';
import * as path from 'path';
import { JsonReconciliationRepository } from './json-reconciliation.repository';
import { Reconciliation } from '../../domain/entities/reconciliation.entity';
import { ReconciliationStatus } from '../../domain/enums/reconciliation-status.enum';
import { ReconciliationResult } from '../../domain/value-objects/reconciliation-result.vo';
import { ReconciliationSummary } from '../../domain/value-objects/reconciliation-summary.vo';

const DATA_DIR = path.join(process.cwd(), 'data', 'reconciliation');
const FILE_NAME = 'reconciliations.json';
const FILE_PATH = path.join(DATA_DIR, FILE_NAME);

describe('JsonReconciliationRepository', () => {
  let repository: JsonReconciliationRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JsonReconciliationRepository],
    }).compile();

    repository = module.get<JsonReconciliationRepository>(
      JsonReconciliationRepository,
    );

    // テスト前にファイルを削除
    try {
      await fs.unlink(FILE_PATH);
    } catch {
      // ファイルが存在しない場合は無視
    }
  });

  afterEach(async () => {
    // テスト後にファイルを削除
    try {
      await fs.unlink(FILE_PATH);
    } catch {
      // ファイルが存在しない場合は無視
    }
  });

  const createMockReconciliation = (): Reconciliation => {
    const result = new ReconciliationResult(
      true,
      100,
      'bank-tx-001',
      'card-summary-001',
      new Date('2025-01-30'),
      null,
    );
    const summary = new ReconciliationSummary(1, 1, 0, 0);

    return new Reconciliation(
      'reconciliation-001',
      'card-001',
      '2025-01',
      ReconciliationStatus.MATCHED,
      new Date('2025-01-30'),
      [result],
      summary,
      new Date('2025-01-30'),
      new Date('2025-01-30'),
    );
  };

  describe('save', () => {
    it('新規データを保存できる', async () => {
      const reconciliation = createMockReconciliation();

      const saved = await repository.save(reconciliation);

      expect(saved.id).toBe(reconciliation.id);
      expect(saved.cardId).toBe(reconciliation.cardId);
      expect(saved.billingMonth).toBe(reconciliation.billingMonth);
    });

    it('既存データを更新できる', async () => {
      const reconciliation = createMockReconciliation();
      await repository.save(reconciliation);

      const updated = new Reconciliation(
        reconciliation.id,
        reconciliation.cardId,
        reconciliation.billingMonth,
        ReconciliationStatus.UNMATCHED,
        reconciliation.executedAt,
        reconciliation.results,
        reconciliation.summary,
        reconciliation.createdAt,
        new Date('2025-01-31'),
      );

      const saved = await repository.save(updated);

      expect(saved.status).toBe(ReconciliationStatus.UNMATCHED);
      expect(saved.updatedAt.getTime()).toBeGreaterThan(
        reconciliation.updatedAt.getTime(),
      );
    });
  });

  describe('findById', () => {
    it('IDでデータを取得できる', async () => {
      const reconciliation = createMockReconciliation();
      await repository.save(reconciliation);

      const found = await repository.findById(reconciliation.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(reconciliation.id);
    });

    it('存在しないIDの場合はnullを返す', async () => {
      const found = await repository.findById('non-existent-id');

      expect(found).toBeNull();
    });
  });

  describe('findByCardAndMonth', () => {
    it('カードIDと請求月でデータを取得できる', async () => {
      const reconciliation = createMockReconciliation();
      await repository.save(reconciliation);

      const found = await repository.findByCardAndMonth(
        reconciliation.cardId,
        reconciliation.billingMonth,
      );

      expect(found).not.toBeNull();
      expect(found?.cardId).toBe(reconciliation.cardId);
      expect(found?.billingMonth).toBe(reconciliation.billingMonth);
    });

    it('存在しない場合はnullを返す', async () => {
      const found = await repository.findByCardAndMonth('card-999', '2025-12');

      expect(found).toBeNull();
    });
  });

  describe('findByCard', () => {
    it('カードIDと期間でデータを取得できる', async () => {
      const reconciliation1 = new Reconciliation(
        'reconciliation-001',
        'card-001',
        '2025-01',
        ReconciliationStatus.MATCHED,
        new Date('2025-01-30'),
        [createMockReconciliation().results[0]],
        new ReconciliationSummary(1, 1, 0, 0),
        new Date('2025-01-30'),
        new Date('2025-01-30'),
      );
      const reconciliation2 = new Reconciliation(
        'reconciliation-002',
        'card-001',
        '2025-02',
        ReconciliationStatus.MATCHED,
        new Date('2025-02-28'),
        [createMockReconciliation().results[0]],
        new ReconciliationSummary(1, 1, 0, 0),
        new Date('2025-02-28'),
        new Date('2025-02-28'),
      );

      await repository.save(reconciliation1);
      await repository.save(reconciliation2);

      const found = await repository.findByCard(
        'card-001',
        '2025-01',
        '2025-02',
      );

      expect(found).toHaveLength(2);
      expect(found[0].billingMonth).toBe('2025-01');
      expect(found[1].billingMonth).toBe('2025-02');
    });
  });

  describe('findAll', () => {
    it('すべてのデータを取得できる', async () => {
      const reconciliation1 = createMockReconciliation();
      const reconciliation2 = new Reconciliation(
        'reconciliation-002',
        'card-002',
        '2025-01',
        ReconciliationStatus.MATCHED,
        new Date('2025-01-30'),
        [createMockReconciliation().results[0]],
        new ReconciliationSummary(1, 1, 0, 0),
        new Date('2025-01-30'),
        new Date('2025-01-30'),
      );

      await repository.save(reconciliation1);
      await repository.save(reconciliation2);

      const found = await repository.findAll();

      expect(found).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('データを削除できる', async () => {
      const reconciliation = createMockReconciliation();
      await repository.save(reconciliation);

      await repository.delete(reconciliation.id);

      const found = await repository.findById(reconciliation.id);
      expect(found).toBeNull();
    });
  });
});
