import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SyncTransactionsUseCase } from './sync-transactions.use-case';
import { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { ICreditCardRepository } from '../../../credit-card/domain/repositories/credit-card.repository.interface';
import { ISecuritiesAccountRepository } from '../../../securities/domain/repositories/securities-account.repository.interface';
import { RefreshCreditCardDataUseCase } from '../../../credit-card/application/use-cases/refresh-credit-card-data.use-case';
import { FetchSecurityTransactionsUseCase } from '../../../securities/application/use-cases/fetch-security-transactions.use-case';
import { IncrementalSyncStrategy } from '../strategies/incremental-sync.strategy';
import { SYNC_HISTORY_REPOSITORY } from '../../sync.tokens';
import { CREDIT_CARD_REPOSITORY } from '../../../credit-card/credit-card.tokens';
import { SECURITIES_ACCOUNT_REPOSITORY } from '../../../securities/securities.tokens';
import { SyncHistoryEntity } from '../../domain/entities/sync-history.entity';
import { SyncStatus } from '../../domain/enums/sync-status.enum';
import { CreditCardEntity } from '../../../credit-card/domain/entities/credit-card.entity';
import { SecuritiesAccountEntity } from '../../../securities/domain/entities/securities-account.entity';

describe('SyncTransactionsUseCase', () => {
  let useCase: SyncTransactionsUseCase;
  let syncHistoryRepository: jest.Mocked<ISyncHistoryRepository>;
  let creditCardRepository: jest.Mocked<ICreditCardRepository>;
  let securitiesAccountRepository: jest.Mocked<ISecuritiesAccountRepository>;
  let refreshCreditCardDataUseCase: jest.Mocked<RefreshCreditCardDataUseCase>;
  let fetchSecurityTransactionsUseCase: jest.Mocked<FetchSecurityTransactionsUseCase>;
  let mockLogger: Partial<Logger>;

  beforeEach(async () => {
    // 意図的なエラーテストのLogger出力を抑制
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // Loggerのモック作成
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const mockSyncHistoryRepository: Partial<ISyncHistoryRepository> = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findLatest: jest.fn(),
      findByDateRange: jest.fn(),
    };

    const mockCreditCardRepository: Partial<ICreditCardRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    const mockSecuritiesAccountRepository: Partial<ISecuritiesAccountRepository> =
      {
        findAll: jest.fn(),
        findById: jest.fn(),
        update: jest.fn(),
      };

    const mockRefreshCreditCardDataUseCase = {
      execute: jest.fn(),
    };

    const mockFetchSecurityTransactionsUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncTransactionsUseCase,
        IncrementalSyncStrategy,
        {
          provide: SYNC_HISTORY_REPOSITORY,
          useValue: mockSyncHistoryRepository,
        },
        {
          provide: CREDIT_CARD_REPOSITORY,
          useValue: mockCreditCardRepository,
        },
        {
          provide: SECURITIES_ACCOUNT_REPOSITORY,
          useValue: mockSecuritiesAccountRepository,
        },
        {
          provide: RefreshCreditCardDataUseCase,
          useValue: mockRefreshCreditCardDataUseCase,
        },
        {
          provide: FetchSecurityTransactionsUseCase,
          useValue: mockFetchSecurityTransactionsUseCase,
        },
      ],
    })
      .setLogger(mockLogger as Logger)
      .compile();

    useCase = module.get<SyncTransactionsUseCase>(SyncTransactionsUseCase);
    syncHistoryRepository = module.get(SYNC_HISTORY_REPOSITORY);
    creditCardRepository = module.get(CREDIT_CARD_REPOSITORY);
    securitiesAccountRepository = module.get(SECURITIES_ACCOUNT_REPOSITORY);
    refreshCreditCardDataUseCase = module.get(RefreshCreditCardDataUseCase);
    fetchSecurityTransactionsUseCase = module.get(
      FetchSecurityTransactionsUseCase,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('execute', () => {
    it('should sync all connected institutions successfully', async () => {
      // Arrange
      const mockCreditCard = {
        id: 'cc_1',
        isConnected: true,
        lastSyncedAt: null,
      } as CreditCardEntity;

      const mockSecuritiesAccount = {
        id: 'sec_1',
        isConnected: true,
        lastSyncedAt: null,
      } as SecuritiesAccountEntity;

      creditCardRepository.findAll.mockResolvedValue([mockCreditCard]);
      securitiesAccountRepository.findAll.mockResolvedValue([
        mockSecuritiesAccount,
      ]);

      const mockSyncHistory = SyncHistoryEntity.create(2);
      syncHistoryRepository.create.mockResolvedValue(mockSyncHistory);
      syncHistoryRepository.update.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      refreshCreditCardDataUseCase.execute.mockResolvedValue({
        cardInfo: {} as any,
        transactions: [{ id: '1', date: new Date() } as any],
        paymentInfo: {} as any,
      });

      fetchSecurityTransactionsUseCase.execute.mockResolvedValue([
        { id: '2', date: new Date() } as any,
      ]);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.newTransactionsCount).toBe(2);
      expect(result.syncHistory.status).toBe(SyncStatus.SUCCESS);
    });

    it('should handle empty institutions gracefully', async () => {
      // Arrange
      creditCardRepository.findAll.mockResolvedValue([]);
      securitiesAccountRepository.findAll.mockResolvedValue([]);

      const mockSyncHistory = SyncHistoryEntity.create(0)
        .start()
        .complete(0, 0, 0);
      syncHistoryRepository.create.mockResolvedValue(mockSyncHistory);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
      expect(result.newTransactionsCount).toBe(0);
      expect(result.syncHistory.totalInstitutions).toBe(0);
    });

    it('should continue syncing when one institution fails', async () => {
      // Arrange
      const mockCreditCard = {
        id: 'cc_1',
        isConnected: true,
        lastSyncedAt: null,
      } as CreditCardEntity;

      const mockSecuritiesAccount = {
        id: 'sec_1',
        isConnected: true,
        lastSyncedAt: null,
      } as SecuritiesAccountEntity;

      creditCardRepository.findAll.mockResolvedValue([mockCreditCard]);
      securitiesAccountRepository.findAll.mockResolvedValue([
        mockSecuritiesAccount,
      ]);

      const mockSyncHistory = SyncHistoryEntity.create(2);
      syncHistoryRepository.create.mockResolvedValue(mockSyncHistory);
      syncHistoryRepository.update.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      // Credit card sync fails
      refreshCreditCardDataUseCase.execute.mockRejectedValue(
        new Error('Connection timeout'),
      );

      // Securities sync succeeds
      fetchSecurityTransactionsUseCase.execute.mockResolvedValue([
        { id: '2', date: new Date() } as any,
      ]);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.syncHistory.status).toBe(SyncStatus.PARTIAL_SUCCESS);
    });
  });
});
