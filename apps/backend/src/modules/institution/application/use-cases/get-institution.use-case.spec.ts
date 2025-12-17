import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetInstitutionUseCase } from './get-institution.use-case';
import { InstitutionEntity } from '../../domain/entities/institution.entity';
import type { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import { INSTITUTION_REPOSITORY } from '../../institution.tokens';
import { InstitutionType } from '@account-book/types';
import { EncryptedCredentials } from '../../domain/value-objects/encrypted-credentials.vo';
import { AccountEntity } from '../../domain/entities/account.entity';

describe('GetInstitutionUseCase', () => {
  let useCase: GetInstitutionUseCase;
  let repository: jest.Mocked<IInstitutionRepository>;

  const mockCredentials = new EncryptedCredentials(
    'encrypted_data',
    'iv_data',
    'auth_tag',
  );

  const mockAccounts = [
    new AccountEntity('acc_1', 'inst_1', '123', 'Account 1', 10000, 'JPY'),
  ];

  const mockInstitution = new InstitutionEntity(
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

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IInstitutionRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetInstitutionUseCase,
        {
          provide: INSTITUTION_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get<GetInstitutionUseCase>(GetInstitutionUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return institution when it exists', async () => {
      const id = 'inst_123';
      repository.findById.mockResolvedValue(mockInstitution);

      const result = await useCase.execute(id);

      expect(result).toEqual(mockInstitution);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when institution does not exist', async () => {
      const id = 'non-existent-id';
      repository.findById.mockResolvedValue(null);

      await expect(useCase.execute(id)).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });
  });
});
