import { MonthlyCardSummary } from './monthly-card-summary.entity';
import { PaymentStatus } from '../enums/payment-status.enum';
import { CategoryAmount } from '../value-objects/category-amount.vo';

describe('MonthlyCardSummary Entity', () => {
  const mockCategoryBreakdown = [
    new CategoryAmount('食費', 30000, 10),
    new CategoryAmount('交通費', 20000, 5),
  ];

  const createMockSummary = (
    overrides?: Partial<{
      id: string;
      cardId: string;
      cardName: string;
      billingMonth: string;
      closingDate: Date;
      paymentDate: Date;
      totalAmount: number;
      transactionCount: number;
      categoryBreakdown: CategoryAmount[];
      transactionIds: string[];
      netPaymentAmount: number;
      status: PaymentStatus;
      createdAt: Date;
      updatedAt: Date;
    }>,
  ) => {
    const defaults = {
      id: 'summary-123',
      cardId: 'card-456',
      cardName: '楽天カード',
      billingMonth: '2025-01',
      closingDate: new Date('2025-01-31'),
      paymentDate: new Date('2025-02-27'),
      totalAmount: 50000,
      transactionCount: 15,
      categoryBreakdown: mockCategoryBreakdown,
      transactionIds: ['tx-001', 'tx-002', 'tx-003'],
      netPaymentAmount: 50000,
      status: PaymentStatus.PENDING,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      ...overrides,
    };

    return new MonthlyCardSummary(
      defaults.id,
      defaults.cardId,
      defaults.cardName,
      defaults.billingMonth,
      defaults.closingDate,
      defaults.paymentDate,
      defaults.totalAmount,
      defaults.transactionCount,
      defaults.categoryBreakdown,
      defaults.transactionIds,
      defaults.netPaymentAmount,
      defaults.status,
      defaults.createdAt,
      defaults.updatedAt,
    );
  };

  describe('constructor', () => {
    it('正常に作成できる', () => {
      const summary = createMockSummary();

      expect(summary).toBeInstanceOf(MonthlyCardSummary);
      expect(summary.id).toBe('summary-123');
      expect(summary.cardId).toBe('card-456');
      expect(summary.billingMonth).toBe('2025-01');
    });

    it('IDが空の場合エラー', () => {
      expect(() => createMockSummary({ id: '' })).toThrow('ID is required');
    });

    it('cardIdが空の場合エラー', () => {
      expect(() => createMockSummary({ cardId: '' })).toThrow(
        'Card ID is required',
      );
    });

    it('cardNameが空の場合エラー', () => {
      expect(() => createMockSummary({ cardName: '' })).toThrow(
        'Card name is required',
      );
    });

    it('billingMonthが不正な形式の場合エラー', () => {
      expect(() => createMockSummary({ billingMonth: '2025-13' })).toThrow(
        'Billing month must be in YYYY-MM format',
      );
      expect(() => createMockSummary({ billingMonth: '2025/01' })).toThrow(
        'Billing month must be in YYYY-MM format',
      );
    });

    it('totalAmountが負の場合エラー', () => {
      expect(() => createMockSummary({ totalAmount: -1000 })).toThrow(
        'Total amount must be non-negative',
      );
    });

    it('totalAmountが整数でない場合エラー', () => {
      expect(() => createMockSummary({ totalAmount: 1000.5 })).toThrow(
        'Total amount must be an integer (yen unit)',
      );
    });

    it('transactionCountが負の場合エラー', () => {
      expect(() => createMockSummary({ transactionCount: -1 })).toThrow(
        'Transaction count must be non-negative',
      );
    });
  });

  describe('calculateNetPayment', () => {
    it('FR-012ではtotalAmountと同額を返す（割引未実装）', () => {
      const summary = createMockSummary({ totalAmount: 50000 });

      const netPayment = summary.calculateNetPayment();

      expect(netPayment).toBe(50000);
    });

    it('異なる金額でも正しく返す', () => {
      const summary = createMockSummary({ totalAmount: 100000 });

      const netPayment = summary.calculateNetPayment();

      expect(netPayment).toBe(100000);
    });
  });

  describe('toPlain', () => {
    it('プレーンオブジェクトに変換できる', () => {
      const summary = createMockSummary();

      const plain = summary.toPlain();

      expect(plain).toHaveProperty('id', 'summary-123');
      expect(plain).toHaveProperty('cardId', 'card-456');
      expect(plain).toHaveProperty('cardName', '楽天カード');
      expect(plain).toHaveProperty('billingMonth', '2025-01');
      expect(plain).toHaveProperty('totalAmount', 50000);
      expect(plain).toHaveProperty('transactionCount', 15);
      expect(plain).toHaveProperty('status', PaymentStatus.PENDING);
      expect(plain.categoryBreakdown).toHaveLength(2);
      expect(plain.transactionIds).toHaveLength(3);
    });

    it('categoryBreakdownがプレーンオブジェクト配列に変換される', () => {
      const summary = createMockSummary();

      const plain = summary.toPlain();

      expect(plain.categoryBreakdown[0]).toEqual({
        category: '食費',
        amount: 30000,
        count: 10,
      });
      expect(plain.categoryBreakdown[1]).toEqual({
        category: '交通費',
        amount: 20000,
        count: 5,
      });
    });

    it('transactionIdsが新しい配列として複製される', () => {
      const summary = createMockSummary();

      const plain = summary.toPlain();

      expect(plain.transactionIds).not.toBe(summary.transactionIds);
      expect(plain.transactionIds).toEqual(summary.transactionIds);
    });
  });

  describe('fromPlain', () => {
    it('プレーンオブジェクトから生成できる', () => {
      const plain = {
        id: 'summary-456',
        cardId: 'card-789',
        cardName: '三井住友カード',
        billingMonth: '2025-02',
        closingDate: new Date('2025-02-28'),
        paymentDate: new Date('2025-03-27'),
        totalAmount: 60000,
        transactionCount: 20,
        categoryBreakdown: [
          { category: '食費', amount: 40000, count: 15 },
          { category: '交通費', amount: 20000, count: 5 },
        ],
        transactionIds: ['tx-004', 'tx-005'],
        netPaymentAmount: 60000,
        status: PaymentStatus.PAID,
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01'),
      };

      const summary = MonthlyCardSummary.fromPlain(plain);

      expect(summary).toBeInstanceOf(MonthlyCardSummary);
      expect(summary.id).toBe('summary-456');
      expect(summary.cardId).toBe('card-789');
      expect(summary.billingMonth).toBe('2025-02');
      expect(summary.totalAmount).toBe(60000);
      expect(summary.categoryBreakdown[0]).toBeInstanceOf(CategoryAmount);
    });

    it('バリデーションが動作する', () => {
      const invalidPlain = {
        id: '',
        cardId: 'card-789',
        cardName: '三井住友カード',
        billingMonth: '2025-02',
        closingDate: new Date('2025-02-28'),
        paymentDate: new Date('2025-03-27'),
        totalAmount: 60000,
        transactionCount: 20,
        categoryBreakdown: [],
        transactionIds: [],
        netPaymentAmount: 60000,
        status: PaymentStatus.PAID,
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01'),
      };

      expect(() => MonthlyCardSummary.fromPlain(invalidPlain)).toThrow(
        'ID is required',
      );
    });
  });
});
