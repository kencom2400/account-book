import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SyncTransactionsUseCase } from './sync-transactions.use-case';
import { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { ICreditCardRepository } from '../../../credit-card/domain/repositories/credit-card.repository.interface';
import { ISecuritiesAccountRepository } from '../../../securities/domain/repositories/securities-account.repository.interface';
import { RefreshCreditCardDataUseCase } from '../../../credit-card/application/use-cases/refresh-credit-card-data.use-case';
import { FetchSecurityTransactionsUseCase } from '../../../securities/application/use-cases/fetch-security-transactions.use-case';
import { IncrementalSyncStrategy } from '../../domain/strategies/incremental-sync.strategy';
import { SYNC_HISTORY_REPOSITORY } from '../../sync.tokens';
import { CREDIT_CARD_REPOSITORY } from '../../../credit-card/credit-card.tokens';
import { SECURITIES_ACCOUNT_REPOSITORY } from '../../../securities/securities.tokens';

describe('SyncTransactionsUseCase', () => {
  let useCase: SyncTransactionsUseCase;

  beforeEach(async () => {
    const mockSyncHistoryRepository: Partial<ISyncHistoryRepository> = {
      create: jest.fn(),
      update: jest.fn(),
      findLatest: jest.fn(),
    };

    const mockCreditCardRepository: Partial<ICreditCardRepository> = {
      findAll: jest.fn().mockResolvedValue([]),
      findByConnectionStatus: jest.fn().mockResolvedValue([]),
    };

    const mockSecuritiesAccountRepository: Partial<ISecuritiesAccountRepository> =
      {
        findAll: jest.fn().mockResolvedValue([]),
        findByConnectionStatus: jest.fn().mockResolvedValue([]),
      };

    const mockRefreshCreditCardDataUseCase = {
      execute: jest.fn(),
    };

    const mockFetchSecurityTransactionsUseCase = {
      execute: jest.fn(),
    };

    const mockIncrementalSyncStrategy = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncTransactionsUseCase,
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
        {
          provide: IncrementalSyncStrategy,
          useValue: mockIncrementalSyncStrategy,
        },
      ],
    }).compile();

    useCase = module.get<SyncTransactionsUseCase>(SyncTransactionsUseCase);
  });

  describe('execute', () => {
    it('should throw a deprecation error when called', async () => {
      // Arrange
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');

      // Act & Assert
      await expect(useCase.execute({})).rejects.toThrow(
        'SyncTransactionsUseCase is deprecated. Please use SyncAllTransactionsUseCase.',
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'sync-transactions.use-case.ts は非推奨です。SyncAllTransactionsUseCaseを使用してください。',
      );
    });
  });
});
