import { Test, TestingModule } from '@nestjs/testing';
import { GetPaymentStatusesUseCase } from './get-payment-statuses.use-case';
import type { PaymentStatusRepository } from '../../domain/repositories/payment-status.repository.interface';
import { PAYMENT_STATUS_REPOSITORY } from '../../payment-status.tokens';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { PaymentStatusRecord } from '../../domain/entities/payment-status-record.entity';

describe('GetPaymentStatusesUseCase', () => {
  let useCase: GetPaymentStatusesUseCase;
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
      'system',
      undefined,
      undefined,
      undefined,
      updatedAt,
    );
  };

  beforeEach(async () => {
    const mockPaymentStatusRepository: jest.Mocked<PaymentStatusRepository> = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCardSummaryId: jest.fn(),
      findByCardSummaryIds: jest.fn(),
      findHistoryByCardSummaryId: jest.fn(),
      findAllByStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPaymentStatusesUseCase,
        {
          provide: PAYMENT_STATUS_REPOSITORY,
          useValue: mockPaymentStatusRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetPaymentStatusesUseCase>(GetPaymentStatusesUseCase);
    paymentStatusRepository = module.get(PAYMENT_STATUS_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('正常に複数のステータス記録を一括取得できる', async () => {
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

      paymentStatusRepository.findByCardSummaryIds.mockResolvedValue(
        recordsMap,
      );

      const result = await useCase.execute(['summary-123', 'summary-456']);

      expect(result.size).toBe(2);
      expect(result.get('summary-123')?.status).toBe(PaymentStatus.PENDING);
      expect(result.get('summary-456')?.status).toBe(PaymentStatus.PROCESSING);
      expect(paymentStatusRepository.findByCardSummaryIds).toHaveBeenCalledWith(
        ['summary-123', 'summary-456'],
      );
    });

    it('空の配列を渡した場合は空のMapを返す', async () => {
      const result = await useCase.execute([]);

      expect(result.size).toBe(0);
      expect(
        paymentStatusRepository.findByCardSummaryIds,
      ).not.toHaveBeenCalled();
    });

    it('存在しないIDが含まれていても正常に動作する', async () => {
      const record1 = createMockRecord(
        'summary-123',
        PaymentStatus.PENDING,
        new Date('2025-01-01'),
      );

      const recordsMap = new Map<string, PaymentStatusRecord>();
      recordsMap.set('summary-123', record1);

      paymentStatusRepository.findByCardSummaryIds.mockResolvedValue(
        recordsMap,
      );

      const result = await useCase.execute(['summary-123', 'non-existent']);

      expect(result.size).toBe(1);
      expect(result.get('summary-123')?.status).toBe(PaymentStatus.PENDING);
      expect(result.has('non-existent')).toBe(false);
    });
  });
});
