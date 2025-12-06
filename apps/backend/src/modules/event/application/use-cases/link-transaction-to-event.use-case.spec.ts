import { Test, TestingModule } from '@nestjs/testing';
import { LinkTransactionToEventUseCase } from './link-transaction-to-event.use-case';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { EventEntity } from '../../domain/entities/event.entity';
import { EventCategory } from '../../domain/enums/event-category.enum';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';

describe('LinkTransactionToEventUseCase', () => {
  let useCase: LinkTransactionToEventUseCase;
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
        LinkTransactionToEventUseCase,
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

    useCase = module.get<LinkTransactionToEventUseCase>(
      LinkTransactionToEventUseCase,
    );
    eventRepository = module.get(EVENT_REPOSITORY);
    transactionRepository = module.get(TRANSACTION_REPOSITORY);
  });

  describe('execute', () => {
    it('should link transaction to event', async () => {
      // Arrange
      const event = createEvent();
      const transaction = createTransaction('txn_1');

      eventRepository.findById.mockResolvedValue(event);
      transactionRepository.findById.mockResolvedValue(transaction);
      eventRepository.getTransactionIdsByEventId.mockResolvedValue([]);
      eventRepository.linkTransaction.mockResolvedValue(undefined);

      // Act
      await useCase.execute(event.id, transaction.id);

      // Assert
      expect(eventRepository.findById).toHaveBeenCalledWith(event.id);
      expect(transactionRepository.findById).toHaveBeenCalledWith(
        transaction.id,
      );
      expect(eventRepository.linkTransaction).toHaveBeenCalledWith(
        event.id,
        transaction.id,
      );
    });

    it('should call linkTransaction even if already linked (duplicate check is in repository)', async () => {
      // Arrange
      const event = createEvent();
      const transaction = createTransaction('txn_1');

      eventRepository.findById.mockResolvedValue(event);
      transactionRepository.findById.mockResolvedValue(transaction);
      // 重複チェックはリポジトリレベルで行われるため、UseCaseは常にlinkTransactionを呼び出す
      eventRepository.linkTransaction.mockResolvedValue(undefined);

      // Act
      await useCase.execute(event.id, transaction.id);

      // Assert
      // リポジトリレベルで重複チェックが行われるため、UseCaseは常にlinkTransactionを呼び出す
      expect(eventRepository.linkTransaction).toHaveBeenCalledWith(
        event.id,
        transaction.id,
      );
    });

    it('should throw error when event not found', async () => {
      // Arrange
      eventRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('nonexistent', 'txn_1')).rejects.toThrow(
        'Event not found: nonexistent',
      );
      expect(eventRepository.linkTransaction).not.toHaveBeenCalled();
    });

    it('should throw error when transaction not found', async () => {
      // Arrange
      const event = createEvent();
      eventRepository.findById.mockResolvedValue(event);
      transactionRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(event.id, 'nonexistent')).rejects.toThrow(
        'Transaction with id nonexistent not found',
      );
      expect(eventRepository.linkTransaction).not.toHaveBeenCalled();
    });
  });
});
