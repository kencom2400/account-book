import { TransactionDate } from './transaction-date.vo';

describe('TransactionDate', () => {
  describe('constructor', () => {
    it('should create a TransactionDate with valid date', () => {
      const date = new Date('2024-01-15');
      const transactionDate = new TransactionDate(date);

      expect(transactionDate.value).toBe(date);
    });

    it('should throw error when date is null', () => {
      expect(() => new TransactionDate(null as any)).toThrow(
        'Transaction date is required',
      );
    });

    it('should throw error when date is undefined', () => {
      expect(() => new TransactionDate(undefined as any)).toThrow(
        'Transaction date is required',
      );
    });

    it('should throw error when date is invalid', () => {
      const invalidDate = new Date('invalid');

      expect(() => new TransactionDate(invalidDate)).toThrow(
        'Invalid transaction date',
      );
    });

    it('should accept date in the past', () => {
      const pastDate = new Date('2020-01-01');
      const transactionDate = new TransactionDate(pastDate);

      expect(transactionDate.value).toBe(pastDate);
    });

    it('should accept date in the future', () => {
      const futureDate = new Date('2030-01-01');
      const transactionDate = new TransactionDate(futureDate);

      expect(transactionDate.value).toBe(futureDate);
    });
  });

  describe('isFuture', () => {
    it('should return true for future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const transactionDate = new TransactionDate(futureDate);

      expect(transactionDate.isFuture()).toBe(true);
    });

    it('should return false for past date', () => {
      const pastDate = new Date('2020-01-01');
      const transactionDate = new TransactionDate(pastDate);

      expect(transactionDate.isFuture()).toBe(false);
    });
  });

  describe('isPast', () => {
    it('should return true for past date', () => {
      const pastDate = new Date('2020-01-01');
      const transactionDate = new TransactionDate(pastDate);

      expect(transactionDate.isPast()).toBe(true);
    });

    it('should return false for future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const transactionDate = new TransactionDate(futureDate);

      expect(transactionDate.isPast()).toBe(false);
    });
  });

  describe('isToday', () => {
    it('should return true for today date', () => {
      const today = new Date();
      const transactionDate = new TransactionDate(today);

      expect(transactionDate.isToday()).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const transactionDate = new TransactionDate(yesterday);

      expect(transactionDate.isToday()).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const transactionDate = new TransactionDate(tomorrow);

      expect(transactionDate.isToday()).toBe(false);
    });
  });

  describe('isInMonth', () => {
    it('should return true when date is in specified month', () => {
      const date = new Date('2024-03-15');
      const transactionDate = new TransactionDate(date);

      expect(transactionDate.isInMonth(2024, 3)).toBe(true);
    });

    it('should return false when date is in different month', () => {
      const date = new Date('2024-03-15');
      const transactionDate = new TransactionDate(date);

      expect(transactionDate.isInMonth(2024, 4)).toBe(false);
    });

    it('should return false when date is in different year', () => {
      const date = new Date('2024-03-15');
      const transactionDate = new TransactionDate(date);

      expect(transactionDate.isInMonth(2023, 3)).toBe(false);
    });

    it('should return false when both year and month are different', () => {
      const date = new Date('2024-03-15');
      const transactionDate = new TransactionDate(date);

      expect(transactionDate.isInMonth(2023, 4)).toBe(false);
    });
  });

  describe('isInYear', () => {
    it('should return true when date is in specified year', () => {
      const date = new Date('2024-03-15');
      const transactionDate = new TransactionDate(date);

      expect(transactionDate.isInYear(2024)).toBe(true);
    });

    it('should return false when date is in different year', () => {
      const date = new Date('2024-03-15');
      const transactionDate = new TransactionDate(date);

      expect(transactionDate.isInYear(2023)).toBe(false);
    });

    it('should work for dates at the start of the year', () => {
      const date = new Date('2024-01-01');
      const transactionDate = new TransactionDate(date);

      expect(transactionDate.isInYear(2024)).toBe(true);
    });

    it('should work for dates at the end of the year', () => {
      const date = new Date('2024-12-31');
      const transactionDate = new TransactionDate(date);

      expect(transactionDate.isInYear(2024)).toBe(true);
    });
  });

  describe('toDateString', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-03-15');
      const transactionDate = new TransactionDate(date);

      const dateString = transactionDate.toDateString();

      expect(dateString).toBe('2024-03-15');
    });

    it('should pad single-digit month with zero', () => {
      const date = new Date('2024-01-15');
      const transactionDate = new TransactionDate(date);

      const dateString = transactionDate.toDateString();

      expect(dateString).toBe('2024-01-15');
    });

    it('should pad single-digit day with zero', () => {
      const date = new Date('2024-03-05');
      const transactionDate = new TransactionDate(date);

      const dateString = transactionDate.toDateString();

      expect(dateString).toBe('2024-03-05');
    });

    it('should handle last day of month', () => {
      const date = new Date('2024-12-31');
      const transactionDate = new TransactionDate(date);

      const dateString = transactionDate.toDateString();

      expect(dateString).toBe('2024-12-31');
    });
  });

  describe('toMonthString', () => {
    it('should format date as YYYY-MM', () => {
      const date = new Date('2024-03-15');
      const transactionDate = new TransactionDate(date);

      const monthString = transactionDate.toMonthString();

      expect(monthString).toBe('2024-03');
    });

    it('should pad single-digit month with zero', () => {
      const date = new Date('2024-01-15');
      const transactionDate = new TransactionDate(date);

      const monthString = transactionDate.toMonthString();

      expect(monthString).toBe('2024-01');
    });

    it('should not include day in output', () => {
      const date = new Date('2024-03-31');
      const transactionDate = new TransactionDate(date);

      const monthString = transactionDate.toMonthString();

      expect(monthString).toBe('2024-03');
      expect(monthString).not.toContain('31');
    });
  });

  describe('equals', () => {
    it('should return true for same date and time', () => {
      const date1 = new Date('2024-03-15T10:00:00');
      const date2 = new Date('2024-03-15T10:00:00');
      const transactionDate1 = new TransactionDate(date1);
      const transactionDate2 = new TransactionDate(date2);

      expect(transactionDate1.equals(transactionDate2)).toBe(true);
    });

    it('should return false for different dates', () => {
      const date1 = new Date('2024-03-15');
      const date2 = new Date('2024-03-16');
      const transactionDate1 = new TransactionDate(date1);
      const transactionDate2 = new TransactionDate(date2);

      expect(transactionDate1.equals(transactionDate2)).toBe(false);
    });

    it('should return false for same day but different time', () => {
      const date1 = new Date('2024-03-15T10:00:00');
      const date2 = new Date('2024-03-15T11:00:00');
      const transactionDate1 = new TransactionDate(date1);
      const transactionDate2 = new TransactionDate(date2);

      expect(transactionDate1.equals(transactionDate2)).toBe(false);
    });
  });
});
