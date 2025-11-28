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
      count: jest.fn(),
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

  describe('update', () => {
    it('should update sync history', async () => {
      mockRepository.save.mockResolvedValue(
        mockOrmEntity as SyncHistoryOrmEntity,
      );

      const result = await repository.update({} as any);

      expect(result).toBeInstanceOf(SyncHistory);
    });
  });

  describe('findByInstitutionId', () => {
    it('should find sync histories by institution id', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as SyncHistoryOrmEntity,
      ]);

      const result = await repository.findByInstitutionId('inst_1');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SyncHistory);
    });
  });

  describe('findByStatus', () => {
    it('should find sync histories by status', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as SyncHistoryOrmEntity,
      ]);

      const result = await repository.findByStatus('completed' as any);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SyncHistory);
    });
  });

  describe('findWithFilters', () => {
    it('should find sync histories with filters', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as SyncHistoryOrmEntity,
      ]);

      const result = await repository.findWithFilters({
        institutionId: 'inst_1',
        status: 'completed' as any,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SyncHistory);
    });
  });

  describe('countWithFilters', () => {
    it('should count sync histories with filters', async () => {
      (mockRepository.count as jest.Mock).mockResolvedValue(5);

      const result = await repository.countWithFilters({
        institutionId: 'inst_1',
      });

      expect(result).toBe(5);
    });
  });
});
