import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionTypeOrmRepository } from './institution-typeorm.repository';
import { InstitutionOrmEntity } from '../entities/institution.orm-entity';
import { InstitutionEntity } from '../../domain/entities/institution.entity';

describe('InstitutionTypeOrmRepository', () => {
  let repository: InstitutionTypeOrmRepository;
  let mockRepository: jest.Mocked<Repository<InstitutionOrmEntity>>;

  const mockOrmEntity: Partial<InstitutionOrmEntity> = {
    id: 'inst_1',
    name: 'Test Bank',
    type: 'bank',
    bankCode: 'test-bank',
    credentialsEncrypted: 'encrypted',
    credentialsIv: 'iv',
    credentialsAuthTag: 'authTag',
    credentialsAlgorithm: 'aes-256-gcm',
    credentialsVersion: 'v1',
    isConnected: true,
    lastSyncedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((entity) => entity as InstitutionOrmEntity),
    } as unknown as jest.Mocked<Repository<InstitutionOrmEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionTypeOrmRepository,
        {
          provide: getRepositoryToken(InstitutionOrmEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<InstitutionTypeOrmRepository>(
      InstitutionTypeOrmRepository,
    );
  });

  describe('findAll', () => {
    it('should find all institutions', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as InstitutionOrmEntity,
      ]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(InstitutionEntity);
    });
  });

  describe('findById', () => {
    it('should find institution by id', async () => {
      mockRepository.findOne.mockResolvedValue(
        mockOrmEntity as InstitutionOrmEntity,
      );

      const result = await repository.findById('inst_1');

      expect(result).toBeInstanceOf(InstitutionEntity);
    });
  });

  describe('save', () => {
    it('should save institution', async () => {
      mockRepository.save.mockResolvedValue(
        mockOrmEntity as InstitutionOrmEntity,
      );

      await expect(repository.save({} as any)).resolves.not.toThrow();
    });
  });
});
