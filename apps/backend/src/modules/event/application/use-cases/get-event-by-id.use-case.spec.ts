import { Test, TestingModule } from '@nestjs/testing';
import { GetEventByIdUseCase } from './get-event-by-id.use-case';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { EventEntity } from '../../domain/entities/event.entity';
import { EventCategory } from '../../domain/enums/event-category.enum';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';

describe('GetEventByIdUseCase', () => {
  let useCase: GetEventByIdUseCase;
  let eventRepository: jest.Mocked<IEventRepository>;
  let transactionRepository: jest.Mocked<ITransactionRepository>;

  const createEvent = (): EventEntity => {
    return EventEntity.create(
      new Date('2025-04-01'),
      '入学式',
      '長男の小学校入学式',
      EventCategory.EDUCATION,
      ['学校', '入学'],
    );
  };

  const createTransaction = (id: string): TransactionEntity => {
    return new TransactionEntity(
      id,
      new Date('2025-04-01'),
      50000,
      { id: 'cat_1', name: '教育費', type: CategoryType.EXPENSE },
      '入学式関連費用',
      'inst_1',
      'acc_1',
      TransactionStatus.COMPLETED,
      false,
      null,
      new Date(),
      new Date(),
    );
  };

  beforeEach(async () => {
    const mockEventRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByDateRange: jest.fn(),
      delete: jest.fn(),
      findByTransactionId: jest.fn(),
      getTransactionIdsByEventId: jest.fn(),
      linkTransaction: jest.fn(),
      unlinkTransaction: jest.fn(),
    };

    const mockTransactionRepo = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      findAll: jest.fn(),
      findByInstitutionId: jest.fn(),
      findByAccountId: jest.fn(),
      findByDateRange: jest.fn(),
      findByCategoryType: jest.fn(),
      findByCategoryIdsAndDateRange: jest.fn(),
      findByInstitutionIdsAndDateRange: jest.fn(),
      findByMonth: jest.fn(),
      findByYear: jest.fn(),
      findUnreconciledTransfers: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByInstitutionId: jest.fn(),
      deleteAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEventByIdUseCase,
        {
          provide: EVENT_REPOSITORY,
          useValue: mockEventRepo,
        },
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: mockTransactionRepo,
        },
      ],
    }).compile();

    useCase = module.get<GetEventByIdUseCase>(GetEventByIdUseCase);
    eventRepository = module.get(EVENT_REPOSITORY);
    transactionRepository = module.get(TRANSACTION_REPOSITORY);
  });

  describe('execute', () => {
    it('should get event by id with related transactions', async () => {
      // Arrange
      const event = createEvent();
      const transaction1 = createTransaction('txn_1');
      const transaction2 = createTransaction('txn_2');

      eventRepository.findById.mockResolvedValue(event);
      eventRepository.getTransactionIdsByEventId.mockResolvedValue([
        'txn_1',
        'txn_2',
      ]);
      transactionRepository.findByIds.mockResolvedValue([
        transaction1,
        transaction2,
      ]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result.event.id).toBe(event.id);
      expect(result.event.title).toBe('入学式');
      expect(result.relatedTransactions).toHaveLength(2);
      expect(result.relatedTransactions[0].id).toBe('txn_1');
      expect(result.relatedTransactions[1].id).toBe('txn_2');
      expect(eventRepository.findById).toHaveBeenCalledWith(event.id);
      expect(eventRepository.getTransactionIdsByEventId).toHaveBeenCalledWith(
        event.id,
      );
      expect(transactionRepository.findByIds).toHaveBeenCalledWith([
        'txn_1',
        'txn_2',
      ]);
    });

    it('should get event by id without related transactions', async () => {
      // Arrange
      const event = createEvent();
      eventRepository.findById.mockResolvedValue(event);
      eventRepository.getTransactionIdsByEventId.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result.event.id).toBe(event.id);
      expect(result.relatedTransactions).toHaveLength(0);
    });

    it('should throw error when event not found', async () => {
      // Arrange
      eventRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('nonexistent')).rejects.toThrow(
        'Event not found: nonexistent',
      );
    });

    it('should handle missing transactions gracefully', async () => {
      // Arrange
      const event = createEvent();
      eventRepository.findById.mockResolvedValue(event);
      eventRepository.getTransactionIdsByEventId.mockResolvedValue(['txn_1']);
      transactionRepository.findByIds.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result.relatedTransactions).toHaveLength(0);
    });
  });
});
