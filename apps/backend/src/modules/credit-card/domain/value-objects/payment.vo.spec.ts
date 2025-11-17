import { PaymentStatus } from '@account-book/types';
import { PaymentVO } from './payment.vo';
import { createTestPayment } from '../../../../../test/helpers/credit-card.factory';

describe('PaymentVO', () => {
  describe('constructor', () => {
    it('should create a valid payment value object', () => {
      const payment = createTestPayment();

      expect(payment.billingMonth).toBe('2025-01');
      expect(payment.totalAmount).toBe(125000);
      expect(payment.paidAmount).toBe(0);
      expect(payment.remainingAmount).toBe(125000);
      expect(payment.status).toBe(PaymentStatus.UNPAID);
    });

    it('should throw error when billing month format is invalid', () => {
      expect(() => {
        new PaymentVO(
          '2025/01', // 無効な形式
          new Date(),
          new Date(),
          100000,
          0,
          100000,
          PaymentStatus.UNPAID,
        );
      }).toThrow('Billing month must be in YYYY-MM format');
    });

    it('should throw error when total amount is negative', () => {
      expect(() => {
        new PaymentVO(
          '2025-01',
          new Date(),
          new Date(),
          -100000, // 負の値
          0,
          0,
          PaymentStatus.UNPAID,
        );
      }).toThrow('Total amount must be non-negative');
    });

    it('should throw error when paid + remaining does not equal total', () => {
      expect(() => {
        new PaymentVO(
          '2025-01',
          new Date(),
          new Date(),
          100000,
          30000,
          60000, // 30000 + 60000 != 100000
          PaymentStatus.UNPAID,
        );
      }).toThrow('Paid amount + remaining amount must equal total amount');
    });
  });

  describe('isPaid', () => {
    it('should return true when status is PAID', () => {
      const payment = createTestPayment({
        totalAmount: 100000,
        paidAmount: 100000,
        remainingAmount: 0,
        status: PaymentStatus.PAID,
      });

      expect(payment.isPaid()).toBe(true);
    });

    it('should return false when status is UNPAID', () => {
      const payment = createTestPayment({
        status: PaymentStatus.UNPAID,
      });

      expect(payment.isPaid()).toBe(false);
    });
  });

  describe('isOverdue', () => {
    it('should return true when payment is overdue', () => {
      const pastDate = new Date('2020-01-01');
      const payment = createTestPayment({
        status: PaymentStatus.UNPAID,
        paymentDueDate: pastDate,
      });

      expect(payment.isOverdue()).toBe(true);
    });

    it('should return false when payment is not overdue', () => {
      const futureDate = new Date('2030-12-31');
      const payment = createTestPayment({
        status: PaymentStatus.UNPAID,
        paymentDueDate: futureDate,
      });

      expect(payment.isOverdue()).toBe(false);
    });

    it('should return false when payment is already paid', () => {
      const pastDate = new Date('2020-01-01');
      const payment = createTestPayment({
        status: PaymentStatus.PAID,
        paymentDueDate: pastDate,
        paidAmount: 100000,
        remainingAmount: 0,
      });

      expect(payment.isOverdue()).toBe(false);
    });
  });

  describe('isPartiallyPaid', () => {
    it('should return true when partially paid', () => {
      const payment = createTestPayment({
        totalAmount: 100000,
        paidAmount: 30000,
        remainingAmount: 70000,
      });

      expect(payment.isPartiallyPaid()).toBe(true);
    });

    it('should return false when not paid at all', () => {
      const payment = createTestPayment({
        totalAmount: 100000,
        paidAmount: 0,
        remainingAmount: 100000,
      });

      expect(payment.isPartiallyPaid()).toBe(false);
    });

    it('should return false when fully paid', () => {
      const payment = createTestPayment({
        totalAmount: 100000,
        paidAmount: 100000,
        remainingAmount: 0,
      });

      expect(payment.isPartiallyPaid()).toBe(false);
    });
  });

  describe('getPaymentProgress', () => {
    it('should calculate payment progress correctly', () => {
      const payment = createTestPayment({
        totalAmount: 100000,
        paidAmount: 25000,
        remainingAmount: 75000,
      });

      expect(payment.getPaymentProgress()).toBe(25);
    });

    it('should return 0 when total amount is 0', () => {
      const payment = createTestPayment({
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
      });

      expect(payment.getPaymentProgress()).toBe(0);
    });

    it('should return 100 when fully paid', () => {
      const payment = createTestPayment({
        totalAmount: 100000,
        paidAmount: 100000,
        remainingAmount: 0,
      });

      expect(payment.getPaymentProgress()).toBe(100);
    });
  });

  describe('markAsPaid', () => {
    it('should mark payment as paid with paid date', () => {
      const payment = createTestPayment({
        totalAmount: 100000,
        paidAmount: 0,
        remainingAmount: 100000,
        status: PaymentStatus.UNPAID,
      });

      const paidDate = new Date('2025-02-10');
      const updated = payment.markAsPaid(paidDate);

      expect(payment.isPaid()).toBe(false);
      expect(payment.paidDate).toBeNull();
      expect(updated.isPaid()).toBe(true);
      expect(updated.paidAmount).toBe(100000);
      expect(updated.remainingAmount).toBe(0);
      expect(updated.paymentDueDate).toEqual(payment.paymentDueDate);
      expect(updated.paidDate).toEqual(paidDate);
    });
  });

  describe('recordPartialPayment', () => {
    it('should record partial payment correctly', () => {
      const payment = createTestPayment({
        totalAmount: 100000,
        paidAmount: 0,
        remainingAmount: 100000,
        status: PaymentStatus.UNPAID,
      });

      const updated = payment.recordPartialPayment(30000);

      expect(updated.paidAmount).toBe(30000);
      expect(updated.remainingAmount).toBe(70000);
      expect(updated.status).toBe(PaymentStatus.UNPAID);
    });

    it('should change status to PAID when fully paid through partial payment', () => {
      const payment = createTestPayment({
        totalAmount: 100000,
        paidAmount: 70000,
        remainingAmount: 30000,
        status: PaymentStatus.UNPAID,
      });

      const updated = payment.recordPartialPayment(30000);

      expect(updated.paidAmount).toBe(100000);
      expect(updated.remainingAmount).toBe(0);
      expect(updated.status).toBe(PaymentStatus.PAID);
    });

    it('should throw error when payment amount is zero or negative', () => {
      const payment = createTestPayment();

      expect(() => {
        payment.recordPartialPayment(0);
      }).toThrow('Payment amount must be positive');

      expect(() => {
        payment.recordPartialPayment(-1000);
      }).toThrow('Payment amount must be positive');
    });

    it('should throw error when payment amount exceeds remaining amount', () => {
      const payment = createTestPayment({
        totalAmount: 100000,
        paidAmount: 70000,
        remainingAmount: 30000,
      });

      expect(() => {
        payment.recordPartialPayment(40000);
      }).toThrow('Payment amount cannot exceed remaining amount');
    });
  });

  describe('equals', () => {
    it('should return true for equal payments', () => {
      const payment1 = createTestPayment();
      const payment2 = createTestPayment();

      expect(payment1.equals(payment2)).toBe(true);
    });

    it('should return false for different payments', () => {
      const payment1 = createTestPayment();
      const payment2 = createTestPayment({
        totalAmount: 200000,
        remainingAmount: 200000,
      });

      expect(payment1.equals(payment2)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON correctly', () => {
      const payment = createTestPayment({
        totalAmount: 100000,
        paidAmount: 25000,
        remainingAmount: 75000,
      });

      const json = payment.toJSON();

      expect(json.billingMonth).toBe(payment.billingMonth);
      expect(json.totalAmount).toBe(payment.totalAmount);
      expect(json.paymentProgress).toBe(25);
      expect(json.isPaid).toBe(false);
      expect(json.isPartiallyPaid).toBe(true);
    });
  });
});
