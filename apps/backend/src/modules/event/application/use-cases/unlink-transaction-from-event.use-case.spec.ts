import { Test, TestingModule } from '@nestjs/testing';
import { UnlinkTransactionFromEventUseCase } from './unlink-transaction-from-event.use-case';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EventEntity } from '../../domain/entities/event.entity';
import { EventCategory } from '../../domain/enums/event-category.enum';

describe('UnlinkTransactionFromEventUseCase', () => {
  let useCase: UnlinkTransactionFromEventUseCase;
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
        UnlinkTransactionFromEventUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockRepo,
        },
      ],
    }).compile();

    useCase = module.get<UnlinkTransactionFromEventUseCase>(
      UnlinkTransactionFromEventUseCase,
    );
    repository = module.get(EVENT_REPOSITORY);
  });

  describe('execute', () => {
    it('should unlink transaction from event', async () => {
      // Arrange
      const event = createEvent();
      const transactionId = 'txn_1';

      repository.findById.mockResolvedValue(event);
      repository.getTransactionIdsByEventId.mockResolvedValue([transactionId]);
      repository.unlinkTransaction.mockResolvedValue(undefined);

      // Act
      await useCase.execute(event.id, transactionId);

      // Assert
      expect(repository.findById).toHaveBeenCalledWith(event.id);
      expect(repository.getTransactionIdsByEventId).toHaveBeenCalledWith(
        event.id,
      );
      expect(repository.unlinkTransaction).toHaveBeenCalledWith(
        event.id,
        transactionId,
      );
    });

    it('should not unlink if not linked', async () => {
      // Arrange
      const event = createEvent();
      const transactionId = 'txn_1';

      repository.findById.mockResolvedValue(event);
      repository.getTransactionIdsByEventId.mockResolvedValue([]);

      // Act
      await useCase.execute(event.id, transactionId);

      // Assert
      expect(repository.unlinkTransaction).not.toHaveBeenCalled();
    });

    it('should throw error when event not found', async () => {
      // Arrange
      repository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('nonexistent', 'txn_1')).rejects.toThrow(
        'Event with id nonexistent not found',
      );
      expect(repository.unlinkTransaction).not.toHaveBeenCalled();
    });
  });
});
