import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncHistoryTypeOrmRepository } from './sync-history-typeorm.repository';
import { SyncHistoryOrmEntity } from '../entities/sync-history.orm-entity';
import { SyncHistory } from '../../domain/entities/sync-history.entity';

describe('SyncHistoryTypeOrmRepository', () => {
  let repository: SyncHistoryTypeOrmRepository;
  let mockRepository: jest.Mocked<Repository<SyncHistoryOrmEntity>>;

  const mockOrmEntity: Partial<SyncHistoryOrmEntity> = {
    id: 'sync_1',
    institutionId: 'inst_1',
    status: 'completed',
    startedAt: new Date(),
    completedAt: new Date(),
    errorMessage: null,
  };

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((entity) => entity as SyncHistoryOrmEntity),
    } as unknown as jest.Mocked<Repository<SyncHistoryOrmEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncHistoryTypeOrmRepository,
        {
          provide: getRepositoryToken(SyncHistoryOrmEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<SyncHistoryTypeOrmRepository>(
      SyncHistoryTypeOrmRepository,
    );
  });

  describe('findAll', () => {
    it('should find all sync histories', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as SyncHistoryOrmEntity,
      ]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SyncHistory);
    });
  });

  describe('findById', () => {
    it('should find sync history by id', async () => {
      mockRepository.findOne.mockResolvedValue(
        mockOrmEntity as SyncHistoryOrmEntity,
      );

      const result = await repository.findById('sync_1');

      expect(result).toBeInstanceOf(SyncHistory);
    });
  });

  describe('create', () => {
    it('should create sync history', async () => {
      mockRepository.save.mockResolvedValue(
        mockOrmEntity as SyncHistoryOrmEntity,
      );

      const result = await repository.create({} as any);

      expect(result).toBeInstanceOf(SyncHistory);
    });
  });
});
