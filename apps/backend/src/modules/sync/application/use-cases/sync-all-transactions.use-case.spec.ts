import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SyncAllTransactionsUseCase } from './sync-all-transactions.use-case';
import { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { IInstitutionRepository } from '../../../institution/domain/repositories/institution.repository.interface';
import { ICreditCardRepository } from '../../../credit-card/domain/repositories/credit-card.repository.interface';
import { ISecuritiesAccountRepository } from '../../../securities/domain/repositories/securities.repository.interface';
import { FetchCreditCardTransactionsUseCase } from '../../../credit-card/application/use-cases/fetch-credit-card-transactions.use-case';
import { FetchSecurityTransactionsUseCase } from '../../../securities/application/use-cases/fetch-security-transactions.use-case';
import { SyncHistory } from '../../domain/entities/sync-history.entity';
import {
  createTestCreditCard,
  createTestCreditCardTransaction,
} from '../../../../../test/helpers/credit-card.factory';
import {
  createTestSecuritiesAccount,
  createTestSecurityTransaction,
} from '../../../../../test/helpers/securities.factory';
import { SYNC_HISTORY_REPOSITORY } from '../../sync.tokens';
import { INSTITUTION_REPOSITORY } from '../../../institution/institution.tokens';
import { CREDIT_CARD_REPOSITORY } from '../../../credit-card/credit-card.tokens';
import { SECURITIES_ACCOUNT_REPOSITORY } from '../../../securities/securities.tokens';

describe('SyncAllTransactionsUseCase', () => {
  let useCase: SyncAllTransactionsUseCase;
  let mockSyncHistoryRepository: jest.Mocked<ISyncHistoryRepository>;
  let mockInstitutionRepository: jest.Mocked<IInstitutionRepository>;
  let mockCreditCardRepository: jest.Mocked<ICreditCardRepository>;
  let mockSecuritiesAccountRepository: jest.Mocked<ISecuritiesAccountRepository>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockFetchCreditCardTransactionsUseCase: jest.Mocked<FetchCreditCardTransactionsUseCase>;
  let mockFetchSecurityTransactionsUseCase: jest.Mocked<FetchSecurityTransactionsUseCase>;

  beforeEach(async () => {
    mockSyncHistoryRepository = {
      create: jest.fn(),
      update: jest.fn().mockImplementation(async (history) => history),
      findById: jest.fn(),
      findAll: jest.fn(),
      findLatest: jest.fn(),
      findByStatus: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockInstitutionRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByConnectionStatus: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockCreditCardRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findConnected: jest.fn(),
      findByIssuer: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockSecuritiesAccountRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByConnectionStatus: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue(5), // SYNC_MAX_PARALLEL default
    } as any;

    mockFetchCreditCardTransactionsUseCase = {
      execute: jest.fn(),
    } as any;

    mockFetchSecurityTransactionsUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncAllTransactionsUseCase,
        {
          provide: SYNC_HISTORY_REPOSITORY,
          useValue: mockSyncHistoryRepository,
        },
        {
          provide: INSTITUTION_REPOSITORY,
          useValue: mockInstitutionRepository,
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
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: FetchCreditCardTransactionsUseCase,
          useValue: mockFetchCreditCardTransactionsUseCase,
        },
        {
          provide: FetchSecurityTransactionsUseCase,
          useValue: mockFetchSecurityTransactionsUseCase,
        },
      ],
    }).compile();

    useCase = module.get<SyncAllTransactionsUseCase>(
      SyncAllTransactionsUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return empty results when no targets are found', async () => {
      // Arrange
      mockCreditCardRepository.findConnected.mockResolvedValue([]);
      mockSecuritiesAccountRepository.findByConnectionStatus.mockResolvedValue(
        [],
      );

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.results).toEqual([]);
      expect(result.summary.totalInstitutions).toBe(0);
      expect(result.summary.successCount).toBe(0);
      expect(result.summary.failureCount).toBe(0);
    });

    it('should sync credit card transactions successfully', async () => {
      // Arrange
      const creditCard = createTestCreditCard();
      const transactions = [createTestCreditCardTransaction()];
      const syncHistory = SyncHistory.create(
        creditCard.id,
        creditCard.cardName,
        'credit-card',
      );

      mockCreditCardRepository.findConnected.mockResolvedValue([creditCard]);
      mockSecuritiesAccountRepository.findByConnectionStatus.mockResolvedValue(
        [],
      );
      mockSyncHistoryRepository.create.mockResolvedValue(syncHistory);
      mockSyncHistoryRepository.update.mockResolvedValue(
        syncHistory.markAsRunning(),
      );
      mockFetchCreditCardTransactionsUseCase.execute.mockResolvedValue(
        transactions,
      );

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].institutionType).toBe('credit-card');
      expect(result.summary.successCount).toBe(1);
      expect(result.summary.failureCount).toBe(0);
    });

    it('should sync securities transactions successfully', async () => {
      // Arrange
      const securitiesAccount = createTestSecuritiesAccount();
      const transactions = [createTestSecurityTransaction()];
      const syncHistory = SyncHistory.create(
        securitiesAccount.id,
        securitiesAccount.securitiesCompanyName,
        'securities',
      );

      mockCreditCardRepository.findConnected.mockResolvedValue([]);
      mockSecuritiesAccountRepository.findByConnectionStatus.mockResolvedValue([
        securitiesAccount,
      ]);
      mockSyncHistoryRepository.create.mockResolvedValue(syncHistory);
      mockSyncHistoryRepository.update.mockResolvedValue(
        syncHistory.markAsRunning(),
      );
      mockFetchSecurityTransactionsUseCase.execute.mockResolvedValue(
        transactions,
      );

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(true);
      expect(result.results[0].institutionType).toBe('securities');
      expect(result.summary.successCount).toBe(1);
    });

    it('should handle sync failure gracefully', async () => {
      // Arrange
      const creditCard = createTestCreditCard();
      const syncHistory = SyncHistory.create(
        creditCard.id,
        creditCard.cardName,
        'credit-card',
      );

      mockCreditCardRepository.findConnected.mockResolvedValue([creditCard]);
      mockSecuritiesAccountRepository.findByConnectionStatus.mockResolvedValue(
        [],
      );
      mockSyncHistoryRepository.create.mockResolvedValue(syncHistory);
      mockSyncHistoryRepository.update.mockResolvedValue(
        syncHistory.markAsRunning(),
      );
      mockFetchCreditCardTransactionsUseCase.execute.mockRejectedValue(
        new Error('API connection failed'),
      );

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].errorMessage).toBe('API connection failed');
      expect(result.summary.successCount).toBe(0);
      expect(result.summary.failureCount).toBe(1);
    });

    it('should filter by institution IDs when provided', async () => {
      // Arrange
      const creditCard1 = createTestCreditCard({ id: 'cc_1' });
      const creditCard2 = createTestCreditCard({ id: 'cc_2' });

      mockCreditCardRepository.findConnected.mockResolvedValue([
        creditCard1,
        creditCard2,
      ]);
      mockSecuritiesAccountRepository.findByConnectionStatus.mockResolvedValue(
        [],
      );

      // Act
      const result = await useCase.execute({ institutionIds: ['cc_1'] });

      // Assert
      expect(result.results).toHaveLength(1);
      expect(result.results[0].institutionId).toBe('cc_1');
    });
  });

  describe('cancelSync', () => {
    it('should cancel sync successfully', async () => {
      // Arrange
      const creditCard = createTestCreditCard();
      const syncHistory = SyncHistory.create(
        creditCard.id,
        creditCard.cardName,
        'credit-card',
      );

      mockCreditCardRepository.findConnected.mockResolvedValue([creditCard]);
      mockSecuritiesAccountRepository.findByConnectionStatus.mockResolvedValue(
        [],
      );
      mockSyncHistoryRepository.create.mockResolvedValue(syncHistory);
      mockSyncHistoryRepository.update.mockResolvedValue(
        syncHistory.markAsRunning(),
      );

      // 長時間かかる同期処理をシミュレート
      mockFetchCreditCardTransactionsUseCase.execute.mockImplementation(
        async (input) => {
          // AbortSignalをチェック
          if (input.abortSignal?.aborted) {
            throw new Error('Transaction fetch was cancelled');
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return [];
        },
      );

      // Act & Assert
      // 同期開始（非同期で実行）
      const syncPromise = useCase.execute();

      // 少し待ってからキャンセル
      await new Promise((resolve) => setTimeout(resolve, 10));

      // syncHistoryのIDを取得（実際には最初のcreateで返されたID）
      const syncId = syncHistory.id;

      // キャンセルを実行
      const cancelled = useCase.cancelSync(syncId);

      // Assert
      expect(cancelled).toBe(true);

      // 同期処理は失敗で完了する
      const result = await syncPromise;
      expect(result.summary.failureCount).toBe(1);
    });

    it('should return false when cancelling non-existent sync', () => {
      // Arrange
      const nonExistentSyncId = 'non_existent_sync_id';

      // Act
      const result = useCase.cancelSync(nonExistentSyncId);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle cancellation of already completed sync', async () => {
      // Arrange
      const creditCard = createTestCreditCard({ isConnected: false }); // 接続していないカードを使用してrefreshをスキップ
      const transactions = [createTestCreditCardTransaction()];
      const syncHistory = SyncHistory.create(
        creditCard.id,
        creditCard.cardName,
        'credit-card',
      );

      mockCreditCardRepository.findConnected.mockResolvedValue([creditCard]);
      mockSecuritiesAccountRepository.findByConnectionStatus.mockResolvedValue(
        [],
      );
      mockSyncHistoryRepository.create.mockResolvedValue(syncHistory);
      mockSyncHistoryRepository.update.mockResolvedValue(
        syncHistory.markAsRunning(),
      );
      mockFetchCreditCardTransactionsUseCase.execute.mockResolvedValue(
        transactions,
      );

      // Act
      const result = await useCase.execute();

      // 同期完了後にキャンセルを試みる
      const cancelled = useCase.cancelSync(syncHistory.id);

      // Assert
      expect(result.summary.successCount).toBe(1);
      expect(cancelled).toBe(false); // 既に完了しているのでAbortControllerは存在しない
    });

    it('should pass abortSignal to child use cases', async () => {
      // Arrange
      const creditCard = createTestCreditCard({ isConnected: false }); // 接続していないカードを使用してrefreshをスキップ
      const syncHistory = SyncHistory.create(
        creditCard.id,
        creditCard.cardName,
        'credit-card',
      );

      mockCreditCardRepository.findConnected.mockResolvedValue([creditCard]);
      mockSecuritiesAccountRepository.findByConnectionStatus.mockResolvedValue(
        [],
      );
      mockSyncHistoryRepository.create.mockResolvedValue(syncHistory);
      mockSyncHistoryRepository.update.mockImplementation(
        async (history) => history,
      );
      mockFetchCreditCardTransactionsUseCase.execute.mockResolvedValue([]);

      // Act
      await useCase.execute();

      // Assert
      expect(
        mockFetchCreditCardTransactionsUseCase.execute,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          abortSignal: expect.any(Object), // AbortSignalが渡されていることを確認
        }),
      );
    });

    it('should cleanup abortController after sync completion', async () => {
      // Arrange
      const creditCard = createTestCreditCard({ isConnected: false }); // 接続していないカードを使用してrefreshをスキップ
      const transactions = [createTestCreditCardTransaction()];
      const syncHistory = SyncHistory.create(
        creditCard.id,
        creditCard.cardName,
        'credit-card',
      );

      mockCreditCardRepository.findConnected.mockResolvedValue([creditCard]);
      mockSecuritiesAccountRepository.findByConnectionStatus.mockResolvedValue(
        [],
      );
      mockSyncHistoryRepository.create.mockResolvedValue(syncHistory);
      mockSyncHistoryRepository.update.mockResolvedValue(
        syncHistory.markAsRunning(),
      );
      mockFetchCreditCardTransactionsUseCase.execute.mockResolvedValue(
        transactions,
      );

      // Act
      await useCase.execute();

      // キャンセルを試みる（finallyでクリーンアップされているはず）
      const cancelled = useCase.cancelSync(syncHistory.id);

      // Assert
      expect(cancelled).toBe(false); // クリーンアップされているのでfalse
    });

    it('should cleanup abortController even after sync failure', async () => {
      // Arrange
      const creditCard = createTestCreditCard({ isConnected: false }); // 接続していないカードを使用してrefreshをスキップ
      const syncHistory = SyncHistory.create(
        creditCard.id,
        creditCard.cardName,
        'credit-card',
      );

      mockCreditCardRepository.findConnected.mockResolvedValue([creditCard]);
      mockSecuritiesAccountRepository.findByConnectionStatus.mockResolvedValue(
        [],
      );
      mockSyncHistoryRepository.create.mockResolvedValue(syncHistory);
      mockSyncHistoryRepository.update.mockResolvedValue(
        syncHistory.markAsRunning(),
      );
      mockFetchCreditCardTransactionsUseCase.execute.mockRejectedValue(
        new Error('API connection failed'),
      );

      // Act
      await useCase.execute();

      // キャンセルを試みる（finallyでクリーンアップされているはず）
      const cancelled = useCase.cancelSync(syncHistory.id);

      // Assert
      expect(cancelled).toBe(false); // クリーンアップされているのでfalse
    });
  });
});
