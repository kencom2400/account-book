import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { CreateEventUseCase } from '../../application/use-cases/create-event.use-case';
import { UpdateEventUseCase } from '../../application/use-cases/update-event.use-case';
import { DeleteEventUseCase } from '../../application/use-cases/delete-event.use-case';
import { GetEventByIdUseCase } from '../../application/use-cases/get-event-by-id.use-case';
import { GetEventsByDateRangeUseCase } from '../../application/use-cases/get-events-by-date-range.use-case';
import { LinkTransactionToEventUseCase } from '../../application/use-cases/link-transaction-to-event.use-case';
import { UnlinkTransactionFromEventUseCase } from '../../application/use-cases/unlink-transaction-from-event.use-case';
import { SuggestRelatedTransactionsUseCase } from '../../application/use-cases/suggest-related-transactions.use-case';
import { GetEventFinancialSummaryUseCase } from '../../application/use-cases/get-event-financial-summary.use-case';
import { EventEntity } from '../../domain/entities/event.entity';
import { EventCategory } from '../../domain/enums/event-category.enum';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';
import { EventNotFoundException } from '../../domain/errors/event.errors';

describe('EventController', () => {
  let controller: EventController;
  let createEventUseCase: jest.Mocked<CreateEventUseCase>;
  let updateEventUseCase: jest.Mocked<UpdateEventUseCase>;
  let deleteEventUseCase: jest.Mocked<DeleteEventUseCase>;
  let getEventByIdUseCase: jest.Mocked<GetEventByIdUseCase>;
  let getEventsByDateRangeUseCase: jest.Mocked<GetEventsByDateRangeUseCase>;
  let linkTransactionToEventUseCase: jest.Mocked<LinkTransactionToEventUseCase>;
  let unlinkTransactionFromEventUseCase: jest.Mocked<UnlinkTransactionFromEventUseCase>;
  let suggestRelatedTransactionsUseCase: jest.Mocked<SuggestRelatedTransactionsUseCase>;
  let getEventFinancialSummaryUseCase: jest.Mocked<GetEventFinancialSummaryUseCase>;

  const createEvent = (): EventEntity => {
    return EventEntity.create(
      new Date('2025-08-10'),
      '沖縄旅行',
      '家族旅行',
      EventCategory.TRAVEL,
      ['旅行', '沖縄'],
    );
  };

  const createTransaction = (
    id: string,
    date: Date,
    amount: number,
    categoryName: string,
  ): TransactionEntity => {
    return new TransactionEntity(
      id,
      date,
      amount,
      { id: `cat_${id}`, name: categoryName, type: CategoryType.EXPENSE },
      `${categoryName}の取引`,
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
    const mockCreateEventUseCase = {
      execute: jest.fn(),
    };
    const mockUpdateEventUseCase = {
      execute: jest.fn(),
    };
    const mockDeleteEventUseCase = {
      execute: jest.fn(),
    };
    const mockGetEventByIdUseCase = {
      execute: jest.fn(),
    };
    const mockGetEventsByDateRangeUseCase = {
      execute: jest.fn(),
    };
    const mockLinkTransactionToEventUseCase = {
      execute: jest.fn(),
    };
    const mockUnlinkTransactionFromEventUseCase = {
      execute: jest.fn(),
    };
    const mockSuggestRelatedTransactionsUseCase = {
      execute: jest.fn(),
    };
    const mockGetEventFinancialSummaryUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [
        {
          provide: CreateEventUseCase,
          useValue: mockCreateEventUseCase,
        },
        {
          provide: UpdateEventUseCase,
          useValue: mockUpdateEventUseCase,
        },
        {
          provide: DeleteEventUseCase,
          useValue: mockDeleteEventUseCase,
        },
        {
          provide: GetEventByIdUseCase,
          useValue: mockGetEventByIdUseCase,
        },
        {
          provide: GetEventsByDateRangeUseCase,
          useValue: mockGetEventsByDateRangeUseCase,
        },
        {
          provide: LinkTransactionToEventUseCase,
          useValue: mockLinkTransactionToEventUseCase,
        },
        {
          provide: UnlinkTransactionFromEventUseCase,
          useValue: mockUnlinkTransactionFromEventUseCase,
        },
        {
          provide: SuggestRelatedTransactionsUseCase,
          useValue: mockSuggestRelatedTransactionsUseCase,
        },
        {
          provide: GetEventFinancialSummaryUseCase,
          useValue: mockGetEventFinancialSummaryUseCase,
        },
      ],
    }).compile();

    controller = module.get<EventController>(EventController);
    createEventUseCase = module.get(CreateEventUseCase);
    updateEventUseCase = module.get(UpdateEventUseCase);
    deleteEventUseCase = module.get(DeleteEventUseCase);
    getEventByIdUseCase = module.get(GetEventByIdUseCase);
    getEventsByDateRangeUseCase = module.get(GetEventsByDateRangeUseCase);
    linkTransactionToEventUseCase = module.get(LinkTransactionToEventUseCase);
    unlinkTransactionFromEventUseCase = module.get(
      UnlinkTransactionFromEventUseCase,
    );
    suggestRelatedTransactionsUseCase = module.get(
      SuggestRelatedTransactionsUseCase,
    );
    getEventFinancialSummaryUseCase = module.get(
      GetEventFinancialSummaryUseCase,
    );
  });

  describe('POST /api/events', () => {
    it('should create an event', async () => {
      const event = createEvent();
      createEventUseCase.execute.mockResolvedValue(event);

      const dto = {
        date: '2025-08-10',
        title: '沖縄旅行',
        description: '家族旅行',
        category: EventCategory.TRAVEL,
        tags: ['旅行', '沖縄'],
      };

      const result = await controller.create(dto);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(event.id);
      expect(createEventUseCase.execute).toHaveBeenCalledWith({
        date: new Date('2025-08-10'),
        title: '沖縄旅行',
        description: '家族旅行',
        category: EventCategory.TRAVEL,
        tags: ['旅行', '沖縄'],
      });
    });

    it('should create an event without description and tags', async () => {
      const event = createEvent();
      createEventUseCase.execute.mockResolvedValue(event);

      const dto = {
        date: '2025-08-10',
        title: '沖縄旅行',
        category: EventCategory.TRAVEL,
      };

      const result = await controller.create(dto);

      expect(result.success).toBe(true);
      expect(createEventUseCase.execute).toHaveBeenCalledWith({
        date: new Date('2025-08-10'),
        title: '沖縄旅行',
        description: null,
        category: EventCategory.TRAVEL,
        tags: [],
      });
    });
  });

  describe('GET /api/events/date-range', () => {
    it('should find events by date range', async () => {
      const event1 = createEvent();
      const event2 = createEvent();
      getEventsByDateRangeUseCase.execute.mockResolvedValue([event1, event2]);

      const query = {
        startDate: '2025-08-01',
        endDate: '2025-08-31',
      };

      const result = await controller.findByDateRange(query);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(getEventsByDateRangeUseCase.execute).toHaveBeenCalledWith(
        new Date('2025-08-01'),
        new Date('2025-08-31'),
      );
    });

    it('should return empty array when no events found', async () => {
      getEventsByDateRangeUseCase.execute.mockResolvedValue([]);

      const query = {
        startDate: '2025-08-01',
        endDate: '2025-08-31',
      };

      const result = await controller.findByDateRange(query);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should find event by id', async () => {
      const event = createEvent();
      const transaction = createTransaction(
        'txn_1',
        new Date('2025-08-10'),
        -50000,
        '交通費',
      );
      getEventByIdUseCase.execute.mockResolvedValue({
        event,
        relatedTransactions: [transaction],
      });

      const result = await controller.findById(event.id);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(event.id);
      expect(getEventByIdUseCase.execute).toHaveBeenCalledWith(event.id);
    });

    it('should throw error when event not found', async () => {
      getEventByIdUseCase.execute.mockRejectedValue(
        new EventNotFoundException('nonexistent'),
      );

      await expect(controller.findById('nonexistent')).rejects.toThrow(
        EventNotFoundException,
      );
    });
  });

  describe('PUT /api/events/:id', () => {
    it('should update an event', async () => {
      const event = createEvent();
      updateEventUseCase.execute.mockResolvedValue(event);

      const dto = {
        title: 'Updated Event',
        description: 'Updated description',
        category: EventCategory.TRAVEL,
        tags: ['更新'],
      };

      const result = await controller.update(event.id, dto);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(event.id);
      expect(updateEventUseCase.execute).toHaveBeenCalledWith(event.id, {
        title: 'Updated Event',
        description: 'Updated description',
        category: EventCategory.TRAVEL,
        tags: ['更新'],
      });
    });

    it('should update an event with date', async () => {
      const event = createEvent();
      updateEventUseCase.execute.mockResolvedValue(event);

      const dto = {
        date: '2025-09-10',
        title: 'Updated Event',
        category: EventCategory.TRAVEL,
      };

      const result = await controller.update(event.id, dto);

      expect(result.success).toBe(true);
      expect(updateEventUseCase.execute).toHaveBeenCalledWith(event.id, {
        date: new Date('2025-09-10'),
        title: 'Updated Event',
        description: undefined,
        category: EventCategory.TRAVEL,
        tags: undefined,
      });
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete an event', async () => {
      deleteEventUseCase.execute.mockResolvedValue(undefined);

      await controller.delete('event_1');

      expect(deleteEventUseCase.execute).toHaveBeenCalledWith('event_1');
    });
  });

  describe('POST /api/events/:id/transactions', () => {
    it('should link transaction to event', async () => {
      linkTransactionToEventUseCase.execute.mockResolvedValue(undefined);

      const dto = {
        transactionId: 'txn_1',
      };

      const result = await controller.linkTransaction('event_1', dto);

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('取引とイベントを紐付けました');
      expect(linkTransactionToEventUseCase.execute).toHaveBeenCalledWith(
        'event_1',
        'txn_1',
      );
    });
  });

  describe('DELETE /api/events/:id/transactions/:transactionId', () => {
    it('should unlink transaction from event', async () => {
      unlinkTransactionFromEventUseCase.execute.mockResolvedValue(undefined);

      const result = await controller.unlinkTransaction('event_1', 'txn_1');

      expect(result.success).toBe(true);
      expect(result.data.message).toBe('取引とイベントの紐付けを解除しました');
      expect(unlinkTransactionFromEventUseCase.execute).toHaveBeenCalledWith(
        'event_1',
        'txn_1',
      );
    });
  });

  describe('GET /api/events/:id/suggest-transactions', () => {
    it('should return suggested transactions', async () => {
      // Arrange
      const event = createEvent();
      const transaction = createTransaction(
        'txn_1',
        new Date('2025-08-10'),
        -50000,
        '交通費',
      );
      const suggestions = [
        {
          transaction,
          score: 90,
          reasons: [
            '日付が近い（0日差）',
            '高額取引（5万円以上）',
            'カテゴリが関連（交通費）',
          ],
        },
      ];

      suggestRelatedTransactionsUseCase.execute.mockResolvedValue(suggestions);

      // Act
      const result = await controller.suggestRelatedTransactions(event.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].transaction.id).toBe('txn_1');
      expect(result.data[0].score).toBe(90);
      expect(result.data[0].reasons).toHaveLength(3);
      expect(suggestRelatedTransactionsUseCase.execute).toHaveBeenCalledWith(
        event.id,
      );
    });

    it('should return empty array when no suggestions', async () => {
      // Arrange
      const event = createEvent();
      suggestRelatedTransactionsUseCase.execute.mockResolvedValue([]);

      // Act
      const result = await controller.suggestRelatedTransactions(event.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should throw error when event not found', async () => {
      // Arrange
      suggestRelatedTransactionsUseCase.execute.mockRejectedValue(
        new EventNotFoundException('nonexistent'),
      );

      // Act & Assert
      await expect(
        controller.suggestRelatedTransactions('nonexistent'),
      ).rejects.toThrow(EventNotFoundException);
    });
  });

  describe('GET /api/events/:id/financial-summary', () => {
    it('should return financial summary', async () => {
      // Arrange
      const event = createEvent();
      const transaction1 = createTransaction(
        'txn_1',
        new Date('2025-08-10'),
        100000,
        '給与',
      );
      const transaction2 = createTransaction(
        'txn_2',
        new Date('2025-08-10'),
        -50000,
        '交通費',
      );
      transaction1.category.type = CategoryType.INCOME;
      transaction2.category.type = CategoryType.EXPENSE;

      const summary = {
        event,
        relatedTransactions: [transaction1, transaction2],
        totalIncome: 100000,
        totalExpense: 50000,
        netAmount: 50000,
        transactionCount: 2,
      };

      getEventFinancialSummaryUseCase.execute.mockResolvedValue(summary);

      // Act
      const result = await controller.getFinancialSummary(event.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.event.id).toBe(event.id);
      expect(result.data.totalIncome).toBe(100000);
      expect(result.data.totalExpense).toBe(50000);
      expect(result.data.netAmount).toBe(50000);
      expect(result.data.transactionCount).toBe(2);
      expect(result.data.relatedTransactions).toHaveLength(2);
      expect(getEventFinancialSummaryUseCase.execute).toHaveBeenCalledWith(
        event.id,
      );
    });

    it('should return zero values when no transactions', async () => {
      // Arrange
      const event = createEvent();
      const summary = {
        event,
        relatedTransactions: [],
        totalIncome: 0,
        totalExpense: 0,
        netAmount: 0,
        transactionCount: 0,
      };

      getEventFinancialSummaryUseCase.execute.mockResolvedValue(summary);

      // Act
      const result = await controller.getFinancialSummary(event.id);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.totalIncome).toBe(0);
      expect(result.data.totalExpense).toBe(0);
      expect(result.data.netAmount).toBe(0);
      expect(result.data.transactionCount).toBe(0);
      expect(result.data.relatedTransactions).toHaveLength(0);
    });

    it('should throw error when event not found', async () => {
      // Arrange
      getEventFinancialSummaryUseCase.execute.mockRejectedValue(
        new EventNotFoundException('nonexistent'),
      );

      // Act & Assert
      await expect(
        controller.getFinancialSummary('nonexistent'),
      ).rejects.toThrow(EventNotFoundException);
    });
  });
});
