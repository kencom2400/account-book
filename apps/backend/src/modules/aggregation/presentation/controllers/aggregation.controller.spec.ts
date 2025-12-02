import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MonthlyCardSummary } from '../../domain/entities/monthly-card-summary.entity';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { CategoryAmount } from '../../domain/value-objects/category-amount.vo';
import { AggregateCardTransactionsUseCase } from '../../application/use-cases/aggregate-card-transactions.use-case';
import { FindAllSummariesUseCase } from '../../application/use-cases/find-all-summaries.use-case';
import { FindSummaryByIdUseCase } from '../../application/use-cases/find-summary-by-id.use-case';
import { FindSummariesByCardIdUseCase } from '../../application/use-cases/find-summaries-by-card-id.use-case';
import { DeleteSummaryUseCase } from '../../application/use-cases/delete-summary.use-case';
import { AggregationController } from './aggregation.controller';
import { AggregateCardTransactionsRequestDto } from '../dto/aggregate-card-transactions.dto';

describe('AggregationController', () => {
  let controller: AggregationController;
  let aggregateUseCase: jest.Mocked<AggregateCardTransactionsUseCase>;
  let findAllUseCase: jest.Mocked<FindAllSummariesUseCase>;
  let findByIdUseCase: jest.Mocked<FindSummaryByIdUseCase>;
  let findByCardIdUseCase: jest.Mocked<FindSummariesByCardIdUseCase>;
  let deleteUseCase: jest.Mocked<DeleteSummaryUseCase>;

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
    aggregateUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AggregateCardTransactionsUseCase>;

    findAllUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FindAllSummariesUseCase>;

    findByIdUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FindSummaryByIdUseCase>;

    findByCardIdUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FindSummariesByCardIdUseCase>;

    deleteUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<DeleteSummaryUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AggregationController],
      providers: [
        {
          provide: AggregateCardTransactionsUseCase,
          useValue: aggregateUseCase,
        },
        {
          provide: FindAllSummariesUseCase,
          useValue: findAllUseCase,
        },
        {
          provide: FindSummaryByIdUseCase,
          useValue: findByIdUseCase,
        },
        {
          provide: FindSummariesByCardIdUseCase,
          useValue: findByCardIdUseCase,
        },
        {
          provide: DeleteSummaryUseCase,
          useValue: deleteUseCase,
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

      aggregateUseCase.execute.mockResolvedValue([mockSummary]);

      const result = await controller.aggregate(dto);

      expect(aggregateUseCase.execute).toHaveBeenCalledWith(
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

      aggregateUseCase.execute.mockResolvedValue([mockSummary]);

      const result = await controller.aggregate(dto);

      expect(result.data[0].closingDate).toBe('2025-01-31T00:00:00.000Z');
      expect(result.data[0].paymentDate).toBe('2025-02-27T00:00:00.000Z');
      expect(result.data[0].createdAt).toBe('2025-01-01T00:00:00.000Z');
      expect(result.data[0].updatedAt).toBe('2025-01-01T00:00:00.000Z');
    });
  });

  describe('GET /api/aggregation/card/monthly', () => {
    it('月別集計の一覧を取得できる', async () => {
      findAllUseCase.execute.mockResolvedValue([mockSummary]);

      const result = await controller.findAll();

      expect(findAllUseCase.execute).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('summary-123');
    });

    it('リスト項目DTOに必要なフィールドのみが含まれる', async () => {
      findAllUseCase.execute.mockResolvedValue([mockSummary]);

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

  describe('GET /api/aggregation/card/monthly/card/:cardId', () => {
    it('カードIDで月別集計の詳細を一括取得できる', async () => {
      findByCardIdUseCase.execute.mockResolvedValue([mockSummary]);

      const result = await controller.findByCardId('card-456');

      expect(findByCardIdUseCase.execute).toHaveBeenCalledWith('card-456');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('summary-123');
      expect(result.data[0]).toHaveProperty('categoryBreakdown');
      expect(result.data[0]).toHaveProperty('transactionIds');
      expect(result.data[0]).toHaveProperty('closingDate');
    });

    it('詳細レスポンスDTOにすべてのフィールドが含まれる', async () => {
      findByCardIdUseCase.execute.mockResolvedValue([mockSummary]);

      const result = await controller.findByCardId('card-456');

      const item = result.data[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('cardId');
      expect(item).toHaveProperty('cardName');
      expect(item).toHaveProperty('billingMonth');
      expect(item).toHaveProperty('closingDate');
      expect(item).toHaveProperty('paymentDate');
      expect(item).toHaveProperty('totalAmount');
      expect(item).toHaveProperty('transactionCount');
      expect(item).toHaveProperty('categoryBreakdown');
      expect(item).toHaveProperty('transactionIds');
      expect(item).toHaveProperty('netPaymentAmount');
      expect(item).toHaveProperty('status');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
    });
  });

  describe('GET /api/aggregation/card/monthly/:id', () => {
    it('月別集計の詳細を取得できる', async () => {
      findByIdUseCase.execute.mockResolvedValue(mockSummary);

      const result = await controller.findOne('summary-123');

      expect(findByIdUseCase.execute).toHaveBeenCalledWith('summary-123');
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('summary-123');
      expect(result.data.categoryBreakdown).toHaveLength(2);
      expect(result.data.transactionIds).toHaveLength(3);
    });

    it('集計データが存在しない場合、NotFoundExceptionをスローする', async () => {
      findByIdUseCase.execute.mockRejectedValue(
        new NotFoundException('Monthly card summary not found: non-existent'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('DELETE /api/aggregation/card/monthly/:id', () => {
    it('月別集計を削除できる', async () => {
      deleteUseCase.execute.mockResolvedValue(undefined);

      await controller.delete('summary-123');

      expect(deleteUseCase.execute).toHaveBeenCalledWith('summary-123');
    });

    it('集計データが存在しない場合、NotFoundExceptionをスローする', async () => {
      deleteUseCase.execute.mockRejectedValue(
        new NotFoundException('Monthly card summary not found: non-existent'),
      );

      await expect(controller.delete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
