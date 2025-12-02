import { Test, TestingModule } from '@nestjs/testing';
import { PaymentStatusUpdateScheduler } from './payment-status-update-scheduler.service';
import { UpdatePaymentStatusUseCase } from '../use-cases/update-payment-status.use-case';
import type { AggregationRepository } from '../../../aggregation/domain/repositories/aggregation.repository.interface';
import { AGGREGATION_REPOSITORY } from '../../../aggregation/aggregation.tokens';
import type { PaymentStatusRepository } from '../../domain/repositories/payment-status.repository.interface';
import { PAYMENT_STATUS_REPOSITORY } from '../../payment-status.tokens';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { PaymentStatusRecord } from '../../domain/entities/payment-status-record.entity';
import { MonthlyCardSummary } from '../../../aggregation/domain/entities/monthly-card-summary.entity';
import { CategoryAmount } from '../../../aggregation/domain/value-objects/category-amount.vo';

describe('PaymentStatusUpdateScheduler', () => {
  let scheduler: PaymentStatusUpdateScheduler;
  let updateUseCase: jest.Mocked<UpdatePaymentStatusUseCase>;
  let summaryRepository: jest.Mocked<AggregationRepository>;
  let statusRepository: jest.Mocked<PaymentStatusRepository>;

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

  const createMockSummary = (
    id: string,
    paymentDate: Date,
  ): MonthlyCardSummary => {
    return new MonthlyCardSummary(
      id,
      'card-123',
      '楽天カード',
      '2025-01',
      new Date('2025-01-31'),
      paymentDate,
      50000,
      5,
      [new CategoryAmount('食費', 30000, 3)],
      ['tx-001', 'tx-002'],
      50000,
      PaymentStatus.PENDING,
      new Date('2025-01-01'),
      new Date('2025-01-01'),
    );
  };

  beforeEach(async () => {
    updateUseCase = {
      executeManually: jest.fn(),
      executeAutomatically: jest.fn(),
    } as unknown as jest.Mocked<UpdatePaymentStatusUseCase>;

    const mockSummaryRepository: jest.Mocked<AggregationRepository> = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByCardAndMonth: jest.fn(),
      findByCard: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const mockStatusRepository: jest.Mocked<PaymentStatusRepository> = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCardSummaryId: jest.fn(),
      findHistoryByCardSummaryId: jest.fn(),
      findAllByStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentStatusUpdateScheduler,
        {
          provide: UpdatePaymentStatusUseCase,
          useValue: updateUseCase,
        },
        {
          provide: AGGREGATION_REPOSITORY,
          useValue: mockSummaryRepository,
        },
        {
          provide: PAYMENT_STATUS_REPOSITORY,
          useValue: mockStatusRepository,
        },
      ],
    }).compile();

    scheduler = module.get<PaymentStatusUpdateScheduler>(
      PaymentStatusUpdateScheduler,
    );
    summaryRepository = module.get(AGGREGATION_REPOSITORY);
    statusRepository = module.get(PAYMENT_STATUS_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleDailyUpdate', () => {
    it('日次バッチ処理を正常に実行できる', async () => {
      statusRepository.findAllByStatus.mockResolvedValue([]);

      await scheduler.scheduleDailyUpdate();

      expect(statusRepository.findAllByStatus).toHaveBeenCalledWith(
        PaymentStatus.PENDING,
      );
      expect(statusRepository.findAllByStatus).toHaveBeenCalledWith(
        PaymentStatus.PROCESSING,
      );
    });

    it('エラーが発生した場合は例外を投げる', async () => {
      statusRepository.findAllByStatus.mockRejectedValue(
        new Error('Test error'),
      );

      await expect(scheduler.scheduleDailyUpdate()).rejects.toThrow(
        'Test error',
      );
    });
  });

  describe('updatePendingToProcessing', () => {
    it('引落予定日の3日前のレコードを更新できる', async () => {
      const today = new Date('2025-01-24'); // 2025-01-27の3日前
      jest.useFakeTimers();
      jest.setSystemTime(today);

      const paymentDate = new Date('2025-01-27');
      const record = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date('2025-01-01'),
      );
      const summary = createMockSummary('summary-123', paymentDate);
      const updatedRecord = createMockRecord(
        'summary-123',
        PaymentStatus.PROCESSING,
        today,
      );

      statusRepository.findAllByStatus.mockResolvedValue([record]);
      summaryRepository.findByIds.mockResolvedValue([summary]);
      updateUseCase.executeAutomatically.mockResolvedValue(updatedRecord);

      await scheduler.updatePendingToProcessing();

      expect(updateUseCase.executeAutomatically).toHaveBeenCalledWith(
        'summary-123',
        PaymentStatus.PROCESSING,
        '引落予定日の3日前',
      );

      jest.useRealTimers();
    });

    it('引落予定日の3日前より前のレコードは更新しない', async () => {
      const today = new Date('2025-01-23'); // 2025-01-27の4日前
      jest.useFakeTimers();
      jest.setSystemTime(today);

      const paymentDate = new Date('2025-01-27');
      const record = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date('2025-01-01'),
      );
      const summary = createMockSummary('summary-123', paymentDate);

      statusRepository.findAllByStatus.mockResolvedValue([record]);
      summaryRepository.findByIds.mockResolvedValue([summary]);

      await scheduler.updatePendingToProcessing();

      expect(updateUseCase.executeAutomatically).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('PENDINGレコードが存在しない場合は何もしない', async () => {
      statusRepository.findAllByStatus.mockResolvedValue([]);

      await scheduler.updatePendingToProcessing();

      expect(updateUseCase.executeAutomatically).not.toHaveBeenCalled();
    });

    it('MonthlyCardSummaryが見つからない場合はスキップする', async () => {
      const today = new Date('2025-01-24');
      jest.useFakeTimers();
      jest.setSystemTime(today);

      const record = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date('2025-01-01'),
      );

      statusRepository.findAllByStatus.mockResolvedValue([record]);
      summaryRepository.findByIds.mockResolvedValue([]);

      await scheduler.updatePendingToProcessing();

      expect(updateUseCase.executeAutomatically).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('updateProcessingToOverdue', () => {
    it('引落予定日+7日経過のレコードを更新できる', async () => {
      const today = new Date('2025-02-04'); // 2025-01-27の8日後
      jest.useFakeTimers();
      jest.setSystemTime(today);

      const paymentDate = new Date('2025-01-27');
      const record = createMockRecord(
        'summary-123',
        PaymentStatus.PROCESSING,
        new Date('2025-01-28'),
      );
      const summary = createMockSummary('summary-123', paymentDate);
      const updatedRecord = createMockRecord(
        'summary-123',
        PaymentStatus.OVERDUE,
        today,
      );

      statusRepository.findAllByStatus.mockResolvedValue([record]);
      summaryRepository.findByIds.mockResolvedValue([summary]);
      updateUseCase.executeAutomatically.mockResolvedValue(updatedRecord);

      await scheduler.updateProcessingToOverdue();

      expect(updateUseCase.executeAutomatically).toHaveBeenCalledWith(
        'summary-123',
        PaymentStatus.OVERDUE,
        '引落予定日+7日経過',
      );

      jest.useRealTimers();
    });

    it('引落予定日+7日以内のレコードは更新しない', async () => {
      const today = new Date('2025-02-03'); // 2025-01-27の7日後（同日）
      jest.useFakeTimers();
      jest.setSystemTime(today);

      const paymentDate = new Date('2025-01-27');
      const record = createMockRecord(
        'summary-123',
        PaymentStatus.PROCESSING,
        new Date('2025-01-28'),
      );
      const summary = createMockSummary('summary-123', paymentDate);

      statusRepository.findAllByStatus.mockResolvedValue([record]);
      summaryRepository.findByIds.mockResolvedValue([summary]);

      await scheduler.updateProcessingToOverdue();

      expect(updateUseCase.executeAutomatically).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('PROCESSINGレコードが存在しない場合は何もしない', async () => {
      statusRepository.findAllByStatus.mockResolvedValue([]);

      await scheduler.updateProcessingToOverdue();

      expect(updateUseCase.executeAutomatically).not.toHaveBeenCalled();
    });
  });

  describe('executeManually', () => {
    it('手動実行が正常に完了する', async () => {
      statusRepository.findAllByStatus.mockResolvedValue([]);

      const result = await scheduler.executeManually();

      expect(result.success).toBe(0);
      expect(result.failure).toBe(0);
      expect(result.total).toBe(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('実際の更新結果を返す', async () => {
      const record1 = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date('2025-01-01'),
      );
      const summary1 = createMockSummary('summary-123', new Date('2025-01-27'));
      const updatedRecord1 = createMockRecord(
        'summary-123',
        PaymentStatus.PROCESSING,
        new Date('2025-01-24'),
      );

      const today = new Date('2025-01-24');
      jest.useFakeTimers();
      jest.setSystemTime(today);

      statusRepository.findAllByStatus
        .mockResolvedValueOnce([record1]) // PENDING
        .mockResolvedValueOnce([]); // PROCESSING
      summaryRepository.findByIds.mockResolvedValue([summary1]);
      updateUseCase.executeAutomatically.mockResolvedValue(updatedRecord1);

      const result = await scheduler.executeManually();

      expect(result.success).toBe(1);
      expect(result.failure).toBe(0);
      expect(result.total).toBe(1);

      jest.useRealTimers();
    });

    it('エラーが発生した場合は例外を投げる', async () => {
      statusRepository.findAllByStatus.mockRejectedValue(
        new Error('Test error'),
      );

      await expect(scheduler.executeManually()).rejects.toThrow('Test error');
    });
  });
});
