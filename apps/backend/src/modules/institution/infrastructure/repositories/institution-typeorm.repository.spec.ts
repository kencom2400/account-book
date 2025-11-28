import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionTypeOrmRepository } from './institution-typeorm.repository';
import { InstitutionOrmEntity } from '../entities/institution.orm-entity';
import { AccountOrmEntity } from '../entities/account.orm-entity';
import { InstitutionEntity } from '../../domain/entities/institution.entity';

describe('InstitutionTypeOrmRepository', () => {
  let repository: InstitutionTypeOrmRepository;
  let mockInstitutionRepository: jest.Mocked<Repository<InstitutionOrmEntity>>;
  let mockAccountRepository: jest.Mocked<Repository<AccountOrmEntity>>;

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
    accounts: [],
  };

  beforeEach(async () => {
    mockInstitutionRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((entity) => entity as InstitutionOrmEntity),
    } as unknown as jest.Mocked<Repository<InstitutionOrmEntity>>;

    mockAccountRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<AccountOrmEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionTypeOrmRepository,
        {
          provide: getRepositoryToken(InstitutionOrmEntity),
          useValue: mockInstitutionRepository,
        },
        {
          provide: getRepositoryToken(AccountOrmEntity),
          useValue: mockAccountRepository,
        },
      ],
    }).compile();

    repository = module.get<InstitutionTypeOrmRepository>(
      InstitutionTypeOrmRepository,
    );
  });

  describe('findAll', () => {
    it('should find all institutions', async () => {
      mockInstitutionRepository.find.mockResolvedValue([
        mockOrmEntity as InstitutionOrmEntity,
      ]);
      mockAccountRepository.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(InstitutionEntity);
    });
  });

  describe('findById', () => {
    it('should find institution by id', async () => {
      mockInstitutionRepository.findOne.mockResolvedValue(
        mockOrmEntity as InstitutionOrmEntity,
      );
      mockAccountRepository.find.mockResolvedValue([]);

      const result = await repository.findById('inst_1');

      expect(result).toBeInstanceOf(InstitutionEntity);
    });
  });

  describe('save', () => {
    it('should save institution', async () => {
      mockInstitutionRepository.save.mockResolvedValue(
        mockOrmEntity as InstitutionOrmEntity,
      );
      mockInstitutionRepository.create.mockReturnValue(
        mockOrmEntity as InstitutionOrmEntity,
      );
      mockAccountRepository.find.mockResolvedValue([]);

      const mockInstitution = {
        id: 'inst_1',
        name: 'Test Bank',
        type: 'bank',
        isConnected: true,
        lastSyncedAt: new Date(),
        accounts: [],
        credentials: {
          toJSON: () => ({
            encrypted: 'encrypted',
            iv: 'iv',
            authTag: 'authTag',
            algorithm: 'aes-256-gcm',
            version: 'v1',
          }),
        },
      } as any;

      const result = await repository.save(mockInstitution);

      expect(result).toBeInstanceOf(InstitutionEntity);
    });
  });
});
