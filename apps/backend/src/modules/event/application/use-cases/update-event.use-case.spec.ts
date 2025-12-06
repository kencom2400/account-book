import { Test, TestingModule } from '@nestjs/testing';
import { UpdateEventUseCase } from './update-event.use-case';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EventEntity } from '../../domain/entities/event.entity';
import { EventCategory } from '../../domain/enums/event-category.enum';

describe('UpdateEventUseCase', () => {
  let useCase: UpdateEventUseCase;
  let repository: jest.Mocked<IEventRepository>;

  const createEvent = (): EventEntity => {
    return EventEntity.create(
      new Date('2025-04-01'),
      '入学式',
      '長男の小学校入学式',
      EventCategory.EDUCATION,
      ['学校', '入学'],
    );
  };

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
        UpdateEventUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepo,
        },
      ],
    }).compile();

    useCase = module.get<UpdateEventUseCase>(UpdateEventUseCase);
    repository = module.get(EVENT_REPOSITORY);
  });

  describe('execute', () => {
    it('should update event title', async () => {
      // Arrange
      const event = createEvent();
      repository.findById.mockResolvedValue(event);

      const updatedEvent = event.update('新しいタイトル');
      repository.save.mockResolvedValue(updatedEvent);

      // Act
      const result = await useCase.execute(event.id, {
        title: '新しいタイトル',
      });

      // Assert
      expect(result.title).toBe('新しいタイトル');
      expect(repository.findById).toHaveBeenCalledWith(event.id);
      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('should update event date', async () => {
      // Arrange
      const event = createEvent();
      repository.findById.mockResolvedValue(event);

      const newDate = new Date('2025-05-01');
      const updatedEvent = event.update(undefined, newDate);
      repository.save.mockResolvedValue(updatedEvent);

      // Act
      const result = await useCase.execute(event.id, { date: newDate });

      // Assert
      expect(result.date).toEqual(newDate);
    });

    it('should update event category', async () => {
      // Arrange
      const event = createEvent();
      repository.findById.mockResolvedValue(event);

      const updatedEvent = event.update(
        undefined,
        undefined,
        undefined,
        EventCategory.TRAVEL,
      );
      repository.save.mockResolvedValue(updatedEvent);

      // Act
      const result = await useCase.execute(event.id, {
        category: EventCategory.TRAVEL,
      });

      // Assert
      expect(result.category).toBe(EventCategory.TRAVEL);
    });

    it('should update event tags', async () => {
      // Arrange
      const event = createEvent();
      repository.findById.mockResolvedValue(event);

      const updatedEvent = event
        .removeTag('学校')
        .removeTag('入学')
        .addTag('新タグ1')
        .addTag('新タグ2');
      repository.save.mockResolvedValue(updatedEvent);

      // Act
      const result = await useCase.execute(event.id, {
        tags: ['新タグ1', '新タグ2'],
      });

      // Assert
      expect(result.tags).toEqual(['新タグ1', '新タグ2']);
    });

    it('should throw error when event not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute('nonexistent', { title: '新しいタイトル' }),
      ).rejects.toThrow('Event not found: nonexistent');
    });
  });
});
