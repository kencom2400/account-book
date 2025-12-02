import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { InstitutionAggregationService } from './institution-aggregation.service';

// Repository interfaces
import {
  INSTITUTION_REPOSITORY,
  BANK_API_ADAPTER,
} from '../../../institution/institution.tokens';
import type { IInstitutionRepository } from '../../../institution/domain/repositories/institution.repository.interface';
import type { IBankApiAdapter } from '../../../institution/domain/adapters/bank-api.adapter.interface';
import {
  CREDIT_CARD_REPOSITORY,
  CREDIT_CARD_API_CLIENT,
} from '../../../credit-card/credit-card.tokens';
import type { ICreditCardRepository } from '../../../credit-card/domain/repositories/credit-card.repository.interface';
import type { ICreditCardAPIClient } from '../../../credit-card/infrastructure/adapters/credit-card-api.adapter.interface';
import {
  SECURITIES_ACCOUNT_REPOSITORY,
  SECURITIES_API_CLIENT,
} from '../../../securities/securities.tokens';
import type { ISecuritiesAccountRepository } from '../../../securities/domain/repositories/securities.repository.interface';
import type { ISecuritiesAPIClient } from '../../../securities/infrastructure/adapters/securities-api.adapter.interface';

describe('InstitutionAggregationService', () => {
  let service: InstitutionAggregationService;
  let institutionRepository: jest.Mocked<IInstitutionRepository>;
  let creditCardRepository: jest.Mocked<ICreditCardRepository>;
  let securitiesRepository: jest.Mocked<ISecuritiesAccountRepository>;
  let bankApiAdapter: jest.Mocked<IBankApiAdapter>;
  let creditCardApiClient: jest.Mocked<ICreditCardAPIClient>;
  let securitiesApiClient: jest.Mocked<ISecuritiesAPIClient>;

  // Simple mock objects instead of real entities
  const mockBank = {
    id: 'bank_1',
    name: 'Test Bank',
  };

  const mockCreditCard = {
    id: 'card_1',
    issuer: 'VISA Card',
  };

  const mockSecurities = {
    id: 'sec_1',
    securitiesCompanyName: 'Test Securities',
  };

  beforeEach(async () => {
    const mockInstitutionRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockCreditCardRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockSecuritiesRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockBankApi = {
      testConnection: jest.fn(),
    };

    const mockCreditCardApi = {
      testConnection: jest.fn(),
    };

    const mockSecuritiesApi = {
      testConnection: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionAggregationService,
        {
          provide: INSTITUTION_REPOSITORY,
          useValue: mockInstitutionRepo,
        },
        {
          provide: CREDIT_CARD_REPOSITORY,
          useValue: mockCreditCardRepo,
        },
        {
          provide: SECURITIES_ACCOUNT_REPOSITORY,
          useValue: mockSecuritiesRepo,
        },
        {
          provide: BANK_API_ADAPTER,
          useValue: mockBankApi,
        },
        {
          provide: CREDIT_CARD_API_CLIENT,
          useValue: mockCreditCardApi,
        },
        {
          provide: SECURITIES_API_CLIENT,
          useValue: mockSecuritiesApi,
        },
      ],
    }).compile();

    module.useLogger(false);

    service = module.get<InstitutionAggregationService>(
      InstitutionAggregationService,
    );
    institutionRepository = module.get(INSTITUTION_REPOSITORY);
    creditCardRepository = module.get(CREDIT_CARD_REPOSITORY);
    securitiesRepository = module.get(SECURITIES_ACCOUNT_REPOSITORY);
    bankApiAdapter = module.get(BANK_API_ADAPTER);
    creditCardApiClient = module.get(CREDIT_CARD_API_CLIENT);
    securitiesApiClient = module.get(SECURITIES_API_CLIENT);
  });

  describe('getAllInstitutions', () => {
    it('should aggregate all types of institutions', async () => {
      institutionRepository.findAll.mockResolvedValue([mockBank as any]);
      creditCardRepository.findAll.mockResolvedValue([mockCreditCard as any]);
      securitiesRepository.findAll.mockResolvedValue([mockSecurities as any]);

      const result = await service.getAllInstitutions();

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        id: 'bank_1',
        name: 'Test Bank',
        type: 'bank',
      });
      expect(result[0].apiClient).toBe(bankApiAdapter);

      expect(result[1]).toMatchObject({
        id: 'card_1',
        name: 'VISA Card',
        type: 'credit-card',
      });
      expect(result[1].apiClient).toBe(creditCardApiClient);

      expect(result[2]).toMatchObject({
        id: 'sec_1',
        name: 'Test Securities',
        type: 'securities',
      });
      expect(result[2].apiClient).toBe(securitiesApiClient);
    });

    it('should handle empty results from all repositories', async () => {
      institutionRepository.findAll.mockResolvedValue([]);
      creditCardRepository.findAll.mockResolvedValue([]);
      securitiesRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllInstitutions();

      expect(result).toHaveLength(0);
    });

    it('should continue when bank repository fails', async () => {
      const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn');

      institutionRepository.findAll.mockRejectedValue(
        new Error('Bank repo error'),
      );
      creditCardRepository.findAll.mockResolvedValue([mockCreditCard as any]);
      securitiesRepository.findAll.mockResolvedValue([mockSecurities as any]);

      const result = await service.getAllInstitutions();

      expect(result).toHaveLength(2); // Only credit card and securities
      expect(result[0].type).toBe('credit-card');
      expect(result[1].type).toBe('securities');
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        '銀行の取得に失敗しました',
        expect.any(String),
      );

      loggerWarnSpy.mockRestore();
    });

    it('should continue when credit card repository fails', async () => {
      const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn');

      institutionRepository.findAll.mockResolvedValue([mockBank as any]);
      creditCardRepository.findAll.mockRejectedValue(
        new Error('Credit card repo error'),
      );
      securitiesRepository.findAll.mockResolvedValue([mockSecurities as any]);

      const result = await service.getAllInstitutions();

      expect(result).toHaveLength(2); // Only bank and securities
      expect(result[0].type).toBe('bank');
      expect(result[1].type).toBe('securities');
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'クレジットカードの取得に失敗しました',
        expect.any(String),
      );

      loggerWarnSpy.mockRestore();
    });

    it('should continue when securities repository fails', async () => {
      const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn');

      institutionRepository.findAll.mockResolvedValue([mockBank as any]);
      creditCardRepository.findAll.mockResolvedValue([mockCreditCard as any]);
      securitiesRepository.findAll.mockRejectedValue(
        new Error('Securities repo error'),
      );

      const result = await service.getAllInstitutions();

      expect(result).toHaveLength(2); // Only bank and credit card
      expect(result[0].type).toBe('bank');
      expect(result[1].type).toBe('credit-card');
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        '証券口座の取得に失敗しました',
        expect.any(String),
      );

      loggerWarnSpy.mockRestore();
    });

    it('should handle all repositories failing', async () => {
      institutionRepository.findAll.mockRejectedValue(new Error('Error 1'));
      creditCardRepository.findAll.mockRejectedValue(new Error('Error 2'));
      securitiesRepository.findAll.mockRejectedValue(new Error('Error 3'));

      const result = await service.getAllInstitutions();

      expect(result).toHaveLength(0);
    });

    it('should aggregate multiple institutions of each type', async () => {
      const mockBank2 = {
        id: 'bank_2',
        name: 'Test Bank 2',
      };
      const mockCard2 = {
        id: 'card_2',
        issuer: 'Master Card',
      };

      institutionRepository.findAll.mockResolvedValue([
        mockBank as any,
        mockBank2 as any,
      ]);
      creditCardRepository.findAll.mockResolvedValue([
        mockCreditCard as any,
        mockCard2 as any,
      ]);
      securitiesRepository.findAll.mockResolvedValue([mockSecurities as any]);

      const result = await service.getAllInstitutions();

      expect(result).toHaveLength(5);
      expect(result.filter((i) => i.type === 'bank')).toHaveLength(2);
      expect(result.filter((i) => i.type === 'credit-card')).toHaveLength(2);
      expect(result.filter((i) => i.type === 'securities')).toHaveLength(1);
    });
  });

  describe('getInstitutionById', () => {
    it('should find institution by id', async () => {
      institutionRepository.findAll.mockResolvedValue([mockBank as any]);
      creditCardRepository.findAll.mockResolvedValue([mockCreditCard as any]);
      securitiesRepository.findAll.mockResolvedValue([mockSecurities as any]);

      const result = await service.getInstitutionById('card_1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('card_1');
      expect(result?.type).toBe('credit-card');
    });

    it('should return null when institution not found', async () => {
      institutionRepository.findAll.mockResolvedValue([mockBank as any]);
      creditCardRepository.findAll.mockResolvedValue([mockCreditCard as any]);
      securitiesRepository.findAll.mockResolvedValue([mockSecurities as any]);

      const result = await service.getInstitutionById('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when all repositories return empty', async () => {
      institutionRepository.findAll.mockResolvedValue([]);
      creditCardRepository.findAll.mockResolvedValue([]);
      securitiesRepository.findAll.mockResolvedValue([]);

      const result = await service.getInstitutionById('any_id');

      expect(result).toBeNull();
    });
  });
});
