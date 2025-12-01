import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentStatusRecord } from './payment-status-record.entity';

describe('PaymentStatusRecord Entity', () => {
  const createMockRecord = (
    overrides?: Partial<{
      id: string;
      cardSummaryId: string;
      status: PaymentStatus;
      previousStatus: PaymentStatus | undefined;
      updatedAt: Date;
      updatedBy: 'system' | 'user';
      reason: string | undefined;
      reconciliationId: string | undefined;
      notes: string | undefined;
      createdAt: Date;
    }>,
  ) => {
    const defaults = {
      id: 'record-123',
      cardSummaryId: 'summary-456',
      status: PaymentStatus.PENDING,
      previousStatus: undefined,
      updatedAt: new Date('2025-01-15'),
      updatedBy: 'system' as const,
      reason: undefined,
      reconciliationId: undefined,
      notes: undefined,
      createdAt: new Date('2025-01-15'),
      ...overrides,
    };

    return new PaymentStatusRecord(
      defaults.id,
      defaults.cardSummaryId,
      defaults.status,
      defaults.previousStatus,
      defaults.updatedAt,
      defaults.updatedBy,
      defaults.reason,
      defaults.reconciliationId,
      defaults.notes,
      defaults.createdAt,
    );
  };

  describe('constructor', () => {
    it('正常にエンティティを作成できる', () => {
      const record = createMockRecord();
      expect(record.id).toBe('record-123');
      expect(record.cardSummaryId).toBe('summary-456');
      expect(record.status).toBe(PaymentStatus.PENDING);
    });

    it('必須フィールドが欠けている場合はエラーを投げる', () => {
      expect(() => {
        new PaymentStatusRecord(
          '',
          'summary-456',
          PaymentStatus.PENDING,
          undefined,
          new Date(),
          'system',
          undefined,
          undefined,
          undefined,
          new Date(),
        );
      }).toThrow('ID is required');
    });
  });

  describe('canTransitionTo', () => {
    it('PENDINGからPROCESSINGへの遷移が可能', () => {
      const record = createMockRecord({ status: PaymentStatus.PENDING });
      expect(record.canTransitionTo(PaymentStatus.PROCESSING)).toBe(true);
    });

    it('PENDINGからPARTIALへの遷移が可能', () => {
      const record = createMockRecord({ status: PaymentStatus.PENDING });
      expect(record.canTransitionTo(PaymentStatus.PARTIAL)).toBe(true);
    });

    it('PENDINGからCANCELLEDへの遷移が可能', () => {
      const record = createMockRecord({ status: PaymentStatus.PENDING });
      expect(record.canTransitionTo(PaymentStatus.CANCELLED)).toBe(true);
    });

    it('PENDINGからMANUAL_CONFIRMEDへの遷移が可能', () => {
      const record = createMockRecord({ status: PaymentStatus.PENDING });
      expect(record.canTransitionTo(PaymentStatus.MANUAL_CONFIRMED)).toBe(true);
    });

    it('PROCESSINGからPAIDへの遷移が可能', () => {
      const record = createMockRecord({ status: PaymentStatus.PROCESSING });
      expect(record.canTransitionTo(PaymentStatus.PAID)).toBe(true);
    });

    it('PROCESSINGからDISPUTEDへの遷移が可能', () => {
      const record = createMockRecord({ status: PaymentStatus.PROCESSING });
      expect(record.canTransitionTo(PaymentStatus.DISPUTED)).toBe(true);
    });

    it('PROCESSINGからOVERDUEへの遷移が可能', () => {
      const record = createMockRecord({ status: PaymentStatus.PROCESSING });
      expect(record.canTransitionTo(PaymentStatus.OVERDUE)).toBe(true);
    });

    it('DISPUTEDからMANUAL_CONFIRMEDへの遷移が可能', () => {
      const record = createMockRecord({ status: PaymentStatus.DISPUTED });
      expect(record.canTransitionTo(PaymentStatus.MANUAL_CONFIRMED)).toBe(true);
    });

    it('終端状態からは遷移不可', () => {
      const paidRecord = createMockRecord({ status: PaymentStatus.PAID });
      expect(paidRecord.canTransitionTo(PaymentStatus.PENDING)).toBe(false);

      const overdueRecord = createMockRecord({
        status: PaymentStatus.OVERDUE,
      });
      expect(overdueRecord.canTransitionTo(PaymentStatus.PENDING)).toBe(false);
    });

    it('同じステータスへの遷移は不可', () => {
      const record = createMockRecord({ status: PaymentStatus.PENDING });
      expect(record.canTransitionTo(PaymentStatus.PENDING)).toBe(false);
    });

    it('無効な遷移は不可', () => {
      const record = createMockRecord({ status: PaymentStatus.PENDING });
      expect(record.canTransitionTo(PaymentStatus.PAID)).toBe(false);
    });
  });

  describe('getAllowedTransitions', () => {
    it('PENDINGから遷移可能なステータスを取得', () => {
      const record = createMockRecord({ status: PaymentStatus.PENDING });
      const allowed = record.getAllowedTransitions();
      expect(allowed).toContain(PaymentStatus.PROCESSING);
      expect(allowed).toContain(PaymentStatus.PARTIAL);
      expect(allowed).toContain(PaymentStatus.CANCELLED);
      expect(allowed).toContain(PaymentStatus.MANUAL_CONFIRMED);
    });

    it('PROCESSINGから遷移可能なステータスを取得', () => {
      const record = createMockRecord({ status: PaymentStatus.PROCESSING });
      const allowed = record.getAllowedTransitions();
      expect(allowed).toContain(PaymentStatus.PAID);
      expect(allowed).toContain(PaymentStatus.DISPUTED);
      expect(allowed).toContain(PaymentStatus.OVERDUE);
    });

    it('終端状態からは遷移可能なステータスがない', () => {
      const record = createMockRecord({ status: PaymentStatus.PAID });
      const allowed = record.getAllowedTransitions();
      expect(allowed).toHaveLength(0);
    });
  });

  describe('transitionTo', () => {
    it('有効な遷移で新しいレコードを作成', () => {
      const record = createMockRecord({ status: PaymentStatus.PENDING });
      const newRecord = record.transitionTo(
        PaymentStatus.PROCESSING,
        'system',
        '引落予定日の3日前',
      );

      expect(newRecord.status).toBe(PaymentStatus.PROCESSING);
      expect(newRecord.previousStatus).toBe(PaymentStatus.PENDING);
      expect(newRecord.updatedBy).toBe('system');
      expect(newRecord.reason).toBe('引落予定日の3日前');
      expect(newRecord.id).not.toBe(record.id);
    });

    it('無効な遷移の場合はエラーを投げる', () => {
      const record = createMockRecord({ status: PaymentStatus.PENDING });
      expect(() => {
        record.transitionTo(PaymentStatus.PAID, 'system');
      }).toThrow('Cannot transition from PENDING to PAID');
    });

    it('notesとreconciliationIdを設定できる', () => {
      const record = createMockRecord({ status: PaymentStatus.PROCESSING });
      const newRecord = record.transitionTo(
        PaymentStatus.PAID,
        'system',
        '照合成功',
        undefined,
        'reconciliation-123',
      );

      expect(newRecord.reconciliationId).toBe('reconciliation-123');
    });
  });

  describe('createInitial', () => {
    it('初期ステータス記録を作成', () => {
      const record = PaymentStatusRecord.createInitial(
        'summary-456',
        PaymentStatus.PENDING,
        'system',
        '初期ステータス',
      );

      expect(record.cardSummaryId).toBe('summary-456');
      expect(record.status).toBe(PaymentStatus.PENDING);
      expect(record.previousStatus).toBeUndefined();
      expect(record.updatedBy).toBe('system');
      expect(record.reason).toBe('初期ステータス');
    });
  });
});
