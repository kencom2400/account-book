import {
  AlertNotFoundException,
  DuplicateAlertException,
  AlertAlreadyResolvedException,
  CriticalAlertDeletionException,
  AlertGenerationException,
  NotificationSendException,
  AlertResolutionException,
} from './alert.errors';

describe('Alert Errors', () => {
  describe('AlertNotFoundException', () => {
    it('正しいメッセージとプロパティを持つ', () => {
      const error = new AlertNotFoundException('alert-001');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AlertNotFoundException');
      expect(error.message).toBe('Alert not found: alert-001');
      expect(error.alertId).toBe('alert-001');
    });
  });

  describe('DuplicateAlertException', () => {
    it('正しいメッセージとプロパティを持つ', () => {
      const error = new DuplicateAlertException('reconciliation-001');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DuplicateAlertException');
      expect(error.message).toBe(
        'Duplicate alert already exists for reconciliation: reconciliation-001',
      );
      expect(error.reconciliationId).toBe('reconciliation-001');
    });
  });

  describe('AlertAlreadyResolvedException', () => {
    it('正しいメッセージとプロパティを持つ', () => {
      const error = new AlertAlreadyResolvedException('alert-001');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AlertAlreadyResolvedException');
      expect(error.message).toBe('Alert is already resolved: alert-001');
      expect(error.alertId).toBe('alert-001');
    });
  });

  describe('CriticalAlertDeletionException', () => {
    it('正しいメッセージとプロパティを持つ', () => {
      const error = new CriticalAlertDeletionException('alert-001');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('CriticalAlertDeletionException');
      expect(error.message).toBe('CRITICAL alert cannot be deleted: alert-001');
      expect(error.alertId).toBe('alert-001');
    });
  });

  describe('AlertGenerationException', () => {
    it('正しいメッセージとプロパティを持つ', () => {
      const error = new AlertGenerationException('Database connection failed');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AlertGenerationException');
      expect(error.message).toBe(
        'Alert generation failed: Database connection failed',
      );
      expect(error.reason).toBe('Database connection failed');
    });
  });

  describe('NotificationSendException', () => {
    it('正しいメッセージとプロパティを持つ', () => {
      const error = new NotificationSendException('SMTP server error');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('NotificationSendException');
      expect(error.message).toBe('Notification send failed: SMTP server error');
      expect(error.reason).toBe('SMTP server error');
    });
  });

  describe('AlertResolutionException', () => {
    it('正しいメッセージとプロパティを持つ', () => {
      const error = new AlertResolutionException('Invalid resolution data');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AlertResolutionException');
      expect(error.message).toBe(
        'Alert resolution failed: Invalid resolution data',
      );
      expect(error.reason).toBe('Invalid resolution data');
    });
  });
});
