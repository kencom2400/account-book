import { Test, TestingModule } from '@nestjs/testing';
import { DeleteEventUseCase } from './delete-event.use-case';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EventEntity } from '../../domain/entities/event.entity';
import { EventCategory } from '../../domain/enums/event-category.enum';

describe('DeleteEventUseCase', () => {
  let useCase: DeleteEventUseCase;
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
        DeleteEventUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepo,
        },
      ],
    }).compile();

    useCase = module.get<DeleteEventUseCase>(DeleteEventUseCase);
    repository = module.get(EVENT_REPOSITORY);
  });

  describe('execute', () => {
    it('should delete an existing event', async () => {
      // Arrange
      const event = createEvent();
      repository.findById.mockResolvedValue(event);
      repository.delete.mockResolvedValue(undefined);

      // Act
      await useCase.execute(event.id);

      // Assert
      expect(repository.findById).toHaveBeenCalledWith(event.id);
      expect(repository.delete).toHaveBeenCalledWith(event.id);
    });

    it('should throw error when event not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('nonexistent')).rejects.toThrow(
        'Event with id nonexistent not found',
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
