import { Test, TestingModule } from '@nestjs/testing';
import { AssetBalanceDomainService } from './asset-balance-domain.service';
import { InstitutionEntity } from '../../../institution/domain/entities/institution.entity';
import { AccountEntity } from '../../../institution/domain/entities/account.entity';
import { InstitutionType } from '@account-book/types';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

describe('AssetBalanceDomainService', () => {
  let service: AssetBalanceDomainService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetBalanceDomainService],
    }).compile();

    service = module.get<AssetBalanceDomainService>(AssetBalanceDomainService);
  });

  describe('classifyAssetsAndLiabilities', () => {
    it('should classify assets and liabilities correctly', () => {
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

      const result = service.classifyAssetsAndLiabilities(institutions);

      expect(result.totalAssets).toBe(3000000);
      expect(result.totalLiabilities).toBe(50000);
      expect(result.netWorth).toBe(2950000);
    });

    it('should handle zero balance accounts', () => {
      const accounts = [
        createAccount('acc_1', 'inst_1', '普通預金', 1000000),
        createAccount('acc_2', 'inst_1', '当座預金', 0),
        createAccount('acc_3', 'inst_1', 'クレジットカード', -50000),
      ];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts),
      ];

      const result = service.classifyAssetsAndLiabilities(institutions);

      expect(result.totalAssets).toBe(1000000);
      expect(result.totalLiabilities).toBe(50000);
      expect(result.netWorth).toBe(950000);
    });

    it('should return zero when no institutions', () => {
      const institutions: InstitutionEntity[] = [];

      const result = service.classifyAssetsAndLiabilities(institutions);

      expect(result.totalAssets).toBe(0);
      expect(result.totalLiabilities).toBe(0);
      expect(result.netWorth).toBe(0);
    });

    it('should handle only assets', () => {
      const accounts = [
        createAccount('acc_1', 'inst_1', '普通預金', 1000000),
        createAccount('acc_2', 'inst_1', '定期預金', 2000000),
      ];
      const institutions = [
        createInstitution('inst_1', 'Bank A', InstitutionType.BANK, accounts),
      ];

      const result = service.classifyAssetsAndLiabilities(institutions);

      expect(result.totalAssets).toBe(3000000);
      expect(result.totalLiabilities).toBe(0);
      expect(result.netWorth).toBe(3000000);
    });

    it('should handle only liabilities', () => {
      const accounts = [
        createAccount('acc_1', 'inst_1', 'クレジットカード', -50000),
        createAccount('acc_2', 'inst_1', 'ローン', -200000),
      ];
      const institutions = [
        createInstitution(
          'inst_1',
          'Card A',
          InstitutionType.CREDIT_CARD,
          accounts,
        ),
      ];

      const result = service.classifyAssetsAndLiabilities(institutions);

      expect(result.totalAssets).toBe(0);
      expect(result.totalLiabilities).toBe(250000);
      expect(result.netWorth).toBe(-250000);
    });
  });

  describe('calculateNetWorth', () => {
    it('should calculate net worth correctly', () => {
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

      const result = service.calculateNetWorth(institutions);

      expect(result).toBe(950000);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      const result = service.calculatePercentage(1000000, 5000000);

      expect(result).toBe(20);
    });

    it('should return 0 when grandTotal is 0', () => {
      const result = service.calculatePercentage(1000000, 0);

      expect(result).toBe(0);
    });

    it('should handle decimal percentages', () => {
      const result = service.calculatePercentage(333333, 1000000);

      expect(result).toBeCloseTo(33.3333, 1);
    });

    it('should handle negative institutionTotal', () => {
      const result = service.calculatePercentage(-100000, 1000000);

      expect(result).toBe(-10);
    });
  });

  describe('calculateInstitutionTotal', () => {
    it('should calculate institution total correctly', () => {
      const accounts = [
        createAccount('acc_1', 'inst_1', '普通預金', 1000000),
        createAccount('acc_2', 'inst_1', '定期預金', 2000000),
        createAccount('acc_3', 'inst_1', 'クレジットカード', -50000),
      ];
      const institution = createInstitution(
        'inst_1',
        'Bank A',
        InstitutionType.BANK,
        accounts,
      );

      const result = service.calculateInstitutionTotal(institution);

      expect(result).toBe(2950000);
    });

    it('should return 0 when institution has no accounts', () => {
      const institution = createInstitution(
        'inst_1',
        'Bank A',
        InstitutionType.BANK,
        [],
      );

      const result = service.calculateInstitutionTotal(institution);

      expect(result).toBe(0);
    });

    it('should handle negative total (liabilities only)', () => {
      const accounts = [
        createAccount('acc_1', 'inst_1', 'クレジットカード', -50000),
        createAccount('acc_2', 'inst_1', 'ローン', -200000),
      ];
      const institution = createInstitution(
        'inst_1',
        'Card A',
        InstitutionType.CREDIT_CARD,
        accounts,
      );

      const result = service.calculateInstitutionTotal(institution);

      expect(result).toBe(-250000);
    });
  });
});
