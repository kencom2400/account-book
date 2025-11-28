import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { SyncAllTransactionsUseCase } from '../../application/use-cases/sync-all-transactions.use-case';
import { GetSyncHistoryUseCase } from '../../application/use-cases/get-sync-history.use-case';
import { GetSyncStatusUseCase } from '../../application/use-cases/get-sync-status.use-case';
import { CancelSyncUseCase } from '../../application/use-cases/cancel-sync.use-case';

describe('SyncController', () => {
  let controller: SyncController;
  let syncAllUseCase: jest.Mocked<SyncAllTransactionsUseCase>;
  let getSyncHistoryUseCase: jest.Mocked<GetSyncHistoryUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncAllTransactionsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetSyncHistoryUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetSyncStatusUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: CancelSyncUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    module.useLogger(false);

    controller = module.get<SyncController>(SyncController);
    syncAllUseCase = module.get(SyncAllTransactionsUseCase);
    getSyncHistoryUseCase = module.get(GetSyncHistoryUseCase);
  });

  describe('startSync', () => {
    it('should start sync', async () => {
      syncAllUseCase.execute.mockResolvedValue({
        syncId: 'sync_1',
        status: 'in_progress' as const,
        startedAt: new Date(),
        results: [],
        summary: {
          totalInstitutions: 0,
          successCount: 0,
          failureCount: 0,
          totalFetched: 0,
        },
      });

      const result = await controller.startSync({});

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.summary.totalInstitutions).toBe(0);
    });
  });

  describe('getSyncHistory', () => {
    it('should get sync history', async () => {
      getSyncHistoryUseCase.execute.mockResolvedValue({
        histories: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const result = await controller.getSyncHistory({});

      expect(result.data).toEqual([]);
    });
  });
});
