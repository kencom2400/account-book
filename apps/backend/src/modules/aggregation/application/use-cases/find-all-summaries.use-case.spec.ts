import { Test, TestingModule } from '@nestjs/testing';
import { FindAllSummariesUseCase } from './find-all-summaries.use-case';
import { AggregationRepository } from '../../domain/repositories/aggregation.repository.interface';
import { AGGREGATION_REPOSITORY } from '../../aggregation.tokens';
import { MonthlyCardSummary } from '../../domain/entities/monthly-card-summary.entity';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { CategoryAmount } from '../../domain/value-objects/category-amount.vo';

describe('FindAllSummariesUseCase', () => {
  let useCase: FindAllSummariesUseCase;
  let repository: jest.Mocked<AggregationRepository>;

  const mockSummary1 = new MonthlyCardSummary(
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

  const mockSummary2 = new MonthlyCardSummary(
    'summary-456',
    'card-789',
    '三井住友カード',
    '2025-02',
    new Date('2025-02-28'),
    new Date('2025-03-27'),
    60000,
    6,
    [
      new CategoryAmount('食費', 40000, 4),
      new CategoryAmount('交通費', 20000, 2),
    ],
    ['tx-004', 'tx-005', 'tx-006'],
    60000,
    PaymentStatus.PAID,
    new Date('2025-02-01T00:00:00.000Z'),
    new Date('2025-02-01T00:00:00.000Z'),
  );

  beforeEach(async () => {
    repository = {
      findAll: jest.fn(),
    } as unknown as jest.Mocked<AggregationRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllSummariesUseCase,
        {
          provide: AGGREGATION_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get<FindAllSummariesUseCase>(FindAllSummariesUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return all summaries', async () => {
      const mockSummaries = [mockSummary1, mockSummary2];
      repository.findAll.mockResolvedValue(mockSummaries);

      const result = await useCase.execute();

      expect(result).toEqual(mockSummaries);
      expect(repository.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no summaries exist', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result).toEqual([]);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });
});
