import { Test, TestingModule } from '@nestjs/testing';
import { GetSyncHistoryUseCase } from './get-sync-history.use-case';
import type { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { SYNC_HISTORY_REPOSITORY } from '../../sync.tokens';
import { SyncHistory } from '../../domain/entities/sync-history.entity';
import { SyncStatus } from '../../domain/enums/sync-status.enum';
import { InstitutionType } from '@account-book/types';

describe('GetSyncHistoryUseCase', () => {
  let useCase: GetSyncHistoryUseCase;
  let repository: jest.Mocked<ISyncHistoryRepository>;

  const mockHistory1 = SyncHistory.create(
    'inst-1',
    'Test Bank',
    InstitutionType.BANK,
  );

  const mockHistory2 = SyncHistory.create(
    'inst-2',
    'Test Credit Card',
    InstitutionType.CREDIT_CARD,
  );

  beforeEach(async () => {
    repository = {
      findWithFilters: jest.fn(),
      countWithFilters: jest.fn(),
    } as unknown as jest.Mocked<ISyncHistoryRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSyncHistoryUseCase,
        {
          provide: SYNC_HISTORY_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get<GetSyncHistoryUseCase>(GetSyncHistoryUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return sync histories with default pagination', async () => {
      const mockHistories = [mockHistory1, mockHistory2];
      repository.findWithFilters.mockResolvedValue(mockHistories);
      repository.countWithFilters.mockResolvedValue(2);

      const result = await useCase.execute({});

      expect(result.histories).toEqual(mockHistories);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(repository.findWithFilters).toHaveBeenCalledWith(
        {
          institutionId: undefined,
          status: undefined,
          startDate: undefined,
          endDate: undefined,
        },
        20,
        0,
      );
      expect(repository.countWithFilters).toHaveBeenCalledWith({
        institutionId: undefined,
        status: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });

    it('should return sync histories with custom pagination', async () => {
      const mockHistories = [mockHistory1];
      repository.findWithFilters.mockResolvedValue(mockHistories);
      repository.countWithFilters.mockResolvedValue(1);

      const result = await useCase.execute({ page: 2, limit: 10 });

      expect(result.histories).toEqual(mockHistories);
      expect(result.total).toBe(1);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(repository.findWithFilters).toHaveBeenCalledWith(
        {
          institutionId: undefined,
          status: undefined,
          startDate: undefined,
          endDate: undefined,
        },
        10,
        10,
      );
    });

    it('should filter by institutionId', async () => {
      const mockHistories = [mockHistory1];
      repository.findWithFilters.mockResolvedValue(mockHistories);
      repository.countWithFilters.mockResolvedValue(1);

      const result = await useCase.execute({ institutionId: 'inst-1' });

      expect(result.histories).toEqual(mockHistories);
      expect(repository.findWithFilters).toHaveBeenCalledWith(
        {
          institutionId: 'inst-1',
          status: undefined,
          startDate: undefined,
          endDate: undefined,
        },
        20,
        0,
      );
    });

    it('should filter by status', async () => {
      const mockHistories = [mockHistory1];
      repository.findWithFilters.mockResolvedValue(mockHistories);
      repository.countWithFilters.mockResolvedValue(1);

      const result = await useCase.execute({ status: SyncStatus.COMPLETED });

      expect(result.histories).toEqual(mockHistories);
      expect(repository.findWithFilters).toHaveBeenCalledWith(
        {
          institutionId: undefined,
          status: SyncStatus.COMPLETED,
          startDate: undefined,
          endDate: undefined,
        },
        20,
        0,
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const mockHistories = [mockHistory1];
      repository.findWithFilters.mockResolvedValue(mockHistories);
      repository.countWithFilters.mockResolvedValue(1);

      const result = await useCase.execute({ startDate, endDate });

      expect(result.histories).toEqual(mockHistories);
      expect(repository.findWithFilters).toHaveBeenCalledWith(
        {
          institutionId: undefined,
          status: undefined,
          startDate,
          endDate,
        },
        20,
        0,
      );
    });

    it('should calculate totalPages correctly', async () => {
      const mockHistories = [mockHistory1];
      repository.findWithFilters.mockResolvedValue(mockHistories);
      repository.countWithFilters.mockResolvedValue(25);

      const result = await useCase.execute({ limit: 10 });

      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
    });
  });
});
