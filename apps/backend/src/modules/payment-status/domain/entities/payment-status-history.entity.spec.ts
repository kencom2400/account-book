import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentStatusRecord } from './payment-status-record.entity';
import { PaymentStatusHistory } from './payment-status-history.entity';

describe('PaymentStatusHistory Entity', () => {
  const createMockRecord = (
    cardSummaryId: string,
    status: PaymentStatus,
    updatedAt: Date,
  ): PaymentStatusRecord => {
    return new PaymentStatusRecord(
      `record-${Date.now()}-${Math.random()}`,
      cardSummaryId,
      status,
      undefined,
      updatedAt,
      'system',
      undefined,
      undefined,
      undefined,
      updatedAt,
    );
  };

  describe('constructor', () => {
    it('正常にエンティティを作成できる', () => {
      const record = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date(),
      );
      const history = new PaymentStatusHistory('summary-123', [record]);

      expect(history.cardSummaryId).toBe('summary-123');
      expect(history.statusChanges).toHaveLength(1);
      expect(history.statusChanges[0]).toBe(record);
    });

    it('空の配列でエンティティを作成できる', () => {
      const history = new PaymentStatusHistory('summary-123', []);

      expect(history.cardSummaryId).toBe('summary-123');
      expect(history.statusChanges).toHaveLength(0);
    });

    it('cardSummaryIdが欠けている場合はエラーを投げる', () => {
      const record = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date(),
      );

      expect(() => {
        new PaymentStatusHistory('', [record]);
      }).toThrow('Card summary ID is required');
    });

    it('statusChangesが欠けている場合はエラーを投げる', () => {
      expect(() => {
        new PaymentStatusHistory(
          'summary-123',
          null as unknown as PaymentStatusRecord[],
        );
      }).toThrow('Status changes is required');
    });

    it('異なるcardSummaryIdのレコードが含まれている場合はエラーを投げる', () => {
      const record1 = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date(),
      );
      const record2 = createMockRecord(
        'summary-456',
        PaymentStatus.PROCESSING,
        new Date(),
      );

      expect(() => {
        new PaymentStatusHistory('summary-123', [record1, record2]);
      }).toThrow('All status changes must have the same card summary ID');
    });
  });

  describe('addStatusChange', () => {
    it('新しいステータス変更を追加できる', () => {
      const record1 = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date('2025-01-01'),
      );
      const history = new PaymentStatusHistory('summary-123', [record1]);

      const record2 = createMockRecord(
        'summary-123',
        PaymentStatus.PROCESSING,
        new Date('2025-01-02'),
      );
      const newHistory = history.addStatusChange(record2);

      expect(newHistory.statusChanges).toHaveLength(2);
      expect(newHistory.statusChanges[0]).toBe(record1);
      expect(newHistory.statusChanges[1]).toBe(record2);
      // 元の履歴は変更されていない（不変性）
      expect(history.statusChanges).toHaveLength(1);
    });

    it('異なるcardSummaryIdのレコードを追加しようとするとエラーを投げる', () => {
      const record1 = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date(),
      );
      const history = new PaymentStatusHistory('summary-123', [record1]);

      const record2 = createMockRecord(
        'summary-456',
        PaymentStatus.PROCESSING,
        new Date(),
      );

      expect(() => {
        history.addStatusChange(record2);
      }).toThrow('Status change record must have the same card summary ID');
    });
  });

  describe('getLatestStatus', () => {
    it('最新のステータスを取得できる', () => {
      const record1 = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date('2025-01-01'),
      );
      const record2 = createMockRecord(
        'summary-123',
        PaymentStatus.PROCESSING,
        new Date('2025-01-02'),
      );
      const record3 = createMockRecord(
        'summary-123',
        PaymentStatus.PAID,
        new Date('2025-01-03'),
      );
      const history = new PaymentStatusHistory('summary-123', [
        record1,
        record2,
        record3,
      ]);

      const latestStatus = history.getLatestStatus();

      expect(latestStatus).toBe(PaymentStatus.PAID);
    });

    it('ステータス変更履歴が存在しない場合はエラーを投げる', () => {
      const history = new PaymentStatusHistory('summary-123', []);

      expect(() => {
        history.getLatestStatus();
      }).toThrow('No status changes found');
    });
  });

  describe('getStatusAt', () => {
    it('指定日時点のステータスを取得できる', () => {
      const record1 = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date('2025-01-01'),
      );
      const record2 = createMockRecord(
        'summary-123',
        PaymentStatus.PROCESSING,
        new Date('2025-01-05'),
      );
      const record3 = createMockRecord(
        'summary-123',
        PaymentStatus.PAID,
        new Date('2025-01-10'),
      );
      const history = new PaymentStatusHistory('summary-123', [
        record1,
        record2,
        record3,
      ]);

      const statusAt = history.getStatusAt(new Date('2025-01-07'));

      expect(statusAt).not.toBeNull();
      expect(statusAt?.status).toBe(PaymentStatus.PROCESSING);
    });

    it('指定日以前の最も新しいレコードを返す', () => {
      const record1 = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date('2025-01-01'),
      );
      const record2 = createMockRecord(
        'summary-123',
        PaymentStatus.PROCESSING,
        new Date('2025-01-05'),
      );
      const record3 = createMockRecord(
        'summary-123',
        PaymentStatus.PAID,
        new Date('2025-01-10'),
      );
      const history = new PaymentStatusHistory('summary-123', [
        record1,
        record2,
        record3,
      ]);

      const statusAt = history.getStatusAt(new Date('2025-01-05'));

      expect(statusAt).not.toBeNull();
      expect(statusAt?.status).toBe(PaymentStatus.PROCESSING);
    });

    it('指定日より前のレコードがない場合はnullを返す', () => {
      const record1 = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date('2025-01-10'),
      );
      const history = new PaymentStatusHistory('summary-123', [record1]);

      const statusAt = history.getStatusAt(new Date('2025-01-01'));

      expect(statusAt).toBeNull();
    });

    it('空の履歴の場合はnullを返す', () => {
      const history = new PaymentStatusHistory('summary-123', []);

      const statusAt = history.getStatusAt(new Date('2025-01-01'));

      expect(statusAt).toBeNull();
    });
  });

  describe('createEmpty', () => {
    it('空の履歴を作成できる', () => {
      const history = PaymentStatusHistory.createEmpty('summary-123');

      expect(history.cardSummaryId).toBe('summary-123');
      expect(history.statusChanges).toHaveLength(0);
    });
  });
});
