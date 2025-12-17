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
      delete: jest.fn(),
      create: jest.fn((entity) => entity as AccountOrmEntity),
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
      expect(result?.id).toBe('inst_1');
      expect(mockInstitutionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'inst_1' },
        relations: ['accounts'],
      });
    });

    it('should return null when institution not found', async () => {
      mockInstitutionRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByIds', () => {
    it('should find institutions by ids', async () => {
      const mockOrmEntity2: Partial<InstitutionOrmEntity> = {
        ...mockOrmEntity,
        id: 'inst_2',
        name: 'Test Bank 2',
      };

      mockInstitutionRepository.find.mockResolvedValue([
        mockOrmEntity as InstitutionOrmEntity,
        mockOrmEntity2 as InstitutionOrmEntity,
      ]);
      mockAccountRepository.find.mockResolvedValue([]);

      const result = await repository.findByIds(['inst_1', 'inst_2']);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(InstitutionEntity);
      expect(result[1]).toBeInstanceOf(InstitutionEntity);
      expect(mockInstitutionRepository.find).toHaveBeenCalledWith({
        where: { id: expect.any(Object) },
        relations: ['accounts'],
        order: { createdAt: 'ASC' },
      });
    });

    it('should return empty array when ids array is empty', async () => {
      const result = await repository.findByIds([]);

      expect(result).toHaveLength(0);
      expect(mockInstitutionRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('findByType', () => {
    it('should find institutions by type', async () => {
      mockInstitutionRepository.find.mockResolvedValue([
        mockOrmEntity as InstitutionOrmEntity,
      ]);
      mockAccountRepository.find.mockResolvedValue([]);

      const result = await repository.findByType('bank');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(InstitutionEntity);
      expect(mockInstitutionRepository.find).toHaveBeenCalledWith({
        where: { type: 'bank' },
        relations: ['accounts'],
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('findByConnectionStatus', () => {
    it('should find connected institutions', async () => {
      mockInstitutionRepository.find.mockResolvedValue([
        mockOrmEntity as InstitutionOrmEntity,
      ]);
      mockAccountRepository.find.mockResolvedValue([]);

      const result = await repository.findByConnectionStatus(true);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(InstitutionEntity);
      expect(mockInstitutionRepository.find).toHaveBeenCalledWith({
        where: { isConnected: true },
        relations: ['accounts'],
        order: { createdAt: 'ASC' },
      });
    });

    it('should find disconnected institutions', async () => {
      const disconnectedEntity: Partial<InstitutionOrmEntity> = {
        ...mockOrmEntity,
        isConnected: false,
      };
      mockInstitutionRepository.find.mockResolvedValue([
        disconnectedEntity as InstitutionOrmEntity,
      ]);
      mockAccountRepository.find.mockResolvedValue([]);

      const result = await repository.findByConnectionStatus(false);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(InstitutionEntity);
      expect(mockInstitutionRepository.find).toHaveBeenCalledWith({
        where: { isConnected: false },
        relations: ['accounts'],
        order: { createdAt: 'ASC' },
      });
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
      expect(mockInstitutionRepository.save).toHaveBeenCalled();
    });

    it('should save institution with accounts', async () => {
      const mockAccount = {
        id: 'acc_1',
        institutionId: 'inst_1',
        accountNumber: '123456',
        accountName: 'Test Account',
        balance: 1000,
        currency: 'JPY',
      };

      mockAccountRepository.create.mockReturnValue(mockAccount as any);
      mockInstitutionRepository.save.mockResolvedValue({
        ...mockOrmEntity,
        accounts: [mockAccount],
      } as InstitutionOrmEntity);
      mockInstitutionRepository.create.mockReturnValue(
        mockOrmEntity as InstitutionOrmEntity,
      );

      const mockInstitution = {
        id: 'inst_1',
        name: 'Test Bank',
        type: 'bank',
        isConnected: true,
        lastSyncedAt: new Date(),
        accounts: [mockAccount],
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
      expect(mockAccountRepository.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update institution', async () => {
      mockInstitutionRepository.save.mockResolvedValue(
        mockOrmEntity as InstitutionOrmEntity,
      );
      mockInstitutionRepository.create.mockReturnValue(
        mockOrmEntity as InstitutionOrmEntity,
      );
      mockAccountRepository.find.mockResolvedValue([]);

      const mockInstitution = {
        id: 'inst_1',
        name: 'Updated Bank',
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

      const result = await repository.update(mockInstitution);

      expect(result).toBeInstanceOf(InstitutionEntity);
      expect(mockInstitutionRepository.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete institution without manager', async () => {
      mockInstitutionRepository.delete.mockResolvedValue({
        affected: 1,
      } as any);

      await repository.delete('inst_1');

      expect(mockInstitutionRepository.delete).toHaveBeenCalledWith('inst_1');
    });

    it('should delete institution with manager', async () => {
      const mockManager = {
        getRepository: jest.fn().mockReturnValue({
          delete: jest.fn().mockResolvedValue({ affected: 1 }),
        }),
      };

      await repository.delete('inst_1', mockManager);

      expect(mockManager.getRepository).toHaveBeenCalledWith(
        InstitutionOrmEntity,
      );
      expect(mockInstitutionRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteAll', () => {
    it('should delete all institutions and accounts', async () => {
      mockAccountRepository.delete.mockResolvedValue({
        affected: 2,
      } as any);
      mockInstitutionRepository.delete.mockResolvedValue({
        affected: 1,
      } as any);

      await repository.deleteAll();

      expect(mockAccountRepository.delete).toHaveBeenCalledWith({});
      expect(mockInstitutionRepository.delete).toHaveBeenCalledWith({});
    });
  });

  describe('findAll', () => {
    it('should return empty array when no institutions exist', async () => {
      mockInstitutionRepository.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toHaveLength(0);
    });
  });
});
