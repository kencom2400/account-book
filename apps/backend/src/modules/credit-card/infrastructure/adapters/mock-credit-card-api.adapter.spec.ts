import { MockCreditCardAPIAdapter } from './mock-credit-card-api.adapter';

describe('MockCreditCardAPIAdapter', () => {
  let adapter: MockCreditCardAPIAdapter;

  beforeEach(() => {
    adapter = new MockCreditCardAPIAdapter();
  });

  describe('testConnection', () => {
    it('should return success for valid credentials', async () => {
      const credentials = {
        username: 'test_user',
        password: 'test_password',
      };

      const result = await adapter.testConnection(credentials);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid credentials', async () => {
      const credentials = {
        username: '',
        password: '',
      };

      const result = await adapter.testConnection(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('getCardInfo', () => {
    it('should return mock card information', async () => {
      const cardInfo = await adapter.getCardInfo();

      expect(cardInfo).toBeDefined();
      expect(cardInfo.cardNumber).toBe('1234');
      expect(cardInfo.creditLimit).toBe(500000);
      expect(cardInfo.currentBalance).toBe(125000);
      expect(cardInfo.availableCredit).toBe(375000);
    });
  });

  describe('getTransactions', () => {
    it('should return mock transactions', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const transactions = await adapter.getTransactions(
        {},
        startDate,
        endDate,
      );

      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeGreaterThan(0);

      const tx = transactions[0];
      expect(tx.id).toBeDefined();
      expect(tx.date).toBeInstanceOf(Date);
      expect(tx.postingDate).toBeInstanceOf(Date);
      expect(tx.amount).toBeGreaterThan(0);
      expect(tx.merchantName).toBeDefined();
      expect(tx.merchantCategory).toBeDefined();
    });

    it('should generate transactions within date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const transactions = await adapter.getTransactions(
        {},
        startDate,
        endDate,
      );

      transactions.forEach((tx) => {
        expect(tx.date.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(tx.date.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });
  });

  describe('getPaymentInfo', () => {
    it('should return mock payment information', async () => {
      const paymentInfo = await adapter.getPaymentInfo();

      expect(paymentInfo).toBeDefined();
      expect(paymentInfo.billingMonth).toMatch(/^\d{4}-\d{2}$/);
      expect(paymentInfo.closingDate).toBeInstanceOf(Date);
      expect(paymentInfo.paymentDueDate).toBeInstanceOf(Date);
      expect(paymentInfo.totalAmount).toBe(125000);
      expect(paymentInfo.paidAmount).toBe(0);
      expect(paymentInfo.status).toBe('unpaid');
    });
  });

  describe('mapToTransactionEntity', () => {
    it('should map API transaction to entity correctly', () => {
      const creditCardId = 'cc_test_123';
      const apiTransaction = {
        id: 'tx_123',
        date: new Date('2025-01-15'),
        postingDate: new Date('2025-01-16'),
        amount: 5000,
        merchantName: 'テストストア',
        merchantCategory: 'スーパー',
        description: 'カード利用',
        isInstallment: false,
      };

      const entity = adapter.mapToTransactionEntity(
        creditCardId,
        apiTransaction,
      );

      expect(entity.id).toBe('tx_123');
      expect(entity.creditCardId).toBe(creditCardId);
      expect(entity.transactionDate).toEqual(apiTransaction.date);
      expect(entity.amount).toBe(5000);
      expect(entity.merchantName).toBe('テストストア');
      expect(entity.isInstallment).toBe(false);
      expect(entity.isPaid).toBe(false);
    });

    it('should map installment transaction correctly', () => {
      const apiTransaction = {
        id: 'tx_123',
        date: new Date(),
        postingDate: new Date(),
        amount: 60000,
        merchantName: 'テストストア',
        merchantCategory: 'スーパー',
        description: 'カード利用',
        isInstallment: true,
        installmentCount: 12,
        installmentNumber: 1,
      };

      const entity = adapter.mapToTransactionEntity('cc_123', apiTransaction);

      expect(entity.isInstallment).toBe(true);
      expect(entity.installmentCount).toBe(12);
      expect(entity.installmentNumber).toBe(1);
    });
  });

  describe('mapToPaymentVO', () => {
    it('should map API payment info to value object correctly', () => {
      const billingMonth = '2025-01';
      const apiPaymentInfo = {
        billingMonth,
        closingDate: new Date('2025-01-15'),
        paymentDueDate: new Date('2025-02-10'),
        totalAmount: 125000,
        paidAmount: 0,
        status: 'unpaid',
      };

      const vo = adapter.mapToPaymentVO(billingMonth, apiPaymentInfo);

      expect(vo.billingMonth).toBe(billingMonth);
      expect(vo.closingDate).toEqual(apiPaymentInfo.closingDate);
      expect(vo.totalAmount).toBe(125000);
      expect(vo.paidAmount).toBe(0);
      expect(vo.remainingAmount).toBe(125000);
    });
  });
});
