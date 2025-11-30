import { ReconciliationSummary } from './reconciliation-summary.vo';
import { ReconciliationResult } from './reconciliation-result.vo';
import { Discrepancy } from './discrepancy.vo';

describe('ReconciliationSummary Value Object', () => {
  describe('constructor', () => {
    it('正常に作成できる', () => {
      const summary = new ReconciliationSummary(10, 7, 2, 1);

      expect(summary.total).toBe(10);
      expect(summary.matched).toBe(7);
      expect(summary.unmatched).toBe(2);
      expect(summary.partial).toBe(1);
    });

    it('合計が一致しない場合エラー', () => {
      expect(() => new ReconciliationSummary(10, 7, 2, 0)).toThrow(
        'Sum of matched, unmatched, and partial must equal total',
      );
    });
  });

  describe('calculateSummary', () => {
    it('照合結果からサマリーを計算できる', () => {
      const results = [
        new ReconciliationResult(
          true,
          100,
          'bank-tx-001',
          'card-summary-001',
          new Date(),
          null,
        ),
        new ReconciliationResult(
          false,
          70,
          null,
          'card-summary-002',
          null,
          new Discrepancy(0, 1, false, '部分一致'),
        ),
        new ReconciliationResult(
          false,
          0,
          null,
          'card-summary-003',
          null,
          new Discrepancy(1000, 0, false, '不一致'),
        ),
      ];

      const summary = ReconciliationSummary.calculateSummary(results);

      expect(summary.total).toBe(3);
      expect(summary.matched).toBe(1);
      expect(summary.unmatched).toBe(1);
      expect(summary.partial).toBe(1);
    });
  });
});
