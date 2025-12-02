import { ReconciliationResult } from './reconciliation-result.vo';

import { Discrepancy } from './discrepancy.vo';

describe('ReconciliationResult Value Object', () => {
  describe('constructor', () => {
    it('一致の場合正常に作成できる', () => {
      const result = new ReconciliationResult(
        true,
        100,
        'bank-tx-001',
        'card-summary-001',
        new Date('2025-01-30'),
        null,
      );

      expect(result.isMatched).toBe(true);
      expect(result.confidence).toBe(100);
      expect(result.bankTransactionId).toBe('bank-tx-001');
      expect(result.cardSummaryId).toBe('card-summary-001');
      expect(result.matchedAt).toEqual(new Date('2025-01-30'));
      expect(result.discrepancy).toBeNull();
    });

    it('不一致の場合正常に作成できる', () => {
      const discrepancy = new Discrepancy(1000, 2, false, '金額不一致');
      const result = new ReconciliationResult(
        false,
        0,
        null,
        'card-summary-001',
        null,
        discrepancy,
      );

      expect(result.isMatched).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.bankTransactionId).toBeNull();
      expect(result.discrepancy).toEqual(discrepancy);
    });

    it('cardSummaryIdが空の場合エラー', () => {
      expect(() => {
        new ReconciliationResult(
          true,
          100,
          'bank-tx-001',
          '',
          new Date(),
          null,
        );
      }).toThrow('Card summary ID is required');
    });

    it('confidenceが範囲外の場合エラー', () => {
      expect(() => {
        new ReconciliationResult(
          true,
          101,
          'bank-tx-001',
          'card-summary-001',
          new Date(),
          null,
        );
      }).toThrow('Confidence must be between 0 and 100');
    });

    it('一致時にbankTransactionIdがない場合エラー', () => {
      expect(() => {
        new ReconciliationResult(
          true,
          100,
          null,
          'card-summary-001',
          new Date(),
          null,
        );
      }).toThrow('Bank transaction ID is required when matched');
    });

    it('不一致時にdiscrepancyがない場合エラー', () => {
      expect(() => {
        new ReconciliationResult(
          false,
          0,
          null,
          'card-summary-001',
          null,
          null,
        );
      }).toThrow('Discrepancy is required when not matched');
    });
  });

  describe('calculateConfidence', () => {
    it('完全一致の場合100を返す', () => {
      const confidence = ReconciliationResult.calculateConfidence(
        true,
        true,
        true,
      );
      expect(confidence).toBe(100);
    });

    it('部分一致（金額・日付のみ）の場合70を返す', () => {
      const confidence = ReconciliationResult.calculateConfidence(
        true,
        true,
        false,
      );
      expect(confidence).toBe(70);
    });

    it('不一致の場合0を返す', () => {
      const confidence = ReconciliationResult.calculateConfidence(
        false,
        false,
        false,
      );
      expect(confidence).toBe(0);
    });
  });

  describe('toPlain', () => {
    it('プレーンオブジェクトに変換できる', () => {
      const result = new ReconciliationResult(
        true,
        100,
        'bank-tx-001',
        'card-summary-001',
        new Date('2025-01-30'),
        null,
      );
      const plain = result.toPlain();

      expect(plain.isMatched).toBe(true);
      expect(plain.confidence).toBe(100);
      expect(plain.bankTransactionId).toBe('bank-tx-001');
      expect(plain.cardSummaryId).toBe('card-summary-001');
    });
  });
});
