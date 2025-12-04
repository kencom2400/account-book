import { Test, TestingModule } from '@nestjs/testing';
import { InstitutionController } from './institution.controller';
import { CreateInstitutionUseCase } from '../../application/use-cases/create-institution.use-case';
import { GetInstitutionsUseCase } from '../../application/use-cases/get-institutions.use-case';
import { GetInstitutionUseCase } from '../../application/use-cases/get-institution.use-case';
import { TestBankConnectionUseCase } from '../../application/use-cases/test-bank-connection.use-case';
import { GetSupportedBanksUseCase } from '../../application/use-cases/get-supported-banks.use-case';
import { UpdateInstitutionUseCase } from '../../application/use-cases/update-institution.use-case';
import { InstitutionEntity } from '../../domain/entities/institution.entity';
import { EncryptedCredentials } from '../../domain/value-objects/encrypted-credentials.vo';

describe('InstitutionController', () => {
  let controller: InstitutionController;
  let createUseCase: jest.Mocked<CreateInstitutionUseCase>;
  let getUseCase: jest.Mocked<GetInstitutionsUseCase>;

  const mockCredentials = new EncryptedCredentials(
    'encrypted',
    'iv',
    'authTag',
  );

  const mockInstitution = new InstitutionEntity(
    'inst_1',
    'Test Bank',
    'bank',
    mockCredentials,
    true,
    new Date(),
    [],
    new Date(),
    new Date(),
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstitutionController],
      providers: [
        {
          provide: CreateInstitutionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetInstitutionsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetInstitutionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: TestBankConnectionUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetSupportedBanksUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateInstitutionUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<InstitutionController>(InstitutionController);
    createUseCase = module.get(CreateInstitutionUseCase);
    getUseCase = module.get(GetInstitutionsUseCase);
  });

  describe('create', () => {
    it('should create institution', async () => {
      createUseCase.execute.mockResolvedValue(mockInstitution);

      const result = await controller.create({
        name: 'Test Bank',
        type: 'bank',
        bankCode: 'test-bank',
        loginId: 'test',
        password: 'pass',
      } as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInstitution.toJSON());
    });
  });

  describe('findAll', () => {
    it('should get institutions', async () => {
      getUseCase.execute.mockResolvedValue([mockInstitution]);

      const result = await controller.findAll({});

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });
});
