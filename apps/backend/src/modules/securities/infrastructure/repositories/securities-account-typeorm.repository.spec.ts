import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { SecuritiesAccountTypeOrmRepository } from './securities-account-typeorm.repository';
import { SecuritiesAccountOrmEntity } from '../entities/securities-account.orm-entity';
import { SecuritiesAccountEntity } from '../../domain/entities/securities-account.entity';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

describe('SecuritiesAccountTypeOrmRepository', () => {
  let repository: SecuritiesAccountTypeOrmRepository;
  let mockRepository: jest.Mocked<Repository<SecuritiesAccountOrmEntity>>;

  const mockCredentials = new EncryptedCredentials(
    'encrypted',
    'iv',
    'authTag',
  );

  const mockDomainEntity = new SecuritiesAccountEntity(
    'sec_1',
    'Test Securities',
    '1234567890',
    'general',
    mockCredentials,
    'connected',
    100000,
    50000,
    new Date('2024-01-01'),
    new Date('2024-01-15'),
  );

  const mockOrmEntity: Partial<SecuritiesAccountOrmEntity> = {
    id: 'sec_1',
    securitiesCompanyName: 'Test Securities',
    accountNumber: '1234567890',
    accountType: 'general',
    credentialsEncrypted: 'encrypted',
    credentialsIv: 'iv',
    credentialsAuthTag: 'authTag',
    credentialsAlgorithm: 'aes-256-gcm',
    credentialsVersion: 'v1',
    isConnected: 'connected',
    lastSyncedAt: new Date('2024-01-15'),
    totalEvaluationAmount: 100000,
    cashBalance: 50000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      create: jest.fn((entity) => entity as SecuritiesAccountOrmEntity),
    } as unknown as jest.Mocked<Repository<SecuritiesAccountOrmEntity>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecuritiesAccountTypeOrmRepository,
        {
          provide: getRepositoryToken(SecuritiesAccountOrmEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get<SecuritiesAccountTypeOrmRepository>(
      SecuritiesAccountTypeOrmRepository,
    );
  });

  describe('create', () => {
    it('should create securities account', async () => {
      mockRepository.save.mockResolvedValue(
        mockOrmEntity as SecuritiesAccountOrmEntity,
      );

      await repository.create(mockDomainEntity);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sec_1',
          securitiesCompanyName: 'Test Securities',
          accountNumber: '1234567890',
        }),
      );
    });

    it('should create with EntityManager', async () => {
      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          save: jest.fn().mockResolvedValue(mockOrmEntity),
        }),
      } as unknown as EntityManager;

      await repository.create(mockDomainEntity, mockManager);

      expect(mockManager.getRepository).toHaveBeenCalledWith(
        SecuritiesAccountOrmEntity,
      );
    });
  });

  describe('findById', () => {
    it('should find securities account by id', async () => {
      mockRepository.findOne.mockResolvedValue(
        mockOrmEntity as SecuritiesAccountOrmEntity,
      );

      const result = await repository.findById('sec_1');

      expect(result).toBeInstanceOf(SecuritiesAccountEntity);
      expect(result?.id).toBe('sec_1');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'sec_1' },
      });
    });

    it('should return null if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all securities accounts', async () => {
      mockRepository.find.mockResolvedValue([
        mockOrmEntity as SecuritiesAccountOrmEntity,
      ]);

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(SecuritiesAccountEntity);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'ASC' },
      });
    });

    it('should return empty array if no accounts', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update securities account', async () => {
      mockRepository.save.mockResolvedValue(
        mockOrmEntity as SecuritiesAccountOrmEntity,
      );

      await repository.update(mockDomainEntity);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sec_1',
        }),
      );
    });
  });

  describe('delete', () => {
    it('should delete securities account', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete('sec_1');

      expect(mockRepository.delete).toHaveBeenCalledWith('sec_1');
    });
  });
});
