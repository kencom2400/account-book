import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  GetConnectionHistoryUseCase,
  GetConnectionHistoryQuery,
} from './get-connection-history.use-case';
import { CONNECTION_HISTORY_REPOSITORY } from '../../domain/repositories/connection-history.repository.interface';
import type { IConnectionHistoryRepository } from '../../domain/repositories/connection-history.repository.interface';
import { ConnectionHistory } from '../../domain/entities/connection-history.entity';

describe('GetConnectionHistoryUseCase', () => {
  let useCase: GetConnectionHistoryUseCase;
  let repository: jest.Mocked<IConnectionHistoryRepository>;

  const mockHistories: ConnectionHistory[] = [
    new ConnectionHistory(
      'hist_1',
      'inst_1',
      'Test Bank',
      'bank',
      'CONNECTED',
      new Date('2024-01-15T10:00:00Z'),
      100,
    ),
    new ConnectionHistory(
      'hist_2',
      'inst_2',
      'Test Card',
      'credit_card',
      'DISCONNECTED',
      new Date('2024-01-15T11:00:00Z'),
      5000,
      'Connection timeout',
      'TIMEOUT',
    ),
    new ConnectionHistory(
      'hist_3',
      'inst_1',
      'Test Bank',
      'bank',
      'CONNECTED',
      new Date('2024-01-16T10:00:00Z'),
      120,
    ),
  ];

  beforeEach(async () => {
    const mockRepo = {
      findAll: jest.fn(),
      findLatestByInstitutionId: jest.fn(),
      findAllLatest: jest.fn(),
      findByInstitutionIdAndDateRange: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetConnectionHistoryUseCase,
        {
          provide: CONNECTION_HISTORY_REPOSITORY,
          useValue: mockRepo,
        },
      ],
    }).compile();

    module.useLogger(false);

    useCase = module.get<GetConnectionHistoryUseCase>(
      GetConnectionHistoryUseCase,
    );
    repository = module.get(CONNECTION_HISTORY_REPOSITORY);
  });

  describe('execute', () => {
    describe('latestOnly', () => {
      it('should get latest history for specific institution', async () => {
        repository.findLatestByInstitutionId.mockResolvedValue(
          mockHistories[2],
        );

        const query: GetConnectionHistoryQuery = {
          institutionId: 'inst_1',
          latestOnly: true,
        };

        const results = await useCase.execute(query);

        expect(repository.findLatestByInstitutionId).toHaveBeenCalledWith(
          'inst_1',
        );
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('hist_3');
      });

      it('should return empty array when no latest history found', async () => {
        repository.findLatestByInstitutionId.mockResolvedValue(null);

        const query: GetConnectionHistoryQuery = {
          institutionId: 'inst_999',
          latestOnly: true,
        };

        const results = await useCase.execute(query);

        expect(results).toHaveLength(0);
      });

      it('should get latest histories for all institutions', async () => {
        repository.findAllLatest.mockResolvedValue([
          mockHistories[2],
          mockHistories[1],
        ]);

        const query: GetConnectionHistoryQuery = {
          latestOnly: true,
        };

        const results = await useCase.execute(query);

        expect(repository.findAllLatest).toHaveBeenCalled();
        expect(results).toHaveLength(2);
      });
    });

    describe('date range', () => {
      it('should get histories by date range for specific institution', async () => {
        const startDate = new Date('2024-01-15T00:00:00Z');
        const endDate = new Date('2024-01-15T23:59:59Z');

        repository.findByInstitutionIdAndDateRange.mockResolvedValue([
          mockHistories[0],
        ]);

        const query: GetConnectionHistoryQuery = {
          institutionId: 'inst_1',
          startDate,
          endDate,
        };

        const results = await useCase.execute(query);

        expect(repository.findByInstitutionIdAndDateRange).toHaveBeenCalledWith(
          'inst_1',
          startDate,
          endDate,
        );
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe('hist_1');
      });

      it('should filter all histories by date range', async () => {
        const startDate = new Date('2024-01-15T00:00:00Z');
        const endDate = new Date('2024-01-15T23:59:59Z');

        repository.findAll.mockResolvedValue(mockHistories);

        const query: GetConnectionHistoryQuery = {
          startDate,
          endDate,
        };

        const results = await useCase.execute(query);

        expect(repository.findAll).toHaveBeenCalled();
        expect(results).toHaveLength(2); // hist_1 and hist_2
      });

      it('should apply limit to date range results', async () => {
        const startDate = new Date('2024-01-15T00:00:00Z');
        const endDate = new Date('2024-01-15T23:59:59Z');

        repository.findAll.mockResolvedValue(mockHistories);

        const query: GetConnectionHistoryQuery = {
          startDate,
          endDate,
          limit: 1,
        };

        const results = await useCase.execute(query);

        expect(results).toHaveLength(1);
      });
    });

    describe('institutionId only', () => {
      it('should get all histories for specific institution', async () => {
        repository.findAll.mockResolvedValue(mockHistories);

        const query: GetConnectionHistoryQuery = {
          institutionId: 'inst_1',
        };

        const results = await useCase.execute(query);

        expect(repository.findAll).toHaveBeenCalled();
        expect(results).toHaveLength(2); // hist_1 and hist_3
        expect(results.every((r) => r.institutionId === 'inst_1')).toBe(true);
      });

      it('should apply limit to institution results', async () => {
        repository.findAll.mockResolvedValue(mockHistories);

        const query: GetConnectionHistoryQuery = {
          institutionId: 'inst_1',
          limit: 1,
        };

        const results = await useCase.execute(query);

        expect(results).toHaveLength(1);
      });
    });

    describe('no conditions', () => {
      it('should get all histories', async () => {
        repository.findAll.mockResolvedValue(mockHistories);

        const query: GetConnectionHistoryQuery = {};

        const results = await useCase.execute(query);

        expect(repository.findAll).toHaveBeenCalledWith(undefined);
        expect(results).toHaveLength(3);
      });

      it('should apply limit to all histories', async () => {
        repository.findAll.mockResolvedValue(mockHistories);

        const query: GetConnectionHistoryQuery = {
          limit: 2,
        };

        const results = await useCase.execute(query);

        expect(repository.findAll).toHaveBeenCalledWith(2);
        expect(results).toHaveLength(3);
      });
    });

    it('should handle repository errors', async () => {
      repository.findAll.mockRejectedValue(new Error('Database error'));

      const query: GetConnectionHistoryQuery = {};

      await expect(useCase.execute(query)).rejects.toThrow('Database error');
    });
  });

  describe('getLatestStatuses', () => {
    it('should get latest statuses for all institutions', async () => {
      repository.findAllLatest.mockResolvedValue([
        mockHistories[2],
        mockHistories[1],
      ]);

      const results = await useCase.getLatestStatuses();

      expect(repository.findAllLatest).toHaveBeenCalled();
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('hist_3');
      expect(results[1].id).toBe('hist_2');
    });

    it('should handle errors when getting latest statuses', async () => {
      repository.findAllLatest.mockRejectedValue(new Error('Repository error'));

      await expect(useCase.getLatestStatuses()).rejects.toThrow(
        'Repository error',
      );
    });
  });

  describe('toResult conversion', () => {
    it('should convert ConnectionHistory to ConnectionHistoryResult', async () => {
      repository.findAll.mockResolvedValue([mockHistories[0]]);

      const query: GetConnectionHistoryQuery = {};
      const results = await useCase.execute(query);

      const result = results[0];
      expect(result.id).toBe('hist_1');
      expect(result.institutionId).toBe('inst_1');
      expect(result.institutionName).toBe('Test Bank');
      expect(result.institutionType).toBe('bank');
      expect(result.status).toBe('CONNECTED');
      expect(result.checkedAt).toBe(
        new Date('2024-01-15T10:00:00Z').toISOString(),
      );
      expect(result.responseTime).toBe(100);
      expect(result.errorMessage).toBeUndefined();
      expect(result.errorCode).toBeUndefined();
    });

    it('should include error information when present', async () => {
      repository.findAll.mockResolvedValue([mockHistories[1]]);

      const query: GetConnectionHistoryQuery = {};
      const results = await useCase.execute(query);

      const result = results[0];
      expect(result.status).toBe('DISCONNECTED');
      expect(result.errorMessage).toBe('Connection timeout');
      expect(result.errorCode).toBe('TIMEOUT');
    });

    it('should handle internal status CHECKING as DISCONNECTED', async () => {
      const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn');

      // @ts-expect-error: Intentionally using internal status for testing
      const internalStatusHistory = new ConnectionHistory(
        'hist_internal',
        'inst_1',
        'Test Bank',
        'bank',
        'CHECKING', // Internal status
        new Date('2024-01-15T10:00:00Z'),
        100,
      );

      repository.findAll.mockResolvedValue([internalStatusHistory]);

      const query: GetConnectionHistoryQuery = {};
      const results = await useCase.execute(query);

      expect(results[0].status).toBe('DISCONNECTED');
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("内部ステータス 'CHECKING'"),
      );

      loggerWarnSpy.mockRestore();
    });
  });
});
