import { Reconciliation } from './reconciliation.entity';
import { ReconciliationStatus } from '../enums/reconciliation-status.enum';
import { ReconciliationResult } from '../value-objects/reconciliation-result.vo';
import { ReconciliationSummary } from '../value-objects/reconciliation-summary.vo';

describe('Reconciliation Entity', () => {
  const createMockReconciliation = (
    overrides?: Partial<{
      id: string;
      cardId: string;
      billingMonth: string;
      status: ReconciliationStatus;
      executedAt: Date;
      results: ReconciliationResult[];
      summary: ReconciliationSummary;
      createdAt: Date;
      updatedAt: Date;
    }>,
  ) => {
    const defaults = {
      id: 'reconciliation-001',
      cardId: 'card-001',
      billingMonth: '2025-01',
      status: ReconciliationStatus.MATCHED,
      executedAt: new Date('2025-01-30'),
      results: [
        new ReconciliationResult(
          true,
          100,
          'bank-tx-001',
          'card-summary-001',
          new Date('2025-01-30'),
          null,
        ),
      ],
      summary: new ReconciliationSummary(1, 1, 0, 0),
      createdAt: new Date('2025-01-30'),
      updatedAt: new Date('2025-01-30'),
      ...overrides,
    };

    return new Reconciliation(
      defaults.id,
      defaults.cardId,
      defaults.billingMonth,
      defaults.status,
      defaults.executedAt,
      defaults.results,
      defaults.summary,
      defaults.createdAt,
      defaults.updatedAt,
    );
  };

  describe('constructor', () => {
    it('正常に作成できる', () => {
      const reconciliation = createMockReconciliation();

      expect(reconciliation.id).toBe('reconciliation-001');
      expect(reconciliation.cardId).toBe('card-001');
      expect(reconciliation.billingMonth).toBe('2025-01');
      expect(reconciliation.status).toBe(ReconciliationStatus.MATCHED);
    });

    it('billingMonthが不正な形式の場合エラー', () => {
      expect(() =>
        createMockReconciliation({ billingMonth: '2025-13' }),
      ).toThrow('Billing month must be in YYYY-MM format');
    });
  });

  describe('status management', () => {
    it('MATCHEDに更新できる', () => {
      const reconciliation = createMockReconciliation({
        status: ReconciliationStatus.PENDING,
      });

      reconciliation.markAsMatched();

      expect(reconciliation.status).toBe(ReconciliationStatus.MATCHED);
    });

    it('UNMATCHEDに更新できる', () => {
      const reconciliation = createMockReconciliation({
        status: ReconciliationStatus.PENDING,
      });

      reconciliation.markAsUnmatched();

      expect(reconciliation.status).toBe(ReconciliationStatus.UNMATCHED);
    });

    it('PARTIALに更新できる', () => {
      const reconciliation = createMockReconciliation({
        status: ReconciliationStatus.PENDING,
      });

      reconciliation.markAsPartial();

      expect(reconciliation.status).toBe(ReconciliationStatus.PARTIAL);
    });
  });
});
