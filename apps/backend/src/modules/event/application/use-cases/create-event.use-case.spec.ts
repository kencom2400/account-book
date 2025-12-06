import { Test, TestingModule } from '@nestjs/testing';
import { CreateEventUseCase } from './create-event.use-case';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EventEntity } from '../../domain/entities/event.entity';
import { EventCategory } from '../../domain/enums/event-category.enum';

describe('CreateEventUseCase', () => {
  let useCase: CreateEventUseCase;
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
        CreateEventUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepo,
        },
      ],
    }).compile();

    useCase = module.get<CreateEventUseCase>(CreateEventUseCase);
    repository = module.get(EVENT_REPOSITORY);
  });

  describe('execute', () => {
    it('should create a new event', async () => {
      // Arrange
      const dto = {
        date: new Date('2025-04-01'),
        title: '入学式',
        description: '長男の小学校入学式',
        category: EventCategory.EDUCATION,
        tags: ['学校', '入学'],
      };

      const savedEvent = EventEntity.create(
        dto.date,
        dto.title,
        dto.description,
        dto.category,
        dto.tags,
      );

      repository.save.mockResolvedValue(savedEvent);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toBeInstanceOf(EventEntity);
      expect(result.title).toBe('入学式');
      expect(result.category).toBe(EventCategory.EDUCATION);
      expect(result.tags).toEqual(['学校', '入学']);
      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('should create event with null description', async () => {
      // Arrange
      const dto = {
        date: new Date('2025-04-01'),
        title: '入学式',
        description: null,
        category: EventCategory.EDUCATION,
        tags: [],
      };

      const savedEvent = EventEntity.create(
        dto.date,
        dto.title,
        dto.description,
        dto.category,
        dto.tags,
      );

      repository.save.mockResolvedValue(savedEvent);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.description).toBeNull();
      expect(result.tags).toEqual([]);
    });

    it('should create event without tags', async () => {
      // Arrange
      const dto = {
        date: new Date('2025-04-01'),
        title: '入学式',
        description: '長男の小学校入学式',
        category: EventCategory.EDUCATION,
      };

      const savedEvent = EventEntity.create(
        dto.date,
        dto.title,
        dto.description ?? null,
        dto.category,
        [],
      );

      repository.save.mockResolvedValue(savedEvent);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.tags).toEqual([]);
    });
  });
});
