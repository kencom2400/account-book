import { Test, TestingModule } from '@nestjs/testing';
import { SuggestRelatedTransactionsUseCase } from './suggest-related-transactions.use-case';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { EventEntity } from '../../domain/entities/event.entity';
import { EventCategory } from '../../domain/enums/event-category.enum';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';
import { EventNotFoundException } from '../../domain/errors/event.errors';

describe('SuggestRelatedTransactionsUseCase', () => {
  let useCase: SuggestRelatedTransactionsUseCase;
  let eventRepository: jest.Mocked<IEventRepository>;
  let transactionRepository: jest.Mocked<ITransactionRepository>;

  const createEvent = (
    date: Date = new Date('2025-08-10'),
    category: EventCategory = EventCategory.TRAVEL,
  ): EventEntity => {
    return EventEntity.create(date, '沖縄旅行', '家族旅行', category, [
      '旅行',
      '沖縄',
    ]);
  };

  const createTransaction = (
    id: string,
    date: Date,
    amount: number,
    categoryName: string,
    categoryType: CategoryType = CategoryType.EXPENSE,
  ): TransactionEntity => {
    return new TransactionEntity(
      id,
      date,
      amount,
      { id: `cat_${id}`, name: categoryName, type: categoryType },
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
        SuggestRelatedTransactionsUseCase,
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

    useCase = module.get<SuggestRelatedTransactionsUseCase>(
      SuggestRelatedTransactionsUseCase,
    );
    eventRepository = module.get(EVENT_REPOSITORY);
    transactionRepository = module.get(TRANSACTION_REPOSITORY);
  });

  describe('execute', () => {
    it('should suggest related transactions sorted by score', async () => {
      // Arrange
      const event = createEvent();
      const eventDate = new Date('2025-08-10');

      // イベント日付と同じ日の高額取引（最高スコア）
      const transaction1 = createTransaction(
        'txn_1',
        eventDate,
        -50000,
        '交通費',
      );
      // イベント日付の1日前の取引
      const transaction2 = createTransaction(
        'txn_2',
        new Date('2025-08-09'),
        -30000,
        '宿泊費',
      );
      // イベント日付の7日前の取引（低スコア）
      const transaction3 = createTransaction(
        'txn_3',
        new Date('2025-08-03'),
        -10000,
        '飲食費',
      );
      // 関連カテゴリではない取引（低スコア）
      const transaction4 = createTransaction(
        'txn_4',
        eventDate,
        -5000,
        '医療費',
      );

      eventRepository.findById.mockResolvedValue(event);
      transactionRepository.findByDateRange.mockResolvedValue([
        transaction1,
        transaction2,
        transaction3,
        transaction4,
      ]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      // 医療費はTRAVELカテゴリのフィルタリングで除外されるため、3件のみ
      expect(result).toHaveLength(3);
      expect(result[0].transaction.id).toBe('txn_1'); // 最高スコア
      expect(result[0].score).toBeGreaterThan(result[1].score);
      expect(result[0].reasons).toContain('日付が近い（0日差）');
      expect(result[0].reasons).toContain('高額取引（5万円以上）');
      expect(result[0].reasons).toContain('カテゴリが関連（交通費）');
      expect(eventRepository.findById).toHaveBeenCalledWith(event.id);
      expect(transactionRepository.findByDateRange).toHaveBeenCalled();
    });

    it('should return top 10 transactions when more than 10 candidates', async () => {
      // Arrange
      const event = createEvent();
      const transactions: TransactionEntity[] = [];
      for (let i = 0; i < 15; i++) {
        transactions.push(
          createTransaction(
            `txn_${i}`,
            new Date('2025-08-10'),
            -10000 * (i + 1),
            '交通費',
          ),
        );
      }

      eventRepository.findById.mockResolvedValue(event);
      transactionRepository.findByDateRange.mockResolvedValue(transactions);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result).toHaveLength(10);
    });

    it('should filter transactions by event category', async () => {
      // Arrange
      const event = createEvent(new Date('2025-08-10'), EventCategory.TRAVEL);
      const relatedTransaction = createTransaction(
        'txn_1',
        new Date('2025-08-10'),
        -50000,
        '交通費',
      );
      const unrelatedTransaction = createTransaction(
        'txn_2',
        new Date('2025-08-10'),
        -50000,
        '医療費',
      );

      eventRepository.findById.mockResolvedValue(event);
      transactionRepository.findByDateRange.mockResolvedValue([
        relatedTransaction,
        unrelatedTransaction,
      ]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      // 関連カテゴリ（交通費）のみがフィルタリングで残る
      expect(result).toHaveLength(1);
      expect(result[0].transaction.id).toBe('txn_1');
      expect(result[0].reasons).toContain('カテゴリが関連（交通費）');
    });

    it('should return all transactions for OTHER category', async () => {
      // Arrange
      const event = createEvent(new Date('2025-08-10'), EventCategory.OTHER);
      const transaction1 = createTransaction(
        'txn_1',
        new Date('2025-08-10'),
        -50000,
        '交通費',
      );
      const transaction2 = createTransaction(
        'txn_2',
        new Date('2025-08-10'),
        -50000,
        '医療費',
      );

      eventRepository.findById.mockResolvedValue(event);
      transactionRepository.findByDateRange.mockResolvedValue([
        transaction1,
        transaction2,
      ]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result).toHaveLength(2);
    });

    it('should calculate score based on date proximity', async () => {
      // Arrange
      const event = createEvent();
      const eventDate = new Date('2025-08-10');
      const transaction0 = createTransaction(
        'txn_0',
        eventDate,
        -10000,
        '交通費',
      );
      const transaction1 = createTransaction(
        'txn_1',
        new Date('2025-08-09'),
        -10000,
        '交通費',
      );
      const transaction7 = createTransaction(
        'txn_7',
        new Date('2025-08-03'),
        -10000,
        '交通費',
      );

      eventRepository.findById.mockResolvedValue(event);
      transactionRepository.findByDateRange.mockResolvedValue([
        transaction0,
        transaction1,
        transaction7,
      ]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result[0].score).toBeGreaterThan(result[1].score);
      expect(result[1].score).toBeGreaterThan(result[2].score);
    });

    it('should calculate score based on amount', async () => {
      // Arrange
      const event = createEvent();
      const eventDate = new Date('2025-08-10');
      const transaction1 = createTransaction(
        'txn_1',
        eventDate,
        -100000,
        '交通費',
      );
      const transaction2 = createTransaction(
        'txn_2',
        eventDate,
        -50000,
        '交通費',
      );
      const transaction3 = createTransaction(
        'txn_3',
        eventDate,
        -10000,
        '交通費',
      );

      eventRepository.findById.mockResolvedValue(event);
      transactionRepository.findByDateRange.mockResolvedValue([
        transaction1,
        transaction2,
        transaction3,
      ]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result[0].score).toBeGreaterThan(result[1].score);
      expect(result[1].score).toBeGreaterThan(result[2].score);
    });

    it('should throw error when event not found', async () => {
      // Arrange
      eventRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute('nonexistent')).rejects.toThrow(
        EventNotFoundException,
      );
    });

    it('should return empty array when no transactions found', async () => {
      // Arrange
      const event = createEvent();
      eventRepository.findById.mockResolvedValue(event);
      transactionRepository.findByDateRange.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should generate reasons correctly', async () => {
      // Arrange
      const event = createEvent();
      const eventDate = new Date('2025-08-10');
      const transaction = createTransaction(
        'txn_1',
        eventDate,
        -50000,
        '交通費',
      );

      eventRepository.findById.mockResolvedValue(event);
      transactionRepository.findByDateRange.mockResolvedValue([transaction]);

      // Act
      const result = await useCase.execute(event.id);

      // Assert
      expect(result[0].reasons).toContain('日付が近い（0日差）');
      expect(result[0].reasons).toContain('高額取引（5万円以上）');
      expect(result[0].reasons).toContain('カテゴリが関連（交通費）');
    });
  });
});
