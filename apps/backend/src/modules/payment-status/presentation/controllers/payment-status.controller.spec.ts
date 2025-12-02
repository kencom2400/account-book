import { Test, TestingModule } from '@nestjs/testing';
import { PaymentStatusController } from './payment-status.controller';
import { UpdatePaymentStatusUseCase } from '../../application/use-cases/update-payment-status.use-case';
import { GetPaymentStatusHistoryUseCase } from '../../application/use-cases/get-payment-status-history.use-case';
import { GetPaymentStatusesUseCase } from '../../application/use-cases/get-payment-statuses.use-case';
import type { PaymentStatusRepository } from '../../domain/repositories/payment-status.repository.interface';
import { PAYMENT_STATUS_REPOSITORY } from '../../payment-status.tokens';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { PaymentStatusRecord } from '../../domain/entities/payment-status-record.entity';
import { PaymentStatusHistory } from '../../domain/entities/payment-status-history.entity';
import { UpdatePaymentStatusRequestDto } from '../dto/update-payment-status.dto';

describe('PaymentStatusController', () => {
  let controller: PaymentStatusController;
  let updateUseCase: jest.Mocked<UpdatePaymentStatusUseCase>;
  let getHistoryUseCase: jest.Mocked<GetPaymentStatusHistoryUseCase>;
  let getStatusesUseCase: jest.Mocked<GetPaymentStatusesUseCase>;
  let paymentStatusRepository: jest.Mocked<PaymentStatusRepository>;

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
      'user',
      undefined,
      undefined,
      undefined,
      updatedAt,
    );
  };

  beforeEach(async () => {
    updateUseCase = {
      executeManually: jest.fn(),
      executeAutomatically: jest.fn(),
    } as unknown as jest.Mocked<UpdatePaymentStatusUseCase>;

    getHistoryUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetPaymentStatusHistoryUseCase>;

    getStatusesUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetPaymentStatusesUseCase>;

    const mockPaymentStatusRepository: jest.Mocked<PaymentStatusRepository> = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCardSummaryId: jest.fn(),
      findHistoryByCardSummaryId: jest.fn(),
      findAllByStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentStatusController],
      providers: [
        {
          provide: UpdatePaymentStatusUseCase,
          useValue: updateUseCase,
        },
        {
          provide: GetPaymentStatusHistoryUseCase,
          useValue: getHistoryUseCase,
        },
        {
          provide: GetPaymentStatusesUseCase,
          useValue: getStatusesUseCase,
        },
        {
          provide: PAYMENT_STATUS_REPOSITORY,
          useValue: mockPaymentStatusRepository,
        },
      ],
    }).compile();

    controller = module.get<PaymentStatusController>(PaymentStatusController);
    paymentStatusRepository = module.get(PAYMENT_STATUS_REPOSITORY);
  });

  describe('PUT /api/payment-status/:cardSummaryId', () => {
    it('ステータスを手動更新できる', async () => {
      const request: UpdatePaymentStatusRequestDto = {
        newStatus: PaymentStatus.MANUAL_CONFIRMED,
        notes: '手動で確認完了',
      };
      const baseRecord = createMockRecord(
        'summary-123',
        PaymentStatus.MANUAL_CONFIRMED,
        new Date(),
      );
      // notesを含むレコードを作成
      const record = new PaymentStatusRecord(
        baseRecord.id,
        baseRecord.cardSummaryId,
        baseRecord.status,
        baseRecord.previousStatus,
        baseRecord.updatedAt,
        baseRecord.updatedBy,
        baseRecord.reason,
        baseRecord.reconciliationId,
        '手動で確認完了',
        baseRecord.createdAt,
      );

      updateUseCase.executeManually.mockResolvedValue(record);

      const result = await controller.updateStatus('summary-123', request);

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(PaymentStatus.MANUAL_CONFIRMED);
      expect(result.data.notes).toBe('手動で確認完了');
      expect(updateUseCase.executeManually).toHaveBeenCalledWith(
        'summary-123',
        PaymentStatus.MANUAL_CONFIRMED,
        'user',
        '手動で確認完了',
      );
    });

    it('notesが未指定でも更新できる', async () => {
      const request: UpdatePaymentStatusRequestDto = {
        newStatus: PaymentStatus.MANUAL_CONFIRMED,
      };
      const record = createMockRecord(
        'summary-123',
        PaymentStatus.MANUAL_CONFIRMED,
        new Date(),
      );

      updateUseCase.executeManually.mockResolvedValue(record);

      const result = await controller.updateStatus('summary-123', request);

      expect(result.success).toBe(true);
      expect(updateUseCase.executeManually).toHaveBeenCalledWith(
        'summary-123',
        PaymentStatus.MANUAL_CONFIRMED,
        'user',
        undefined,
      );
    });
  });

  describe('GET /api/payment-status', () => {
    it('複数のステータス記録を一括取得できる', async () => {
      const record1 = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date('2025-01-01'),
      );
      const record2 = createMockRecord(
        'summary-456',
        PaymentStatus.PROCESSING,
        new Date('2025-01-02'),
      );

      const recordsMap = new Map<string, PaymentStatusRecord>();
      recordsMap.set('summary-123', record1);
      recordsMap.set('summary-456', record2);

      getStatusesUseCase.execute.mockResolvedValue(recordsMap);

      const result = await controller.getStatuses('summary-123,summary-456');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].cardSummaryId).toBe('summary-123');
      expect(result.data[1].cardSummaryId).toBe('summary-456');
      expect(getStatusesUseCase.execute).toHaveBeenCalledWith([
        'summary-123',
        'summary-456',
      ]);
    });

    it('空のクエリパラメータの場合は空配列を返す', async () => {
      const emptyMap = new Map<string, PaymentStatusRecord>();
      getStatusesUseCase.execute.mockResolvedValue(emptyMap);

      const result = await controller.getStatuses('');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(getStatusesUseCase.execute).toHaveBeenCalledWith([]);
    });

    it('クエリパラメータに空白が含まれていても正常に動作する', async () => {
      const record1 = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date('2025-01-01'),
      );

      const recordsMap = new Map<string, PaymentStatusRecord>();
      recordsMap.set('summary-123', record1);

      getStatusesUseCase.execute.mockResolvedValue(recordsMap);

      const result = await controller.getStatuses('summary-123, , summary-456');

      expect(result.success).toBe(true);
      expect(getStatusesUseCase.execute).toHaveBeenCalledWith([
        'summary-123',
        'summary-456',
      ]);
    });
  });

  describe('GET /api/payment-status/:cardSummaryId', () => {
    it('現在のステータスを取得できる', async () => {
      const record = createMockRecord(
        'summary-123',
        PaymentStatus.PROCESSING,
        new Date(),
      );

      paymentStatusRepository.findByCardSummaryId.mockResolvedValue(record);

      const result = await controller.getStatus('summary-123');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(PaymentStatus.PROCESSING);
      expect(paymentStatusRepository.findByCardSummaryId).toHaveBeenCalledWith(
        'summary-123',
      );
    });

    it('ステータスが見つからない場合はエラーを投げる', async () => {
      paymentStatusRepository.findByCardSummaryId.mockResolvedValue(null);

      await expect(controller.getStatus('summary-123')).rejects.toThrow();
    });
  });

  describe('GET /api/payment-status/:cardSummaryId/history', () => {
    it('ステータス変更履歴を取得できる', async () => {
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
      const history = new PaymentStatusHistory('summary-123', [
        record1,
        record2,
      ]);

      getHistoryUseCase.execute.mockResolvedValue(history);

      const result = await controller.getStatusHistory('summary-123');

      expect(result.success).toBe(true);
      expect(result.data.cardSummaryId).toBe('summary-123');
      expect(result.data.statusChanges).toHaveLength(2);
      expect(getHistoryUseCase.execute).toHaveBeenCalledWith('summary-123');
    });
  });

  describe('GET /api/payment-status/:cardSummaryId/allowed-transitions', () => {
    it('遷移可能なステータスリストを取得できる', async () => {
      const record = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date(),
      );

      paymentStatusRepository.findByCardSummaryId.mockResolvedValue(record);

      const result = await controller.getAllowedTransitions('summary-123');

      expect(result.success).toBe(true);
      expect(result.data.currentStatus).toBe(PaymentStatus.PENDING);
      expect(result.data.allowedTransitions).toContain(
        PaymentStatus.PROCESSING,
      );
      expect(result.data.allowedTransitions).toContain(PaymentStatus.PARTIAL);
      expect(paymentStatusRepository.findByCardSummaryId).toHaveBeenCalledWith(
        'summary-123',
      );
    });

    it('ステータスが見つからない場合はエラーを投げる', async () => {
      paymentStatusRepository.findByCardSummaryId.mockResolvedValue(null);

      await expect(
        controller.getAllowedTransitions('summary-123'),
      ).rejects.toThrow();
    });
  });
});
