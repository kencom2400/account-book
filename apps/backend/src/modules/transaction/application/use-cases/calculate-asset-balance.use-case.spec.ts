import { Test, TestingModule } from '@nestjs/testing';
import { CalculateAssetBalanceUseCase } from './calculate-asset-balance.use-case';
import { INSTITUTION_REPOSITORY } from '../../../institution/institution.tokens';
import type { IInstitutionRepository } from '../../../institution/domain/repositories/institution.repository.interface';
import { AssetBalanceDomainService } from '../../domain/services/asset-balance-domain.service';
import { InstitutionEntity } from '../../../institution/domain/entities/institution.entity';
import { AccountEntity } from '../../../institution/domain/entities/account.entity';
import { InstitutionType, AccountType } from '@account-book/types';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

describe('CalculateAssetBalanceUseCase', () => {
  let useCase: CalculateAssetBalanceUseCase;
  let institutionRepository: jest.Mocked<IInstitutionRepository>;

  const createAccount = (
    id: string,
    institutionId: string,
    accountName: string,
    balance = 0,
  ): AccountEntity => {
    return new AccountEntity(
      id,
      institutionId,
      `account-${id}`,
      accountName,
      balance,
      'JPY',
    );
  };

  const createInstitution = (
    id: string,
    name: string,
    type: InstitutionType,
    accounts: AccountEntity[] = [],
  ): InstitutionEntity => {
    const credentials = new EncryptedCredentials(
      'encrypted',
      'iv',
      'authTag',
      'algorithm',
      'version',
    );
    return new InstitutionEntity(
      id,
      name,
      type,
      credentials,
      true,
      new Date(),
      accounts,
      new Date(),
      new Date(),
    );
  };

  beforeEach(async () => {
    const mockInstitutionRepo = {
      findAll: jest.fn(),
      findByIds: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalculateAssetBalanceUseCase,
        AssetBalanceDomainService,
        {
          provide: INSTITUTION_REPOSITORY,
          useValue: mockInstitutionRepo,
        },
      ],
    }).compile();

    useCase = module.get<CalculateAssetBalanceUseCase>(
      CalculateAssetBalanceUseCase,
    );
    institutionRepository = module.get(INSTITUTION_REPOSITORY);
  });

  describe('execute', () => {
    it('should calculate asset balance correctly', async () => {
      const accounts1 = [
        createAccount('acc_1', 'inst_1', '普通預金', 1000000),
        createAccount('acc_2', 'inst_1', '定期預金', 2000000),
      ];
      const accounts2 = [
        createAccount('acc_3', 'inst_2', 'クレジットカード', -50000),
      ];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts1),
        createInstitution(
          'inst_2',
          'Card B',
          InstitutionType.CREDIT_CARD,
          accounts2,
        ),
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);

      const result = await useCase.execute();

      expect(result.totalAssets).toBe(3000000);
      expect(result.totalLiabilities).toBe(50000);
      expect(result.netWorth).toBe(2950000);
      expect(result.institutions).toHaveLength(2);
      expect(result.previousMonth.diff).toBe(0);
      expect(result.previousMonth.rate).toBe(0);
      expect(result.previousYear.diff).toBe(0);
      expect(result.previousYear.rate).toBe(0);
    });

    it('should use provided asOfDate', async () => {
      const accounts = [createAccount('acc_1', 'inst_1', '普通預金', 1000000)];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts),
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);

      const asOfDate = new Date('2025-01-15');
      const result = await useCase.execute(asOfDate);

      expect(result.asOfDate).toBe(asOfDate.toISOString());
    });

    it('should use current date when asOfDate is not provided', async () => {
      const mockDate = new Date('2025-01-20T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const accounts = [createAccount('acc_1', 'inst_1', '普通預金', 1000000)];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts),
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);

      const result = await useCase.execute();

      expect(result.asOfDate).toBe(mockDate.toISOString());

      jest.useRealTimers();
    });

    it('should return empty institutions array when no institutions exist', async () => {
      institutionRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result.totalAssets).toBe(0);
      expect(result.totalLiabilities).toBe(0);
      expect(result.netWorth).toBe(0);
      expect(result.institutions).toHaveLength(0);
    });

    it('should calculate percentage correctly for assets', async () => {
      const accounts1 = [createAccount('acc_1', 'inst_1', '普通預金', 1000000)];
      const accounts2 = [createAccount('acc_2', 'inst_2', '定期預金', 2000000)];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts1),
        createInstitution('inst_2', 'Bank B', InstitutionType.BANK, accounts2),
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);

      const result = await useCase.execute();

      expect(result.institutions[0]?.percentage).toBeCloseTo(33.333, 1);
      expect(result.institutions[1]?.percentage).toBeCloseTo(66.667, 1);
    });

    it('should return 0.0 percentage for liabilities', async () => {
      const accounts1 = [createAccount('acc_1', 'inst_1', '普通預金', 1000000)];
      const accounts2 = [
        createAccount('acc_2', 'inst_2', 'クレジットカード', -50000),
      ];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts1),
        createInstitution(
          'inst_2',
          'Card B',
          InstitutionType.CREDIT_CARD,
          accounts2,
        ),
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);

      const result = await useCase.execute();

      const liabilityInstitution = result.institutions.find(
        (inst) => inst.institutionId === 'inst_2',
      );
      expect(liabilityInstitution?.percentage).toBe(0.0);
    });

    it('should infer account type correctly', async () => {
      const accounts = [
        createAccount('acc_1', 'inst_1', '普通預金', 1000000),
        createAccount('acc_2', 'inst_1', '定期預金', 2000000),
        createAccount('acc_3', 'inst_1', 'クレジットカード', -50000),
        createAccount('acc_4', 'inst_1', '株式口座', 500000),
        createAccount('acc_5', 'inst_1', '投資信託', 300000),
        createAccount('acc_6', 'inst_1', 'その他口座', 100000),
      ];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts),
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);

      const result = await useCase.execute();

      expect(result.institutions[0]?.accounts[0]?.accountType).toBe(
        AccountType.SAVINGS,
      );
      expect(result.institutions[0]?.accounts[1]?.accountType).toBe(
        AccountType.TIME_DEPOSIT,
      );
      expect(result.institutions[0]?.accounts[2]?.accountType).toBe(
        AccountType.CREDIT_CARD,
      );
      expect(result.institutions[0]?.accounts[3]?.accountType).toBe(
        AccountType.STOCK,
      );
      expect(result.institutions[0]?.accounts[4]?.accountType).toBe(
        AccountType.MUTUAL_FUND,
      );
      expect(result.institutions[0]?.accounts[5]?.accountType).toBe(
        AccountType.OTHER,
      );
    });

    it('should return correct icons for institution types', async () => {
      const accounts = [createAccount('acc_1', 'inst_1', '普通預金', 1000000)];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts),
        createInstitution(
          'inst_2',
          'Card B',
          InstitutionType.CREDIT_CARD,
          accounts,
        ),
        createInstitution(
          'inst_3',
          'Securities C',
          InstitutionType.SECURITIES,
          accounts,
        ),
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);

      const result = await useCase.execute();

      expect(result.institutions[0]?.icon).toBe('🏦');
      expect(result.institutions[1]?.icon).toBe('💳');
      expect(result.institutions[2]?.icon).toBe('📈');
    });

    it('should return default icon for unknown institution type', async () => {
      const accounts = [createAccount('acc_1', 'inst_1', '普通預金', 1000000)];
      // @ts-expect-error - テストのため、未知のInstitutionTypeを渡す
      const institutions = [
        createInstitution(
          'inst_1',
          'Unknown',
          'UNKNOWN' as InstitutionType,
          accounts,
        ),
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);

      const result = await useCase.execute();

      expect(result.institutions[0]?.icon).toBe('🏛️');
    });

    it('should handle institution with multiple accounts', async () => {
      const accounts = [
        createAccount('acc_1', 'inst_1', '普通預金', 1000000),
        createAccount('acc_2', 'inst_1', '定期預金', 2000000),
        createAccount('acc_3', 'inst_1', '当座預金', 500000),
      ];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts),
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);

      const result = await useCase.execute();

      expect(result.institutions[0]?.accounts).toHaveLength(3);
      expect(result.institutions[0]?.total).toBe(3500000);
    });

    it('should handle mixed assets and liabilities', async () => {
      const accounts1 = [
        createAccount('acc_1', 'inst_1', '普通預金', 1000000),
        createAccount('acc_2', 'inst_1', '定期預金', 2000000),
      ];
      const accounts2 = [
        createAccount('acc_3', 'inst_2', 'クレジットカード', -50000),
        createAccount('acc_4', 'inst_2', 'ローン', -200000),
      ];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts1),
        createInstitution(
          'inst_2',
          'Card B',
          InstitutionType.CREDIT_CARD,
          accounts2,
        ),
      ];

      institutionRepository.findAll.mockResolvedValue(institutions);

      const result = await useCase.execute();

      expect(result.totalAssets).toBe(3000000);
      expect(result.totalLiabilities).toBe(250000);
      expect(result.netWorth).toBe(2750000);
      expect(result.institutions[0]?.total).toBe(3000000);
      expect(result.institutions[1]?.total).toBe(-250000);
    });
  });
});
