import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdatePaymentStatusUseCase } from './update-payment-status.use-case';
import type { PaymentStatusRepository } from '../../domain/repositories/payment-status.repository.interface';
import { PAYMENT_STATUS_REPOSITORY } from '../../payment-status.tokens';
import type { AggregationRepository } from '../../../aggregation/domain/repositories/aggregation.repository.interface';
import { AGGREGATION_REPOSITORY } from '../../../aggregation/aggregation.tokens';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { PaymentStatusRecord } from '../../domain/entities/payment-status-record.entity';
import { MonthlyCardSummary } from '../../../aggregation/domain/entities/monthly-card-summary.entity';
import { CategoryAmount } from '../../../aggregation/domain/value-objects/category-amount.vo';

describe('UpdatePaymentStatusUseCase', () => {
  let useCase: UpdatePaymentStatusUseCase;
  let paymentStatusRepository: jest.Mocked<PaymentStatusRepository>;
  let aggregationRepository: jest.Mocked<AggregationRepository>;

  const mockSummary = new MonthlyCardSummary(
    'summary-123',
    'card-456',
    '楽天カード',
    '2025-01',
    new Date('2025-01-31'),
    new Date('2025-02-27'),
    50000,
    5,
    [new CategoryAmount('食費', 30000, 3)],
    ['tx-001', 'tx-002'],
    50000,
    PaymentStatus.PENDING,
    new Date('2025-01-01'),
    new Date('2025-01-01'),
  );

  const mockRecord = PaymentStatusRecord.createInitial(
    'summary-123',
    PaymentStatus.PENDING,
    'system',
    '初期ステータス',
  );

  beforeEach(async () => {
    const mockPaymentStatusRepository: jest.Mocked<PaymentStatusRepository> = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCardSummaryId: jest.fn(),
      findHistoryByCardSummaryId: jest.fn(),
      findAllByStatus: jest.fn(),
    };

    const mockAggregationRepository: jest.Mocked<AggregationRepository> = {
      save: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByCardAndMonth: jest.fn(),
      findByCard: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePaymentStatusUseCase,
        {
          provide: PAYMENT_STATUS_REPOSITORY,
          useValue: mockPaymentStatusRepository,
        },
        {
          provide: AGGREGATION_REPOSITORY,
          useValue: mockAggregationRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdatePaymentStatusUseCase>(
      UpdatePaymentStatusUseCase,
    );
    paymentStatusRepository = module.get(PAYMENT_STATUS_REPOSITORY);
    aggregationRepository = module.get(AGGREGATION_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeManually', () => {
    it('正常にステータスを更新できる', async () => {
      aggregationRepository.findById.mockResolvedValue(mockSummary);
      paymentStatusRepository.findByCardSummaryId.mockResolvedValue(mockRecord);

      const newRecord = mockRecord.transitionTo(
        PaymentStatus.MANUAL_CONFIRMED,
        'user',
        '手動で確認完了',
        'メモ',
      );
      paymentStatusRepository.save.mockResolvedValue(newRecord);

      const result = await useCase.executeManually(
        'summary-123',
        PaymentStatus.MANUAL_CONFIRMED,
        'user',
        'メモ',
      );

      expect(result.status).toBe(PaymentStatus.MANUAL_CONFIRMED);
      expect(result.updatedBy).toBe('user');
      expect(result.notes).toBe('メモ');
      expect(paymentStatusRepository.save).toHaveBeenCalled();
    });

    it('請求データが見つからない場合はエラーを投げる', async () => {
      aggregationRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.executeManually(
          'summary-123',
          PaymentStatus.MANUAL_CONFIRMED,
          'user',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('ステータス記録が存在しない場合は初期ステータスを作成', async () => {
      aggregationRepository.findById.mockResolvedValue(mockSummary);
      paymentStatusRepository.findByCardSummaryId.mockResolvedValue(null);

      const newRecord = PaymentStatusRecord.createInitial(
        'summary-123',
        PaymentStatus.PENDING,
        'system',
        '初期ステータス',
      ).transitionTo(PaymentStatus.MANUAL_CONFIRMED, 'user', '手動で確認完了');

      paymentStatusRepository.save.mockResolvedValue(newRecord);

      const result = await useCase.executeManually(
        'summary-123',
        PaymentStatus.MANUAL_CONFIRMED,
        'user',
      );

      expect(result.status).toBe(PaymentStatus.MANUAL_CONFIRMED);
      expect(paymentStatusRepository.save).toHaveBeenCalled();
    });

    it('無効な遷移の場合はBadRequestExceptionを投げる', async () => {
      aggregationRepository.findById.mockResolvedValue(mockSummary);
      paymentStatusRepository.findByCardSummaryId.mockResolvedValue(mockRecord);

      await expect(
        useCase.executeManually('summary-123', PaymentStatus.PAID, 'user'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('executeAutomatically', () => {
    it('正常に自動ステータス更新ができる', async () => {
      aggregationRepository.findById.mockResolvedValue(mockSummary);
      paymentStatusRepository.findByCardSummaryId.mockResolvedValue(mockRecord);

      const newRecord = mockRecord.transitionTo(
        PaymentStatus.PROCESSING,
        'system',
        '引落予定日の3日前',
        undefined,
        'reconciliation-123',
      );
      paymentStatusRepository.save.mockResolvedValue(newRecord);

      const result = await useCase.executeAutomatically(
        'summary-123',
        PaymentStatus.PROCESSING,
        '引落予定日の3日前',
        'reconciliation-123',
      );

      expect(result.status).toBe(PaymentStatus.PROCESSING);
      expect(result.updatedBy).toBe('system');
      expect(result.reconciliationId).toBe('reconciliation-123');
      expect(paymentStatusRepository.save).toHaveBeenCalled();
    });
  });
});
