import { CreditCardTransactionEntity } from './credit-card-transaction.entity';
import { createTestCreditCardTransaction } from '../../../../../test/helpers/credit-card.factory';
import { CategoryType } from '@account-book/types';

describe('CreditCardTransactionEntity', () => {
  describe('constructor', () => {
    it('should create a valid transaction entity', () => {
      const transaction = createTestCreditCardTransaction();

      expect(transaction.id).toBe('tx_test_123');
      expect(transaction.creditCardId).toBe('cc_test_123');
      expect(transaction.amount).toBe(5000);
      expect(transaction.merchantName).toBe('テストストア');
      expect(transaction.isInstallment).toBe(false);
      expect(transaction.isPaid).toBe(false);
    });

    it('should throw error when ID is missing', () => {
      expect(() => {
        new CreditCardTransactionEntity(
          '',
          'cc_123',
          new Date(),
          new Date(),
          5000,
          'ストア名',
          'カテゴリ',
          '説明',
          CategoryType.EXPENSE,
          false,
          null,
          null,
          false,
          null,
          null,
          new Date(),
          new Date(),
        );
      }).toThrow('Transaction ID is required');
    });

    it('should throw error when amount is zero or negative', () => {
      expect(() => {
        new CreditCardTransactionEntity(
          'tx_123',
          'cc_123',
          new Date(),
          new Date(),
          0, // 無効
          'ストア名',
          'カテゴリ',
          '説明',
          CategoryType.EXPENSE,
          false,
          null,
          null,
          false,
          null,
          null,
          new Date(),
          new Date(),
        );
      }).toThrow('Amount must be positive');
    });

    it('should throw error when installment count is less than 2', () => {
      expect(() => {
        new CreditCardTransactionEntity(
          'tx_123',
          'cc_123',
          new Date(),
          new Date(),
          5000,
          'ストア名',
          'カテゴリ',
          '説明',
          CategoryType.EXPENSE,
          true, // 分割払い
          1, // 無効（2回以上必要）
          1,
          false,
          null,
          null,
          new Date(),
          new Date(),
        );
      }).toThrow('Installment count must be at least 2');
    });

    it('should throw error when installment number exceeds count', () => {
      expect(() => {
        new CreditCardTransactionEntity(
          'tx_123',
          'cc_123',
          new Date(),
          new Date(),
          5000,
          'ストア名',
          'カテゴリ',
          '説明',
          CategoryType.EXPENSE,
          true,
          12,
          13, // 無効（12回払いで13回目は存在しない）
          false,
          null,
          null,
          new Date(),
          new Date(),
        );
      }).toThrow('Installment number cannot exceed installment count');
    });

    it('should throw error when paid but no paid date', () => {
      expect(() => {
        new CreditCardTransactionEntity(
          'tx_123',
          'cc_123',
          new Date(),
          new Date(),
          5000,
          'ストア名',
          'カテゴリ',
          '説明',
          CategoryType.EXPENSE,
          false,
          null,
          null,
          true, // 支払済み
          null,
          null, // 支払日がない
          new Date(),
          new Date(),
        );
      }).toThrow('Paid date is required when transaction is paid');
    });
  });

  describe('isOneTimePayment', () => {
    it('should return true for one-time payment', () => {
      const transaction = createTestCreditCardTransaction({
        isInstallment: false,
      });

      expect(transaction.isOneTimePayment()).toBe(true);
    });

    it('should return false for installment payment', () => {
      const transaction = createTestCreditCardTransaction({
        isInstallment: true,
        installmentCount: 12,
        installmentNumber: 1,
      });

      expect(transaction.isOneTimePayment()).toBe(false);
    });
  });

  describe('getMonthlyInstallmentAmount', () => {
    it('should return full amount for one-time payment', () => {
      const transaction = createTestCreditCardTransaction({
        amount: 60000,
        isInstallment: false,
      });

      expect(transaction.getMonthlyInstallmentAmount()).toBe(60000);
    });

    it('should calculate monthly installment amount correctly', () => {
      const transaction = createTestCreditCardTransaction({
        amount: 60000,
        isInstallment: true,
        installmentCount: 12,
        installmentNumber: 1,
      });

      expect(transaction.getMonthlyInstallmentAmount()).toBe(5000);
    });
  });

  describe('isScheduledForPayment', () => {
    it('should return true when scheduled for payment', () => {
      const transaction = createTestCreditCardTransaction({
        isPaid: false,
        paymentScheduledDate: new Date('2025-02-10'),
      });

      expect(transaction.isScheduledForPayment()).toBe(true);
    });

    it('should return false when already paid', () => {
      const transaction = createTestCreditCardTransaction({
        isPaid: true,
        paymentScheduledDate: new Date('2025-02-10'),
        paidDate: new Date('2025-02-10'),
      });

      expect(transaction.isScheduledForPayment()).toBe(false);
    });
  });

  describe('markAsPaid', () => {
    it('should mark transaction as paid', () => {
      const transaction = createTestCreditCardTransaction({
        isPaid: false,
      });

      const paidDate = new Date('2025-02-10');
      const updated = transaction.markAsPaid(paidDate);

      expect(transaction.isPaid).toBe(false);
      expect(updated.isPaid).toBe(true);
      expect(updated.paidDate).toEqual(paidDate);
    });
  });

  describe('setPaymentScheduledDate', () => {
    it('should set payment scheduled date', () => {
      const transaction = createTestCreditCardTransaction();
      const scheduledDate = new Date('2025-02-10');

      const updated = transaction.setPaymentScheduledDate(scheduledDate);

      expect(updated.paymentScheduledDate).toEqual(scheduledDate);
    });
  });

  describe('updateCategory', () => {
    it('should update transaction category', () => {
      const transaction = createTestCreditCardTransaction({
        category: CategoryType.EXPENSE,
      });

      const updated = transaction.updateCategory(CategoryType.INCOME);

      expect(transaction.category).toBe(CategoryType.EXPENSE);
      expect(updated.category).toBe(CategoryType.INCOME);
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON correctly', () => {
      const transaction = createTestCreditCardTransaction({
        amount: 60000,
        isInstallment: true,
        installmentCount: 12,
        installmentNumber: 1,
      });

      const json = transaction.toJSON();

      expect(json.id).toBe(transaction.id);
      expect(json.amount).toBe(transaction.amount);
      expect(json.monthlyInstallmentAmount).toBe(5000);
      expect(json.isInstallment).toBe(true);
    });
  });
});
