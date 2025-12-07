import { IsNotFutureDateConstraint } from './get-asset-balance.dto';

describe('IsNotFutureDateConstraint', () => {
  let constraint: IsNotFutureDateConstraint;

  beforeEach(() => {
    constraint = new IsNotFutureDateConstraint();
  });

  describe('validate', () => {
    it('should return true when asOfDate is empty', () => {
      const result = constraint.validate('');
      expect(result).toBe(true);
    });

    it('should return true when asOfDate is undefined', () => {
      const result = constraint.validate(undefined as unknown as string);
      expect(result).toBe(true);
    });

    it('should return true when asOfDate is today', () => {
      const mockDate = new Date('2025-01-20T12:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const result = constraint.validate('2025-01-20');

      expect(result).toBe(true);

      jest.useRealTimers();
    });

    it('should return true when asOfDate is in the past', () => {
      const mockDate = new Date('2025-01-20T12:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const result = constraint.validate('2025-01-19');

      expect(result).toBe(true);

      jest.useRealTimers();
    });

    it('should return true when asOfDate is end of today', () => {
      const mockDate = new Date('2025-01-20T23:59:59.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const result = constraint.validate('2025-01-20T23:59:59.999Z');

      expect(result).toBe(true);

      jest.useRealTimers();
    });

    it('should return false when asOfDate is in the future', () => {
      const mockDate = new Date('2025-01-20T12:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const result = constraint.validate('2025-01-21');

      expect(result).toBe(false);

      jest.useRealTimers();
    });

    it('should return false when asOfDate is tomorrow', () => {
      const mockDate = new Date('2025-01-20T12:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const result = constraint.validate('2025-01-21T00:00:00.000Z');

      expect(result).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('defaultMessage', () => {
    it('should return correct error message', () => {
      const message = constraint.defaultMessage();
      expect(message).toBe('asOfDate must not be a future date');
    });
  });
});
