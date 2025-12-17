import { Test, TestingModule } from '@nestjs/testing';
import { GetSyncStatusUseCase } from './get-sync-status.use-case';
import type { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { SYNC_HISTORY_REPOSITORY } from '../../sync.tokens';
import { SyncHistory } from '../../domain/entities/sync-history.entity';
import { InstitutionType } from '@account-book/types';

describe('GetSyncStatusUseCase', () => {
  let useCase: GetSyncStatusUseCase;
  let repository: jest.Mocked<ISyncHistoryRepository>;

  beforeEach(async () => {
    repository = {
      findRunning: jest.fn(),
    } as unknown as jest.Mocked<ISyncHistoryRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSyncStatusUseCase,
        {
          provide: SYNC_HISTORY_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get<GetSyncStatusUseCase>(GetSyncStatusUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return not running status when no running sync exists', async () => {
      repository.findRunning.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result.isRunning).toBe(false);
      expect(result.currentSyncId).toBeNull();
      expect(result.startedAt).toBeNull();
      expect(result.progress).toBeNull();
      expect(repository.findRunning).toHaveBeenCalled();
    });

    it('should return running status when sync is running', async () => {
      const mockHistory = SyncHistory.create(
        'inst-1',
        'Test Bank',
        InstitutionType.BANK,
      );
      const runningHistory = mockHistory.markAsRunning();
      repository.findRunning.mockResolvedValue([runningHistory]);

      const result = await useCase.execute();

      expect(result.isRunning).toBe(true);
      expect(result.currentSyncId).toBe(runningHistory.id);
      expect(result.startedAt).toEqual(runningHistory.startedAt);
      expect(result.progress).not.toBeNull();
      expect(result.progress?.currentInstitution).toBe('Test Bank');
      expect(result.progress?.percentage).toBe(40);
      expect(repository.findRunning).toHaveBeenCalled();
    });

    it('should use the first running sync when multiple exist', async () => {
      const mockHistory1 = SyncHistory.create(
        'inst-1',
        'Test Bank 1',
        InstitutionType.BANK,
      );
      const mockHistory2 = SyncHistory.create(
        'inst-2',
        'Test Bank 2',
        InstitutionType.BANK,
      );
      const runningHistory1 = mockHistory1.markAsRunning();
      const runningHistory2 = mockHistory2.markAsRunning();
      repository.findRunning.mockResolvedValue([
        runningHistory1,
        runningHistory2,
      ]);

      const result = await useCase.execute();

      expect(result.isRunning).toBe(true);
      expect(result.currentSyncId).toBe(runningHistory1.id);
      expect(result.progress?.currentInstitution).toBe('Test Bank 1');
    });
  });
});
