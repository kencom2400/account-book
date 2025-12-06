import { Test, TestingModule } from '@nestjs/testing';
import { GetEventsByDateRangeUseCase } from './get-events-by-date-range.use-case';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EventEntity } from '../../domain/entities/event.entity';
import { EventCategory } from '../../domain/enums/event-category.enum';

describe('GetEventsByDateRangeUseCase', () => {
  let useCase: GetEventsByDateRangeUseCase;
  let repository: jest.Mocked<IEventRepository>;

  beforeEach(async () => {
    const mockRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByDateRange: jest.fn(),
      delete: jest.fn(),
      findByTransactionId: jest.fn(),
      getTransactionIdsByEventId: jest.fn(),
      linkTransaction: jest.fn(),
      unlinkTransaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEventsByDateRangeUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepo,
        },
      ],
    }).compile();

    useCase = module.get<GetEventsByDateRangeUseCase>(
      GetEventsByDateRangeUseCase,
    );
    repository = module.get(EVENT_REPOSITORY);
  });

  describe('execute', () => {
    it('should get events by date range', async () => {
      // Arrange
      const startDate = new Date('2025-04-01');
      const endDate = new Date('2025-04-30');

      const event1 = EventEntity.create(
        new Date('2025-04-01'),
        '入学式',
        '長男の小学校入学式',
        EventCategory.EDUCATION,
        ['学校', '入学'],
      );

      const event2 = EventEntity.create(
        new Date('2025-04-15'),
        '旅行',
        '家族旅行',
        EventCategory.TRAVEL,
        ['旅行', '家族'],
      );

      repository.findByDateRange.mockResolvedValue([event1, event2]);

      // Act
      const result = await useCase.execute(startDate, endDate);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('入学式');
      expect(result[1].title).toBe('旅行');
      expect(repository.findByDateRange).toHaveBeenCalledWith(
        startDate,
        endDate,
      );
    });

    it('should return empty array when no events found', async () => {
      // Arrange
      const startDate = new Date('2025-04-01');
      const endDate = new Date('2025-04-30');
      repository.findByDateRange.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(startDate, endDate);

      // Assert
      expect(result).toHaveLength(0);
    });
  });
});
