import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetPaymentStatusHistoryUseCase } from './get-payment-status-history.use-case';
import type { PaymentStatusRepository } from '../../domain/repositories/payment-status.repository.interface';
import { PAYMENT_STATUS_REPOSITORY } from '../../payment-status.tokens';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { PaymentStatusHistory } from '../../domain/entities/payment-status-history.entity';
import { PaymentStatusRecord } from '../../domain/entities/payment-status-record.entity';

describe('GetPaymentStatusHistoryUseCase', () => {
  let useCase: GetPaymentStatusHistoryUseCase;
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
      findHistoryByCardSummaryId: jest.fn(),
      findAllByStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPaymentStatusHistoryUseCase,
        {
          provide: PAYMENT_STATUS_REPOSITORY,
          useValue: mockPaymentStatusRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetPaymentStatusHistoryUseCase>(
      GetPaymentStatusHistoryUseCase,
    );
    paymentStatusRepository = module.get(PAYMENT_STATUS_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('正常にステータス履歴を取得できる', async () => {
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

      paymentStatusRepository.findHistoryByCardSummaryId.mockResolvedValue(
        history,
      );

      const result = await useCase.execute('summary-123');

      expect(result.cardSummaryId).toBe('summary-123');
      expect(result.statusChanges).toHaveLength(2);
      expect(
        paymentStatusRepository.findHistoryByCardSummaryId,
      ).toHaveBeenCalledWith('summary-123');
    });

    it('ステータス履歴が存在しない場合はエラーを投げる', async () => {
      const emptyHistory = PaymentStatusHistory.createEmpty('summary-123');
      paymentStatusRepository.findHistoryByCardSummaryId.mockResolvedValue(
        emptyHistory,
      );

      await expect(useCase.execute('summary-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
