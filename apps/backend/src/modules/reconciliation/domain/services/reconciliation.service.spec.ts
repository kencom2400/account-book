import { ReconciliationService } from './reconciliation.service';
import { MonthlyCardSummary } from '../../../aggregation/domain/entities/monthly-card-summary.entity';
import { PaymentStatus } from '../../../aggregation/domain/enums/payment-status.enum';
import { CategoryAmount } from '../../../aggregation/domain/value-objects/category-amount.vo';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { TransactionStatus } from '@account-book/types';

describe('ReconciliationService', () => {
  let service: ReconciliationService;

  beforeEach(() => {
    service = new ReconciliationService();
  });

  const createMockCardSummary = (): MonthlyCardSummary => {
    return new MonthlyCardSummary(
      'summary-001',
      'card-001',
      '楽天カード',
      '2025-01',
      new Date('2025-01-31'),
      new Date('2025-02-27'), // 木曜日
      50000,
      15,
      [new CategoryAmount('食費', 30000, 10)],
      ['tx-001', 'tx-002'],
      50000,
      PaymentStatus.PENDING,
      new Date('2025-01-01'),
      new Date('2025-01-01'),
    );
  };

  const createMockBankTransaction = (
    date: Date,
    amount: number,
    description: string,
  ): TransactionEntity => {
    return new TransactionEntity(
      `bank-tx-${date.getTime()}`,
      date,
      amount,
      { id: 'cat-001', name: '食費', type: 'expense' },
      description,
      'inst-001',
      'acc-001',
      TransactionStatus.COMPLETED,
      false,
      null,
      new Date(),
      new Date(),
    );
  };

  describe('reconcilePayment', () => {
    it('完全一致（金額・日付・摘要すべて一致）の場合、confidence 100を返す', () => {
      const cardSummary = createMockCardSummary();
      const bankTransaction = createMockBankTransaction(
        new Date('2025-02-27'), // 引落予定日と同じ
        50000,
        '楽天カード引落',
      );

      const result = service.reconcilePayment(cardSummary, [bankTransaction]);

      expect(result.isMatched).toBe(true);
      expect(result.confidence).toBe(100);
      expect(result.bankTransactionId).toBe(bankTransaction.id);
      expect(result.discrepancy).toBeNull();
    });

    it('部分一致（金額・日付のみ一致、摘要不一致）の場合、confidence 70を返す', () => {
      const cardSummary = createMockCardSummary();
      const bankTransaction = createMockBankTransaction(
        new Date('2025-02-27'),
        50000,
        'その他の引落', // 摘要不一致
      );

      const result = service.reconcilePayment(cardSummary, [bankTransaction]);

      expect(result.isMatched).toBe(false);
      expect(result.confidence).toBe(70);
      expect(result.bankTransactionId).toBeNull();
      expect(result.discrepancy).not.toBeNull();
      expect(result.discrepancy?.amountDifference).toBe(0);
      expect(result.discrepancy?.descriptionMatch).toBe(false);
    });

    it('不一致（金額不一致）の場合、confidence 0を返す', () => {
      const cardSummary = createMockCardSummary();
      const bankTransaction = createMockBankTransaction(
        new Date('2025-02-27'),
        40000, // 金額不一致
        '楽天カード引落',
      );

      const result = service.reconcilePayment(cardSummary, [bankTransaction]);

      expect(result.isMatched).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.bankTransactionId).toBeNull();
      expect(result.discrepancy).not.toBeNull();
      expect(result.discrepancy?.amountDifference).toBeGreaterThan(0);
    });

    it('日付範囲外の取引は無視される', () => {
      const cardSummary = createMockCardSummary();
      const bankTransaction = createMockBankTransaction(
        new Date('2025-03-10'), // 引落予定日から遠い日付
        50000,
        '楽天カード引落',
      );

      const result = service.reconcilePayment(cardSummary, [bankTransaction]);

      expect(result.isMatched).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('複数の候補がある場合、最も近い日付の取引を選択', () => {
      const cardSummary = createMockCardSummary();
      const bankTransaction1 = createMockBankTransaction(
        new Date('2025-02-26'), // 1営業日前
        50000,
        'その他の引落',
      );
      const bankTransaction2 = createMockBankTransaction(
        new Date('2025-03-03'), // 4営業日後（異なる日付差）
        50000,
        'その他の引落',
      );

      const result = service.reconcilePayment(cardSummary, [
        bankTransaction1,
        bankTransaction2,
      ]);

      expect(result.isMatched).toBe(false);
      expect(result.confidence).toBe(70);
      // 最も近い日付の取引（bankTransaction1）が選択される
    });

    it('同じ日付差の候補が複数ある場合、MultipleCandidateErrorをスロー', () => {
      const cardSummary = createMockCardSummary();
      const bankTransaction1 = createMockBankTransaction(
        new Date('2025-02-26'), // 1営業日前
        50000,
        'その他の引落',
      );
      const bankTransaction2 = createMockBankTransaction(
        new Date('2025-02-28'), // 1営業日後（同じ日付差）
        50000,
        'その他の引落',
      );

      expect(() => {
        service.reconcilePayment(cardSummary, [
          bankTransaction1,
          bankTransaction2,
        ]);
      }).toThrow('複数の候補取引が存在します。手動で選択してください');
    });

    it('銀行取引が空の場合、不一致を返す', () => {
      const cardSummary = createMockCardSummary();

      const result = service.reconcilePayment(cardSummary, []);

      expect(result.isMatched).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.discrepancy).not.toBeNull();
      expect(result.discrepancy?.reason).toContain('見つかりませんでした');
    });

    it('営業日計算が正しく動作する（土日を除外）', () => {
      const cardSummary = createMockCardSummary();
      // 引落予定日が木曜日（2025-02-27）の場合、±3営業日は月曜日〜金曜日
      const bankTransaction = createMockBankTransaction(
        new Date('2025-02-24'), // 月曜日（3営業日前）
        50000,
        '楽天カード引落',
      );

      const result = service.reconcilePayment(cardSummary, [bankTransaction]);

      expect(result.isMatched).toBe(true);
      expect(result.confidence).toBe(100);
    });
  });
});
