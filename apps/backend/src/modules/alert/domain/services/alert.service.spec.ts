import { AlertService } from './alert.service';
import { AlertType } from '../enums/alert-type.enum';
import { AlertLevel } from '../enums/alert-level.enum';
import { AlertStatus } from '../enums/alert-status.enum';
import { Reconciliation } from '../../../reconciliation/domain/entities/reconciliation.entity';
import { ReconciliationStatus } from '../../../reconciliation/domain/enums/reconciliation-status.enum';
import { ReconciliationResult } from '../../../reconciliation/domain/value-objects/reconciliation-result.vo';
import { ReconciliationSummary } from '../../../reconciliation/domain/value-objects/reconciliation-summary.vo';
import { Discrepancy } from '../../../reconciliation/domain/value-objects/discrepancy.vo';
import type { AggregationRepository } from '../../../aggregation/domain/repositories/aggregation.repository.interface';
import { MonthlyCardSummary } from '../../../aggregation/domain/entities/monthly-card-summary.entity';
import { PaymentStatus } from '../../../aggregation/domain/enums/payment-status.enum';

describe('AlertService', () => {
  let service: AlertService;
  let aggregationRepository: jest.Mocked<AggregationRepository>;

  beforeEach(() => {
    aggregationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByCardAndMonth: jest.fn(),
      findByCard: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };
    service = new AlertService(aggregationRepository);
  });

  const createMockReconciliation = (
    status: ReconciliationStatus,
    isMatched: boolean,
    amountDifference: number,
  ): Reconciliation => {
    const discrepancy =
      amountDifference !== 0
        ? new Discrepancy(amountDifference, 0, false, '金額不一致')
        : null;

    const result = new ReconciliationResult(
      isMatched,
      100,
      'bank-tx-001',
      'card-summary-001',
      new Date('2025-02-27'),
      discrepancy,
    );

    const summary = new ReconciliationSummary(
      totalResults,
      matchedResults,
      unmatchedResults,
      partialResults,
    );

    return new Reconciliation(
      'reconciliation-001',
      'card-001',
      '2025-01',
      status,
      new Date('2025-01-30'),
      [result],
      summary,
      new Date('2025-01-30'),
      new Date('2025-01-30'),
    );
  };

  const createMockCardSummary = (): MonthlyCardSummary => {
    return new MonthlyCardSummary(
      'summary-001',
      'card-001',
      '三井住友カード',
      '2025-01',
      new Date('2025-01-31'),
      new Date('2025-02-27'),
      50000,
      10,
      [],
      [],
      50000,
      PaymentStatus.PENDING,
      new Date('2025-01-30'),
      new Date('2025-01-30'),
    );
  };

  describe('createAlertFromReconciliation', () => {
    it('金額不一致のアラートを生成できる', async () => {
      const reconciliation = createMockReconciliation(
        ReconciliationStatus.UNMATCHED,
        false,
        -2000,
        1,
        0,
        1,
        0, // total, matched, unmatched, partial
      );
      const cardSummary = createMockCardSummary();
      aggregationRepository.findByCardAndMonth.mockResolvedValue(cardSummary);

      const alert = await service.createAlertFromReconciliation(reconciliation);

      expect(alert.type).toBe(AlertType.AMOUNT_MISMATCH);
      expect(alert.level).toBe(AlertLevel.WARNING);
      expect(alert.status).toBe(AlertStatus.UNREAD);
      expect(alert.details.reconciliationId).toBe(reconciliation.id);
      expect(alert.details.cardName).toBe('三井住友カード');
      expect(alert.details.expectedAmount).toBe(50000);
    });

    it('引落未検出のアラートを生成できる', async () => {
      // 引落未検出の場合は、結果が空のReconciliationを作成
      const summary = new ReconciliationSummary(0, 0, 0, 0);
      const reconciliation = new Reconciliation(
        'reconciliation-001',
        'card-001',
        '2025-01',
        ReconciliationStatus.UNMATCHED,
        new Date('2025-01-30'),
        [], // 結果が空 = 引落未検出
        summary,
        new Date('2025-01-30'),
        new Date('2025-01-30'),
      );
      const cardSummary = createMockCardSummary();
      aggregationRepository.findByCardAndMonth.mockResolvedValue(cardSummary);

      const alert = await service.createAlertFromReconciliation(reconciliation);

      expect(alert.type).toBe(AlertType.PAYMENT_NOT_FOUND);
      expect(alert.level).toBe(AlertLevel.ERROR);
    });

    it('複数候補のアラートを生成できる', async () => {
      const result1 = new ReconciliationResult(
        false,
        50,
        'bank-tx-001',
        'card-summary-001',
        new Date('2025-02-27'),
        new Discrepancy(-1000, 0, false, '金額不一致'),
      );
      const result2 = new ReconciliationResult(
        false,
        50,
        'bank-tx-002',
        'card-summary-001',
        new Date('2025-02-27'),
        new Discrepancy(-2000, 0, false, '金額不一致'),
      );

      const summary = new ReconciliationSummary(2, 0, 2, 0);

      const reconciliation = new Reconciliation(
        'reconciliation-001',
        'card-001',
        '2025-01',
        ReconciliationStatus.UNMATCHED,
        new Date('2025-01-30'),
        [result1, result2],
        summary,
        new Date('2025-01-30'),
        new Date('2025-01-30'),
      );

      const cardSummary = createMockCardSummary();
      aggregationRepository.findByCardAndMonth.mockResolvedValue(cardSummary);

      const alert = await service.createAlertFromReconciliation(reconciliation);

      expect(alert.type).toBe(AlertType.MULTIPLE_CANDIDATES);
      expect(alert.level).toBe(AlertLevel.INFO);
    });
  });

  describe('analyzeReconciliationResult', () => {
    it('金額不一致を検出できる', () => {
      const reconciliation = createMockReconciliation(
        ReconciliationStatus.UNMATCHED,
        false,
        -2000,
      );

      const alertType = service['analyzeReconciliationResult'](reconciliation);

      expect(alertType).toBe(AlertType.AMOUNT_MISMATCH);
    });

    it('引落未検出を検出できる', () => {
      // 引落未検出の場合は、結果が空のReconciliationを作成
      const summary = new ReconciliationSummary(0, 0, 0, 0);
      const reconciliation = new Reconciliation(
        'reconciliation-001',
        'card-001',
        '2025-01',
        ReconciliationStatus.UNMATCHED,
        new Date('2025-01-30'),
        [], // 結果が空 = 引落未検出
        summary,
        new Date('2025-01-30'),
        new Date('2025-01-30'),
      );

      const alertType = service['analyzeReconciliationResult'](reconciliation);

      expect(alertType).toBe(AlertType.PAYMENT_NOT_FOUND);
    });
  });

  describe('determineAlertLevel', () => {
    it('金額不一致はWARNINGレベル', () => {
      const reconciliation = createMockReconciliation(
        ReconciliationStatus.UNMATCHED,
        false,
        -2000,
      );

      const alert = service.createAlertFromReconciliation(reconciliation);

      expect(alert.level).toBe(AlertLevel.WARNING);
    });

    it('引落未検出はERRORレベル', async () => {
      // 引落未検出の場合は、結果が空のReconciliationを作成
      const summary = new ReconciliationSummary(0, 0, 0, 0);
      const reconciliation = new Reconciliation(
        'reconciliation-001',
        'card-001',
        '2025-01',
        ReconciliationStatus.UNMATCHED,
        new Date('2025-01-30'),
        [], // 結果が空 = 引落未検出
        summary,
        new Date('2025-01-30'),
        new Date('2025-01-30'),
      );
      const cardSummary = createMockCardSummary();
      aggregationRepository.findByCardAndMonth.mockResolvedValue(cardSummary);

      const alert = await service.createAlertFromReconciliation(reconciliation);

      expect(alert.level).toBe(AlertLevel.ERROR);
    });

    it('複数候補はINFOレベル', async () => {
      const result1 = new ReconciliationResult(
        false,
        50,
        'bank-tx-001',
        'card-summary-001',
        new Date('2025-02-27'),
        new Discrepancy(-1000, 0, false, '金額不一致'),
      );
      const result2 = new ReconciliationResult(
        false,
        50,
        'bank-tx-002',
        'card-summary-001',
        new Date('2025-02-27'),
        new Discrepancy(-2000, 0, false, '金額不一致'),
      );

      const summary = new ReconciliationSummary(2, 0, 2, 0);

      const reconciliation = new Reconciliation(
        'reconciliation-001',
        'card-001',
        '2025-01',
        ReconciliationStatus.UNMATCHED,
        new Date('2025-01-30'),
        [result1, result2],
        summary,
        new Date('2025-01-30'),
        new Date('2025-01-30'),
      );

      const cardSummary = createMockCardSummary();
      aggregationRepository.findByCardAndMonth.mockResolvedValue(cardSummary);

      const alert = await service.createAlertFromReconciliation(reconciliation);

      expect(alert.level).toBe(AlertLevel.INFO);
    });
  });
});
