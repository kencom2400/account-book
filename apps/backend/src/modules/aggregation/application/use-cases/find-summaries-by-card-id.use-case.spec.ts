import { Test, TestingModule } from '@nestjs/testing';
import { MonthlyCardSummary } from '../../domain/entities/monthly-card-summary.entity';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { CategoryAmount } from '../../domain/value-objects/category-amount.vo';
import { AggregationRepository } from '../../domain/repositories/aggregation.repository.interface';
import { AGGREGATION_REPOSITORY } from '../../aggregation.tokens';
import { FindSummariesByCardIdUseCase } from './find-summaries-by-card-id.use-case';

describe('FindSummariesByCardIdUseCase', () => {
  let useCase: FindSummariesByCardIdUseCase;
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
    repository = {
      findAllByCardId: jest.fn(),
    } as unknown as jest.Mocked<AggregationRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindSummariesByCardIdUseCase,
        {
          provide: AGGREGATION_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get<FindSummariesByCardIdUseCase>(
      FindSummariesByCardIdUseCase,
    );
  });

  describe('execute', () => {
    it('カードIDで月別集計一覧を取得できる', async () => {
      repository.findAllByCardId.mockResolvedValue([mockSummary]);

      const result = await useCase.execute('card-456');

      expect(repository.findAllByCardId).toHaveBeenCalledWith('card-456');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(MonthlyCardSummary);
      expect(result[0].id).toBe('summary-123');
      expect(result[0].cardId).toBe('card-456');
    });

    it('該当するデータがない場合、空配列を返す', async () => {
      repository.findAllByCardId.mockResolvedValue([]);

      const result = await useCase.execute('non-existent-card');

      expect(result).toHaveLength(0);
    });

    it('複数のサマリーを取得できる', async () => {
      const mockSummary2 = new MonthlyCardSummary(
        'summary-124',
        'card-456',
        '楽天カード',
        '2025-02',
        new Date('2025-02-28'),
        new Date('2025-03-27'),
        60000,
        6,
        [new CategoryAmount('食費', 60000, 6)],
        ['tx-004', 'tx-005', 'tx-006'],
        60000,
        PaymentStatus.PAID,
        new Date('2025-02-01T00:00:00.000Z'),
        new Date('2025-02-01T00:00:00.000Z'),
      );

      repository.findAllByCardId.mockResolvedValue([mockSummary, mockSummary2]);

      const result = await useCase.execute('card-456');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('summary-123');
      expect(result[1].id).toBe('summary-124');
    });
  });
});
