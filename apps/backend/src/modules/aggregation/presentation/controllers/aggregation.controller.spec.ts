import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MonthlyCardSummary } from '../../domain/entities/monthly-card-summary.entity';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { CategoryAmount } from '../../domain/value-objects/category-amount.vo';
import { AggregationRepository } from '../../domain/repositories/aggregation.repository.interface';
import { AggregateCardTransactionsUseCase } from '../../application/use-cases/aggregate-card-transactions.use-case';
import { AggregationController } from './aggregation.controller';
import { AggregateCardTransactionsRequestDto } from '../dto/aggregate-card-transactions.dto';

describe('AggregationController', () => {
  let controller: AggregationController;
  let useCase: jest.Mocked<AggregateCardTransactionsUseCase>;
  let repository: jest.Mocked<AggregationRepository>;

  const mockSummary = new MonthlyCardSummary(
    'summary-123',
    'card-456',
    '楽天カード',
    '2025-01',
    new Date('2025-01-31'),
    new Date('2025-02-27'),
    50000,
    5,
    [
      new CategoryAmount('食費', 30000, 3),
      new CategoryAmount('交通費', 20000, 2),
    ],
    ['tx-001', 'tx-002', 'tx-003'],
    50000,
    PaymentStatus.PENDING,
    new Date('2025-01-01T00:00:00.000Z'),
    new Date('2025-01-01T00:00:00.000Z'),
  );

  beforeEach(async () => {
    useCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AggregateCardTransactionsUseCase>;

    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCardAndMonth: jest.fn(),
      findByCard: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<AggregationRepository>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AggregationController],
      providers: [
        {
          provide: AggregateCardTransactionsUseCase,
          useValue: useCase,
        },
        {
          provide: 'AggregationRepository',
          useValue: repository,
        },
      ],
    }).compile();

    controller = module.get<AggregationController>(AggregationController);
  });

  describe('POST /api/aggregation/card/monthly', () => {
    it('カード利用明細を月別に集計できる', async () => {
      const dto: AggregateCardTransactionsRequestDto = {
        cardId: 'card-456',
        startMonth: '2025-01',
        endMonth: '2025-03',
      };

      useCase.execute.mockResolvedValue([mockSummary]);

      const result = await controller.aggregate(dto);

      expect(useCase.execute).toHaveBeenCalledWith(
        'card-456',
        '2025-01',
        '2025-03',
      );
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('summary-123');
      expect(result.data[0].billingMonth).toBe('2025-01');
      expect(result.data[0].totalAmount).toBe(50000);
      expect(result.data[0].categoryBreakdown).toHaveLength(2);
    });

    it('レスポンスDTOが正しく変換される', async () => {
      const dto: AggregateCardTransactionsRequestDto = {
        cardId: 'card-456',
        startMonth: '2025-01',
        endMonth: '2025-01',
      };

      useCase.execute.mockResolvedValue([mockSummary]);

      const result = await controller.aggregate(dto);

      expect(result.data[0].closingDate).toBe('2025-01-31T00:00:00.000Z');
      expect(result.data[0].paymentDate).toBe('2025-02-27T00:00:00.000Z');
      expect(result.data[0].createdAt).toBe('2025-01-01T00:00:00.000Z');
      expect(result.data[0].updatedAt).toBe('2025-01-01T00:00:00.000Z');
    });
  });

  describe('GET /api/aggregation/card/monthly', () => {
    it('月別集計の一覧を取得できる', async () => {
      repository.findAll.mockResolvedValue([mockSummary]);

      const result = await controller.findAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('summary-123');
    });

    it('リスト項目DTOに必要なフィールドのみが含まれる', async () => {
      repository.findAll.mockResolvedValue([mockSummary]);

      const result = await controller.findAll();

      const item = result.data[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('cardId');
      expect(item).toHaveProperty('cardName');
      expect(item).toHaveProperty('billingMonth');
      expect(item).toHaveProperty('paymentDate');
      expect(item).toHaveProperty('totalAmount');
      expect(item).toHaveProperty('transactionCount');
      expect(item).toHaveProperty('netPaymentAmount');
      expect(item).toHaveProperty('status');

      // リスト項目DTOには含まれないフィールド
      expect(item).not.toHaveProperty('closingDate');
      expect(item).not.toHaveProperty('categoryBreakdown');
      expect(item).not.toHaveProperty('transactionIds');
      expect(item).not.toHaveProperty('createdAt');
      expect(item).not.toHaveProperty('updatedAt');
    });
  });

  describe('GET /api/aggregation/card/monthly/:id', () => {
    it('月別集計の詳細を取得できる', async () => {
      repository.findById.mockResolvedValue(mockSummary);

      const result = await controller.findOne('summary-123');

      expect(repository.findById).toHaveBeenCalledWith('summary-123');
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('summary-123');
      expect(result.data.categoryBreakdown).toHaveLength(2);
      expect(result.data.transactionIds).toHaveLength(3);
    });

    it('集計データが存在しない場合、NotFoundExceptionをスローする', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.findOne('non-existent')).rejects.toThrow(
        'Monthly card summary not found',
      );
    });
  });

  describe('DELETE /api/aggregation/card/monthly/:id', () => {
    it('月別集計を削除できる', async () => {
      repository.findById.mockResolvedValue(mockSummary);
      repository.delete.mockResolvedValue(undefined);

      await controller.delete('summary-123');

      expect(repository.findById).toHaveBeenCalledWith('summary-123');
      expect(repository.delete).toHaveBeenCalledWith('summary-123');
    });

    it('集計データが存在しない場合、NotFoundExceptionをスローする', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(controller.delete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.delete('non-existent')).rejects.toThrow(
        'Monthly card summary not found',
      );
    });
  });
});
