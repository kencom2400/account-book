import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteSummaryUseCase } from './delete-summary.use-case';
import { AggregationRepository } from '../../domain/repositories/aggregation.repository.interface';
import { AGGREGATION_REPOSITORY } from '../../aggregation.tokens';
import { MonthlyCardSummary } from '../../domain/entities/monthly-card-summary.entity';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { CategoryAmount } from '../../domain/value-objects/category-amount.vo';

describe('DeleteSummaryUseCase', () => {
  let useCase: DeleteSummaryUseCase;
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
      findById: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<AggregationRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteSummaryUseCase,
        {
          provide: AGGREGATION_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteSummaryUseCase>(DeleteSummaryUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should delete summary when it exists', async () => {
      const id = 'summary-123';
      repository.findById.mockResolvedValue(mockSummary);
      repository.delete.mockResolvedValue(undefined);

      await useCase.execute(id);

      expect(repository.findById).toHaveBeenCalledWith(id);
      expect(repository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when summary does not exist', async () => {
      const id = 'non-existent-id';
      repository.findById.mockResolvedValue(null);

      await expect(useCase.execute(id)).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith(id);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
