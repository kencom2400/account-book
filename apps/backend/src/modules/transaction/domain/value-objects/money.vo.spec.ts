import { Money } from './money.vo';

describe('Money', () => {
  describe('constructor', () => {
    it('should create a Money instance with valid amount', () => {
      const money = new Money(1000);

      expect(money.amount).toBe(1000);
      expect(money.currency).toBe('JPY');
    });

    it('should create a Money instance with custom currency', () => {
      const money = new Money(100, 'USD');

      expect(money.amount).toBe(100);
      expect(money.currency).toBe('USD');
    });

    it('should throw error when amount is undefined', () => {
      expect(() => new Money(undefined as any)).toThrow('Amount is required');
    });

    it('should throw error when amount is null', () => {
      expect(() => new Money(null as any)).toThrow('Amount is required');
    });

    it('should throw error when currency is empty', () => {
      expect(() => new Money(1000, '')).toThrow('Currency is required');
    });

    it('should accept zero amount', () => {
      const money = new Money(0);

      expect(money.amount).toBe(0);
    });

    it('should accept negative amount', () => {
      const money = new Money(-500);

      expect(money.amount).toBe(-500);
    });
  });

  describe('add', () => {
    it('should add two money amounts with same currency', () => {
      const money1 = new Money(1000);
      const money2 = new Money(500);

      const result = money1.add(money2);

      expect(result.amount).toBe(1500);
      expect(result.currency).toBe('JPY');
    });

    it('should throw error when adding different currencies', () => {
      const jpy = new Money(1000, 'JPY');
      const usd = new Money(10, 'USD');

      expect(() => jpy.add(usd)).toThrow('Currency mismatch: JPY vs USD');
    });

    it('should handle negative amounts', () => {
      const money1 = new Money(1000);
      const money2 = new Money(-300);

      const result = money1.add(money2);

      expect(result.amount).toBe(700);
    });
  });

  describe('subtract', () => {
    it('should subtract two money amounts with same currency', () => {
      const money1 = new Money(1000);
      const money2 = new Money(300);

      const result = money1.subtract(money2);

      expect(result.amount).toBe(700);
      expect(result.currency).toBe('JPY');
    });

    it('should throw error when subtracting different currencies', () => {
      const jpy = new Money(1000, 'JPY');
      const usd = new Money(10, 'USD');

      expect(() => jpy.subtract(usd)).toThrow('Currency mismatch: JPY vs USD');
    });

    it('should handle negative result', () => {
      const money1 = new Money(500);
      const money2 = new Money(1000);

      const result = money1.subtract(money2);

      expect(result.amount).toBe(-500);
    });
  });

  describe('multiply', () => {
    it('should multiply money amount by positive number', () => {
      const money = new Money(100);

      const result = money.multiply(5);

      expect(result.amount).toBe(500);
      expect(result.currency).toBe('JPY');
    });

    it('should multiply by zero', () => {
      const money = new Money(100);

      const result = money.multiply(0);

      expect(result.amount).toBe(0);
    });

    it('should multiply by negative number', () => {
      const money = new Money(100);

      const result = money.multiply(-2);

      expect(result.amount).toBe(-200);
    });

    it('should multiply by decimal', () => {
      const money = new Money(100);

      const result = money.multiply(1.5);

      expect(result.amount).toBe(150);
    });
  });

  describe('isPositive', () => {
    it('should return true for positive amount', () => {
      const money = new Money(100);

      expect(money.isPositive()).toBe(true);
    });

    it('should return false for zero amount', () => {
      const money = new Money(0);

      expect(money.isPositive()).toBe(false);
    });

    it('should return false for negative amount', () => {
      const money = new Money(-100);

      expect(money.isPositive()).toBe(false);
    });
  });

  describe('isNegative', () => {
    it('should return true for negative amount', () => {
      const money = new Money(-100);

      expect(money.isNegative()).toBe(true);
    });

    it('should return false for zero amount', () => {
      const money = new Money(0);

      expect(money.isNegative()).toBe(false);
    });

    it('should return false for positive amount', () => {
      const money = new Money(100);

      expect(money.isNegative()).toBe(false);
    });
  });

  describe('isZero', () => {
    it('should return true for zero amount', () => {
      const money = new Money(0);

      expect(money.isZero()).toBe(true);
    });

    it('should return false for positive amount', () => {
      const money = new Money(100);

      expect(money.isZero()).toBe(false);
    });

    it('should return false for negative amount', () => {
      const money = new Money(-100);

      expect(money.isZero()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for equal amounts and currency', () => {
      const money1 = new Money(1000, 'JPY');
      const money2 = new Money(1000, 'JPY');

      expect(money1.equals(money2)).toBe(true);
    });

    it('should return false for different amounts', () => {
      const money1 = new Money(1000, 'JPY');
      const money2 = new Money(2000, 'JPY');

      expect(money1.equals(money2)).toBe(false);
    });

    it('should return false for different currencies', () => {
      const money1 = new Money(1000, 'JPY');
      const money2 = new Money(1000, 'USD');

      expect(money1.equals(money2)).toBe(false);
    });

    it('should return false for different amounts and currencies', () => {
      const money1 = new Money(1000, 'JPY');
      const money2 = new Money(2000, 'USD');

      expect(money1.equals(money2)).toBe(false);
    });
  });

  describe('format', () => {
    it('should format money with currency and amount', () => {
      const money = new Money(1000, 'JPY');

      const formatted = money.format();

      expect(formatted).toBe('JPY 1,000');
    });

    it('should format USD correctly', () => {
      const money = new Money(1234.56, 'USD');

      const formatted = money.format();

      expect(formatted).toBe('USD 1,234.56');
    });

    it('should format zero correctly', () => {
      const money = new Money(0, 'JPY');

      const formatted = money.format();

      expect(formatted).toBe('JPY 0');
    });

    it('should format negative amount correctly', () => {
      const money = new Money(-500, 'JPY');

      const formatted = money.format();

      expect(formatted).toBe('JPY -500');
    });
  });
});
