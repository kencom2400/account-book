import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventTypeOrmRepository } from './event-typeorm.repository';
import { EventOrmEntity } from '../entities/event.orm-entity';
import { EventTransactionRelationOrmEntity } from '../entities/event-transaction-relation.orm-entity';
import { EventEntity } from '../../domain/entities/event.entity';
import { EventCategory } from '../../domain/enums/event-category.enum';

describe('EventTypeOrmRepository', () => {
  let repository: EventTypeOrmRepository;
  let mockEventRepository: jest.Mocked<Repository<EventOrmEntity>>;
  let mockRelationRepository: jest.Mocked<
    Repository<EventTransactionRelationOrmEntity>
  >;

  const mockOrmEntity: Partial<EventOrmEntity> = {
    id: 'evt_1',
    date: new Date('2025-04-01'),
    title: '入学式',
    description: '長男の小学校入学式',
    category: EventCategory.EDUCATION,
    tags: ['学校', '入学'],
    createdAt: new Date('2025-01-27T10:00:00'),
    updatedAt: new Date('2025-01-27T10:00:00'),
  };

  beforeEach(async () => {
    mockEventRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((entity) => entity as EventOrmEntity),
    } as unknown as jest.Mocked<Repository<EventOrmEntity>>;

    mockRelationRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((entity) => entity as EventTransactionRelationOrmEntity),
    } as unknown as jest.Mocked<Repository<EventTransactionRelationOrmEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventTypeOrmRepository,
        {
          provide: getRepositoryToken(EventOrmEntity),
          useValue: mockEventRepository,
        },
        {
          provide: getRepositoryToken(EventTransactionRelationOrmEntity),
          useValue: mockRelationRepository,
        },
      ],
    }).compile();

    repository = module.get<EventTypeOrmRepository>(EventTypeOrmRepository);
  });

  describe('save', () => {
    it('should save event', async () => {
      // Arrange
      const event = EventEntity.create(
        new Date('2025-04-01'),
        '入学式',
        '長男の小学校入学式',
        EventCategory.EDUCATION,
        ['学校', '入学'],
      );

      mockEventRepository.save.mockResolvedValue(
        mockOrmEntity as EventOrmEntity,
      );

      // Act
      const result = await repository.save(event);

      // Assert
      expect(result).toBeInstanceOf(EventEntity);
      expect(mockEventRepository.save).toHaveBeenCalled();
    });

    it('should save event with null tags', async () => {
      // Arrange
      const event = EventEntity.create(
        new Date('2025-04-01'),
        '入学式',
        null,
        EventCategory.EDUCATION,
        [],
      );

      const mockEntityWithoutTags = {
        ...mockOrmEntity,
        tags: null,
      };

      mockEventRepository.save.mockResolvedValue(
        mockEntityWithoutTags as EventOrmEntity,
      );

      // Act
      const result = await repository.save(event);

      // Assert
      expect(result.tags).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should find event by id', async () => {
      // Arrange
      mockEventRepository.findOne.mockResolvedValue(
        mockOrmEntity as EventOrmEntity,
      );

      // Act
      const result = await repository.findById('evt_1');

      // Assert
      expect(result).toBeInstanceOf(EventEntity);
      expect(result?.id).toBe('evt_1');
      expect(result?.title).toBe('入学式');
    });

    it('should return null if not found', async () => {
      // Arrange
      mockEventRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await repository.findById('nonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByDateRange', () => {
    it('should find events by date range', async () => {
      // Arrange
      const startDate = new Date('2025-04-01');
      const endDate = new Date('2025-04-30');

      const mockOrmEntity2: Partial<EventOrmEntity> = {
        id: 'evt_2',
        date: new Date('2025-04-15'),
        title: '旅行',
        description: '家族旅行',
        category: EventCategory.TRAVEL,
        tags: ['旅行', '家族'],
        createdAt: new Date('2025-01-27T10:00:00'),
        updatedAt: new Date('2025-01-27T10:00:00'),
      };

      mockEventRepository.find.mockResolvedValue([
        mockOrmEntity as EventOrmEntity,
        mockOrmEntity2 as EventOrmEntity,
      ]);

      // Act
      const result = await repository.findByDateRange(startDate, endDate);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(EventEntity);
      expect(result[1]).toBeInstanceOf(EventEntity);
      expect(mockEventRepository.find).toHaveBeenCalled();
      // Raw関数が呼び出されたことを確認（where条件にdateとRawが含まれている）
      const findCall = mockEventRepository.find.mock.calls[0][0];
      expect(findCall).toBeDefined();
      expect(findCall.where).toBeDefined();
      expect(findCall.where.date).toBeDefined();
    });

    it('should find events with date range boundary values', async () => {
      // Arrange
      const startDate = new Date('2025-04-01T00:00:00');
      const endDate = new Date('2025-04-01T23:59:59');

      mockEventRepository.find.mockResolvedValue([
        mockOrmEntity as EventOrmEntity,
      ]);

      // Act
      const result = await repository.findByDateRange(startDate, endDate);

      // Assert
      expect(result).toHaveLength(1);
      expect(mockEventRepository.find).toHaveBeenCalled();
      // Raw関数が呼び出されたことを確認
      const findCall = mockEventRepository.find.mock.calls[0][0];
      expect(findCall).toBeDefined();
      expect(findCall.where).toBeDefined();
      expect(findCall.where.date).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete event', async () => {
      // Arrange
      mockEventRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      // Act
      await repository.delete('evt_1');

      // Assert
      expect(mockEventRepository.delete).toHaveBeenCalledWith('evt_1');
    });
  });

  describe('findByTransactionId', () => {
    it('should find events by transaction id', async () => {
      // Arrange
      const mockRelation: Partial<EventTransactionRelationOrmEntity> = {
        eventId: 'evt_1',
        transactionId: 'txn_1',
        event: mockOrmEntity as EventOrmEntity,
      };

      mockRelationRepository.find.mockResolvedValue([
        mockRelation as EventTransactionRelationOrmEntity,
      ]);

      // Act
      const result = await repository.findByTransactionId('txn_1');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(EventEntity);
      expect(result[0].id).toBe('evt_1');
    });
  });

  describe('getTransactionIdsByEventId', () => {
    it('should get transaction ids by event id', async () => {
      // Arrange
      const mockRelation1: Partial<EventTransactionRelationOrmEntity> = {
        eventId: 'evt_1',
        transactionId: 'txn_1',
      };

      const mockRelation2: Partial<EventTransactionRelationOrmEntity> = {
        eventId: 'evt_1',
        transactionId: 'txn_2',
      };

      mockRelationRepository.find.mockResolvedValue([
        mockRelation1 as EventTransactionRelationOrmEntity,
        mockRelation2 as EventTransactionRelationOrmEntity,
      ]);

      // Act
      const result = await repository.getTransactionIdsByEventId('evt_1');

      // Assert
      expect(result).toEqual(['txn_1', 'txn_2']);
    });

    it('should return empty array when no relations found', async () => {
      // Arrange
      mockRelationRepository.find.mockResolvedValue([]);

      // Act
      const result = await repository.getTransactionIdsByEventId('evt_1');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('linkTransaction', () => {
    it('should link transaction to event', async () => {
      // Arrange
      mockRelationRepository.findOne.mockResolvedValue(null);
      mockRelationRepository.save.mockResolvedValue({
        eventId: 'evt_1',
        transactionId: 'txn_1',
      } as EventTransactionRelationOrmEntity);

      // Act
      await repository.linkTransaction('evt_1', 'txn_1');

      // Assert
      expect(mockRelationRepository.findOne).toHaveBeenCalledWith({
        where: { eventId: 'evt_1', transactionId: 'txn_1' },
      });
      expect(mockRelationRepository.save).toHaveBeenCalled();
    });

    it('should not link if already linked', async () => {
      // Arrange
      const existingRelation: Partial<EventTransactionRelationOrmEntity> = {
        eventId: 'evt_1',
        transactionId: 'txn_1',
      };

      mockRelationRepository.findOne.mockResolvedValue(
        existingRelation as EventTransactionRelationOrmEntity,
      );

      // Act
      await repository.linkTransaction('evt_1', 'txn_1');

      // Assert
      expect(mockRelationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('unlinkTransaction', () => {
    it('should unlink transaction from event', async () => {
      // Arrange
      mockRelationRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      // Act
      await repository.unlinkTransaction('evt_1', 'txn_1');

      // Assert
      expect(mockRelationRepository.delete).toHaveBeenCalledWith({
        eventId: 'evt_1',
        transactionId: 'txn_1',
      });
    });
  });
});
