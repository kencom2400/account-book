import { AlertDetails } from './alert-details.vo';

describe('AlertDetails Value Object', () => {
  const createMockAlertDetails = (
    overrides?: Partial<{
      cardId: string;
      cardName: string;
      billingMonth: string;
      expectedAmount: number;
      actualAmount: number | null;
      discrepancy: number | null;
      paymentDate: Date | null;
      daysElapsed: number | null;
      relatedTransactions: string[];
      reconciliationId: string | null;
    }>,
  ): AlertDetails => {
    const defaults = {
      cardId: 'card-001',
      cardName: '三井住友カード',
      billingMonth: '2025-01',
      expectedAmount: 50000,
      actualAmount: null,
      discrepancy: null,
      paymentDate: null,
      daysElapsed: null,
      relatedTransactions: [],
      reconciliationId: null,
      ...overrides,
    };

    return new AlertDetails(
      defaults.cardId,
      defaults.cardName,
      defaults.billingMonth,
      defaults.expectedAmount,
      defaults.actualAmount,
      defaults.discrepancy,
      defaults.paymentDate,
      defaults.daysElapsed,
      defaults.relatedTransactions,
      defaults.reconciliationId,
    );
  };

  describe('constructor', () => {
    it('正常に作成できる', () => {
      const details = createMockAlertDetails();

      expect(details.cardId).toBe('card-001');
      expect(details.cardName).toBe('三井住友カード');
      expect(details.billingMonth).toBe('2025-01');
      expect(details.expectedAmount).toBe(50000);
    });

    it('必須フィールドが欠けている場合エラー', () => {
      expect(() => {
        new AlertDetails(
          '',
          'カード名',
          '2025-01',
          50000,
          null,
          null,
          null,
          null,
          [],
          null,
        );
      }).toThrow('Card ID is required');

      expect(() => {
        new AlertDetails(
          'card-001',
          '',
          '2025-01',
          50000,
          null,
          null,
          null,
          null,
          [],
          null,
        );
      }).toThrow('Card name is required');

      expect(() => {
        new AlertDetails(
          'card-001',
          'カード名',
          '',
          50000,
          null,
          null,
          null,
          null,
          [],
          null,
        );
      }).toThrow('Billing month is required');
    });

    it('請求月の形式が不正な場合エラー', () => {
      expect(() => {
        new AlertDetails(
          'card-001',
          'カード名',
          '2025-13', // 無効な月
          50000,
          null,
          null,
          null,
          null,
          [],
          null,
        );
      }).toThrow('Billing month must be in YYYY-MM format');

      expect(() => {
        new AlertDetails(
          'card-001',
          'カード名',
          '25-01', // 無効な形式
          50000,
          null,
          null,
          null,
          null,
          [],
          null,
        );
      }).toThrow('Billing month must be in YYYY-MM format');
    });

    it('金額が負の値の場合エラー', () => {
      expect(() => {
        new AlertDetails(
          'card-001',
          'カード名',
          '2025-01',
          -1000, // 負の値
          null,
          null,
          null,
          null,
          [],
          null,
        );
      }).toThrow('Expected amount must be non-negative');

      expect(() => {
        new AlertDetails(
          'card-001',
          'カード名',
          '2025-01',
          50000,
          -1000, // 負の値
          null,
          null,
          null,
          [],
          null,
        );
      }).toThrow('Actual amount must be non-negative');
    });

    it('経過日数が負の値の場合エラー', () => {
      expect(() => {
        new AlertDetails(
          'card-001',
          'カード名',
          '2025-01',
          50000,
          null,
          null,
          null,
          -1, // 負の値
          [],
          null,
        );
      }).toThrow('Days elapsed must be non-negative');
    });

    it('関連取引が配列でない場合エラー', () => {
      expect(() => {
        new AlertDetails(
          'card-001',
          'カード名',
          '2025-01',
          50000,
          null,
          null,
          null,
          null,
          'not-an-array' as unknown as string[],
          null,
        );
      }).toThrow('Related transactions must be an array');
    });
  });

  describe('toPlain', () => {
    it('プレーンオブジェクトに変換できる', () => {
      const details = createMockAlertDetails({
        actualAmount: 48000,
        discrepancy: -2000,
        paymentDate: new Date('2025-02-27'),
        daysElapsed: 3,
        relatedTransactions: ['tx-001', 'tx-002'],
        reconciliationId: 'reconciliation-001',
      });

      const plain = details.toPlain();

      expect(plain.cardId).toBe(details.cardId);
      expect(plain.cardName).toBe(details.cardName);
      expect(plain.billingMonth).toBe(details.billingMonth);
      expect(plain.expectedAmount).toBe(details.expectedAmount);
      expect(plain.actualAmount).toBe(48000);
      expect(plain.discrepancy).toBe(-2000);
      expect(plain.paymentDate).toEqual(new Date('2025-02-27'));
      expect(plain.daysElapsed).toBe(3);
      expect(plain.relatedTransactions).toEqual(['tx-001', 'tx-002']);
      expect(plain.reconciliationId).toBe('reconciliation-001');
    });
  });

  describe('fromPlain', () => {
    it('プレーンオブジェクトから復元できる', () => {
      const details = createMockAlertDetails({
        actualAmount: 48000,
        discrepancy: -2000,
        paymentDate: new Date('2025-02-27'),
        daysElapsed: 3,
        relatedTransactions: ['tx-001'],
        reconciliationId: 'reconciliation-001',
      });

      const plain = details.toPlain();
      const restored = AlertDetails.fromPlain(plain);

      expect(restored.cardId).toBe(details.cardId);
      expect(restored.cardName).toBe(details.cardName);
      expect(restored.billingMonth).toBe(details.billingMonth);
      expect(restored.expectedAmount).toBe(details.expectedAmount);
      expect(restored.actualAmount).toBe(48000);
      expect(restored.discrepancy).toBe(-2000);
      expect(restored.paymentDate).toEqual(new Date('2025-02-27'));
      expect(restored.daysElapsed).toBe(3);
      expect(restored.relatedTransactions).toEqual(['tx-001']);
      expect(restored.reconciliationId).toBe('reconciliation-001');
    });
  });
});
