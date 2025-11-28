import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { TriggerSyncUseCase } from '../../application/use-cases/trigger-sync.use-case';
import { GetSyncHistoryUseCase } from '../../application/use-cases/get-sync-history.use-case';

describe('SyncController', () => {
  let controller: SyncController;
  let triggerSyncUseCase: jest.Mocked<TriggerSyncUseCase>;
  let getSyncHistoryUseCase: jest.Mocked<GetSyncHistoryUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: TriggerSyncUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetSyncHistoryUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    module.useLogger(false);

    controller = module.get<SyncController>(SyncController);
    triggerSyncUseCase = module.get(TriggerSyncUseCase);
    getSyncHistoryUseCase = module.get(GetSyncHistoryUseCase);
  });

  describe('triggerSync', () => {
    it('should trigger sync', async () => {
      triggerSyncUseCase.execute.mockResolvedValue({
        syncId: 'sync_1',
        status: 'in_progress' as const,
      });

      const result = await controller.triggerSync({
        institutionId: 'inst_1',
      } as any);

      expect(result.success).toBe(true);
    });
  });

  describe('getHistory', () => {
    it('should get sync history', async () => {
      getSyncHistoryUseCase.execute.mockResolvedValue([]);

      const result = await controller.getHistory({});

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});
