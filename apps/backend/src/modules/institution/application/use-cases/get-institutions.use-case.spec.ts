import { Test, TestingModule } from '@nestjs/testing';
import { GetInstitutionsUseCase } from './get-institutions.use-case';
import { InstitutionEntity } from '../../domain/entities/institution.entity';
import type { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import { INSTITUTION_REPOSITORY } from '../../institution.tokens';
import { InstitutionType } from '@account-book/types';
import { EncryptedCredentials } from '../../domain/value-objects/encrypted-credentials.vo';
import { AccountEntity } from '../../domain/entities/account.entity';

describe('GetInstitutionsUseCase', () => {
  let useCase: GetInstitutionsUseCase;
  let repository: jest.Mocked<IInstitutionRepository>;

  const mockCredentials = new EncryptedCredentials(
    'encrypted_data',
    'iv_data',
    'auth_tag',
  );

  const mockAccounts = [
    new AccountEntity('acc_1', 'inst_1', '123', 'Account 1', 10000, 'JPY'),
  ];

  const mockInstitution1 = new InstitutionEntity(
    'inst_123',
    'Test Bank',
    InstitutionType.BANK,
    mockCredentials,
    true,
    new Date('2024-01-15'),
    mockAccounts,
    new Date('2024-01-01'),
    new Date('2024-01-15'),
  );

  const mockInstitution2 = new InstitutionEntity(
    'inst_456',
    'Test Credit Card',
    InstitutionType.CREDIT_CARD,
    mockCredentials,
    false,
    null,
    [],
    new Date('2024-01-01'),
    new Date('2024-01-15'),
  );

  beforeEach(async () => {
    repository = {
      findAll: jest.fn(),
      findByType: jest.fn(),
      findByConnectionStatus: jest.fn(),
    } as unknown as jest.Mocked<IInstitutionRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetInstitutionsUseCase,
        {
          provide: INSTITUTION_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get<GetInstitutionsUseCase>(GetInstitutionsUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return all institutions when no query is provided', async () => {
      const mockInstitutions = [mockInstitution1, mockInstitution2];
      repository.findAll.mockResolvedValue(mockInstitutions);

      const result = await useCase.execute();

      expect(result).toEqual(mockInstitutions);
      expect(repository.findAll).toHaveBeenCalled();
      expect(repository.findByType).not.toHaveBeenCalled();
      expect(repository.findByConnectionStatus).not.toHaveBeenCalled();
    });

    it('should filter by type when type is provided', async () => {
      const mockInstitutions = [mockInstitution1];
      repository.findByType.mockResolvedValue(mockInstitutions);

      const result = await useCase.execute({ type: InstitutionType.BANK });

      expect(result).toEqual(mockInstitutions);
      expect(repository.findByType).toHaveBeenCalledWith(InstitutionType.BANK);
      expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('should filter by connection status when isConnected is provided', async () => {
      const mockInstitutions = [mockInstitution1];
      repository.findByConnectionStatus.mockResolvedValue(mockInstitutions);

      const result = await useCase.execute({ isConnected: true });

      expect(result).toEqual(mockInstitutions);
      expect(repository.findByConnectionStatus).toHaveBeenCalledWith(true);
      expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('should filter by connection status when isConnected is false', async () => {
      const mockInstitutions = [mockInstitution2];
      repository.findByConnectionStatus.mockResolvedValue(mockInstitutions);

      const result = await useCase.execute({ isConnected: false });

      expect(result).toEqual(mockInstitutions);
      expect(repository.findByConnectionStatus).toHaveBeenCalledWith(false);
      expect(repository.findAll).not.toHaveBeenCalled();
    });

    it('should return empty array when no institutions match', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result).toEqual([]);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });
});
