import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FetchHoldingsUseCase } from './fetch-holdings.use-case';
import type {
  ISecuritiesAccountRepository,
  IHoldingRepository,
} from '../../domain/repositories/securities.repository.interface';
import type { ISecuritiesAPIClient } from '../../infrastructure/adapters/securities-api.adapter.interface';
import type { ICryptoService } from '../../../institution/domain/services/crypto.service.interface';
import {
  SECURITIES_ACCOUNT_REPOSITORY,
  HOLDING_REPOSITORY,
  SECURITIES_API_CLIENT,
} from '../../securities.tokens';
import { CRYPTO_SERVICE } from '../../../institution/institution.tokens';
import { SecuritiesAccountEntity } from '../../domain/entities/securities-account.entity';
import { HoldingEntity } from '../../domain/entities/holding.entity';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';

describe('FetchHoldingsUseCase', () => {
  let useCase: FetchHoldingsUseCase;
  let accountRepository: jest.Mocked<ISecuritiesAccountRepository>;
  let holdingRepository: jest.Mocked<IHoldingRepository>;
  let securitiesAPIClient: jest.Mocked<ISecuritiesAPIClient>;
  let cryptoService: jest.Mocked<ICryptoService>;

  beforeEach(async () => {
    const mockAccountRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    const mockHoldingRepository = {
      findByAccountId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
    };

    const mockSecuritiesAPIClient = {
      testConnection: jest.fn(),
      getAccountInfo: jest.fn(),
      getHoldings: jest.fn(),
      getTransactions: jest.fn(),
      mapToHoldingEntity: jest.fn(),
      mapToTransactionEntity: jest.fn(),
    };

    const mockCryptoService = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FetchHoldingsUseCase,
        {
          provide: SECURITIES_ACCOUNT_REPOSITORY,
          useValue: mockAccountRepository,
        },
        {
          provide: HOLDING_REPOSITORY,
          useValue: mockHoldingRepository,
        },
        {
          provide: SECURITIES_API_CLIENT,
          useValue: mockSecuritiesAPIClient,
        },
        {
          provide: CRYPTO_SERVICE,
          useValue: mockCryptoService,
        },
      ],
    }).compile();

    useCase = module.get<FetchHoldingsUseCase>(FetchHoldingsUseCase);
    accountRepository = module.get(SECURITIES_ACCOUNT_REPOSITORY);
    holdingRepository = module.get(HOLDING_REPOSITORY);
    securitiesAPIClient = module.get(SECURITIES_API_CLIENT);
    cryptoService = module.get(CRYPTO_SERVICE);
  });

  describe('execute', () => {
    const mockCredentials = new EncryptedCredentials(
      'encrypted_data',
      'iv',
      'authTag',
    );

    const mockAccount = new SecuritiesAccountEntity(
      'sec_test_123',
      'Test Securities',
      'ACC123',
      'general',
      mockCredentials,
      true,
      new Date('2024-01-01'),
      1000000,
      500000,
      new Date('2024-01-01'),
      new Date('2024-01-01'),
    );

    const mockHoldings = [
      new HoldingEntity(
        'holding_1',
        'sec_test_123',
        '1234',
        'Test Stock A',
        100,
        900,
        1000,
        'stock',
        'TSE',
        new Date('2024-01-01'),
      ),
      new HoldingEntity(
        'holding_2',
        'sec_test_123',
        '5678',
        'Test Stock B',
        50,
        1800,
        2000,
        'stock',
        'TSE',
        new Date('2024-01-01'),
      ),
    ];

    it('証券口座が存在しない場合、NotFoundExceptionをスローする', async () => {
      accountRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({ accountId: 'non_existent' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        useCase.execute({ accountId: 'non_existent' }),
      ).rejects.toThrow('Securities account not found: non_existent');
    });

    it('forceRefreshがfalseの場合、リポジトリから保有銘柄を取得する', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount);
      holdingRepository.findByAccountId.mockResolvedValue(mockHoldings);

      const result = await useCase.execute({ accountId: 'sec_test_123' });

      expect(result).toEqual(mockHoldings);
      expect(holdingRepository.findByAccountId).toHaveBeenCalledWith(
        'sec_test_123',
      );
      expect(securitiesAPIClient.getHoldings).not.toHaveBeenCalled();
    });

    it('forceRefreshがtrueの場合、APIから最新データを取得する', async () => {
      const decryptedCredentials = {
        loginId: 'test_user',
        password: 'test_password',
        tradingPassword: 'test_trading_password',
      };

      accountRepository.findById.mockResolvedValue(mockAccount);
      holdingRepository.findByAccountId.mockResolvedValue(mockHoldings);
      cryptoService.decrypt.mockReturnValue(
        JSON.stringify(decryptedCredentials),
      );
      securitiesAPIClient.getHoldings.mockResolvedValue([
        {
          securityCode: '1234',
          securityName: 'Test Stock A',
          quantity: 150, // 数量が更新されている
          currentPrice: 1100,
        },
      ]);
      securitiesAPIClient.mapToHoldingEntity.mockImplementation(
        (accountId, holding) =>
          new HoldingEntity(
            'holding_1',
            accountId,
            holding.securityCode,
            holding.securityName,
            holding.quantity,
            holding.currentPrice * 0.9, // averageAcquisitionPrice
            holding.currentPrice,
            'stock',
            'TSE',
            new Date(),
          ),
      );

      const result = await useCase.execute({
        accountId: 'sec_test_123',
        forceRefresh: true,
      });

      expect(cryptoService.decrypt).toHaveBeenCalledWith(mockCredentials);
      expect(securitiesAPIClient.getHoldings).toHaveBeenCalledWith({
        loginId: 'test_user',
        password: 'test_password',
        tradingPassword: 'test_trading_password',
        accountNumber: 'ACC123',
      });
      // リフレッシュ後、リポジトリから再取得された最新データが返される
      expect(result).toHaveLength(2); // 元の2件が返される（リフレッシュ後にfindByAccountIdが呼ばれる）
    });

    it('APIリフレッシュ時、既存の保有銘柄を更新する', async () => {
      const decryptedCredentials = {
        loginId: 'test_user',
        password: 'test_password',
      };

      accountRepository.findById.mockResolvedValue(mockAccount);
      holdingRepository.findByAccountId.mockResolvedValue(mockHoldings);
      cryptoService.decrypt.mockReturnValue(
        JSON.stringify(decryptedCredentials),
      );
      securitiesAPIClient.getHoldings.mockResolvedValue([
        {
          securityCode: '1234',
          securityName: 'Test Stock A',
          quantity: 150,
          currentPrice: 1100,
        },
      ]);
      securitiesAPIClient.mapToHoldingEntity.mockImplementation(
        (accountId, holding) =>
          new HoldingEntity(
            'holding_1',
            accountId,
            holding.securityCode,
            holding.securityName,
            holding.quantity,
            holding.currentPrice * 0.9, // averageAcquisitionPrice
            holding.currentPrice,
            'stock',
            'TSE',
            new Date(),
          ),
      );

      await useCase.execute({ accountId: 'sec_test_123', forceRefresh: true });

      expect(holdingRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          securityCode: '1234',
          quantity: 150,
          currentPrice: 1100,
        }),
      );
    });

    it('APIリフレッシュ時、新規の保有銘柄を作成する', async () => {
      const decryptedCredentials = {
        loginId: 'test_user',
        password: 'test_password',
      };

      accountRepository.findById.mockResolvedValue(mockAccount);
      holdingRepository.findByAccountId.mockResolvedValue(mockHoldings);
      cryptoService.decrypt.mockReturnValue(
        JSON.stringify(decryptedCredentials),
      );
      securitiesAPIClient.getHoldings.mockResolvedValue([
        {
          securityCode: '1234',
          securityName: 'Test Stock A',
          quantity: 100,
          currentPrice: 1000,
        },
        {
          securityCode: '9999', // 新規銘柄
          securityName: 'New Stock',
          quantity: 200,
          currentPrice: 500,
        },
      ]);
      securitiesAPIClient.mapToHoldingEntity.mockImplementation(
        (accountId, holding) =>
          new HoldingEntity(
            `holding_${holding.securityCode}`,
            accountId,
            holding.securityCode,
            holding.securityName,
            holding.quantity,
            holding.currentPrice * 0.9, // averageAcquisitionPrice
            holding.currentPrice,
            'stock',
            'TSE',
            new Date(),
          ),
      );

      await useCase.execute({ accountId: 'sec_test_123', forceRefresh: true });

      expect(holdingRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          securityCode: '9999',
          securityName: 'New Stock',
          quantity: 200,
        }),
      );
    });

    it('APIリフレッシュ時、売却済みの保有銘柄を削除する', async () => {
      const decryptedCredentials = {
        loginId: 'test_user',
        password: 'test_password',
      };

      accountRepository.findById.mockResolvedValue(mockAccount);
      holdingRepository.findByAccountId.mockResolvedValue(mockHoldings);
      cryptoService.decrypt.mockReturnValue(
        JSON.stringify(decryptedCredentials),
      );
      securitiesAPIClient.getHoldings.mockResolvedValue([
        {
          securityCode: '1234',
          securityName: 'Test Stock A',
          quantity: 100,
          currentPrice: 1000,
        },
        // 5678は存在しない（売却済み）
      ]);
      securitiesAPIClient.mapToHoldingEntity.mockImplementation(
        (accountId, holding) =>
          new HoldingEntity(
            `holding_${holding.securityCode}`,
            accountId,
            holding.securityCode,
            holding.securityName,
            holding.quantity,
            holding.currentPrice * 0.9, // averageAcquisitionPrice
            holding.currentPrice,
            'stock',
            'TSE',
            new Date(),
          ),
      );

      await useCase.execute({ accountId: 'sec_test_123', forceRefresh: true });

      expect(holdingRepository.delete).toHaveBeenCalledWith('holding_2');
    });

    it('APIリフレッシュ時、口座の最終同期日時を更新する', async () => {
      const decryptedCredentials = {
        loginId: 'test_user',
        password: 'test_password',
      };

      accountRepository.findById.mockResolvedValue(mockAccount);
      holdingRepository.findByAccountId.mockResolvedValue([]);
      cryptoService.decrypt.mockReturnValue(
        JSON.stringify(decryptedCredentials),
      );
      securitiesAPIClient.getHoldings.mockResolvedValue([]);

      await useCase.execute({ accountId: 'sec_test_123', forceRefresh: true });

      expect(accountRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'sec_test_123',
          lastSyncedAt: expect.any(Date),
        }),
      );
    });

    it('APIリフレッシュが失敗した場合、エラーをスローする', async () => {
      const decryptedCredentials = {
        loginId: 'test_user',
        password: 'test_password',
      };

      accountRepository.findById.mockResolvedValue(mockAccount);
      holdingRepository.findByAccountId.mockResolvedValue(mockHoldings);
      cryptoService.decrypt.mockReturnValue(
        JSON.stringify(decryptedCredentials),
      );
      securitiesAPIClient.getHoldings.mockRejectedValue(new Error('API Error'));

      await expect(
        useCase.execute({ accountId: 'sec_test_123', forceRefresh: true }),
      ).rejects.toThrow('API Error');
    });

    it('保有銘柄が空の場合でも正常に動作する', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount);
      holdingRepository.findByAccountId.mockResolvedValue([]);

      const result = await useCase.execute({ accountId: 'sec_test_123' });

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });
});
