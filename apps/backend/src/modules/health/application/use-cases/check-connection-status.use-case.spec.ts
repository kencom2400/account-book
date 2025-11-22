import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CheckConnectionStatusUseCase } from './check-connection-status.use-case';
import { ConnectionCheckerService } from '../../infrastructure/services/connection-checker.service';
import {
  IConnectionHistoryRepository,
  CONNECTION_HISTORY_REPOSITORY,
} from '../../domain/repositories/connection-history.repository.interface';
import { ConnectionStatus } from '../../domain/value-objects/connection-status.enum';
import { ConnectionCheckResult } from '../../domain/value-objects/connection-check-result.vo';

describe('CheckConnectionStatusUseCase', () => {
  let useCase: CheckConnectionStatusUseCase;
  let connectionChecker: jest.Mocked<ConnectionCheckerService>;
  let historyRepository: jest.Mocked<IConnectionHistoryRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const mockConnectionChecker = {
      checkMultipleConnections: jest.fn(),
    };

    const mockHistoryRepository = {
      saveMany: jest.fn(),
      save: jest.fn(),
      findLatestByInstitutionId: jest.fn(),
      findAllLatest: jest.fn(),
      findByInstitutionIdAndDateRange: jest.fn(),
      findAll: jest.fn(),
      deleteOlderThan: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckConnectionStatusUseCase,
        {
          provide: ConnectionCheckerService,
          useValue: mockConnectionChecker,
        },
        {
          provide: CONNECTION_HISTORY_REPOSITORY,
          useValue: mockHistoryRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    useCase = module.get<CheckConnectionStatusUseCase>(
      CheckConnectionStatusUseCase,
    );
    connectionChecker = module.get(ConnectionCheckerService);
    historyRepository = module.get(CONNECTION_HISTORY_REPOSITORY);
    eventEmitter = module.get(EventEmitter2);
  });

  it('定義されていること', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('接続状態をチェックして履歴を保存する', async () => {
      const institutions = [
        {
          id: 'inst-001',
          name: '三菱UFJ銀行',
          type: 'bank' as const,
          apiClient: {},
        },
        {
          id: 'inst-002',
          name: '楽天カード',
          type: 'credit-card' as const,
          apiClient: {},
        },
      ];

      const checkResults = [
        new ConnectionCheckResult(
          'inst-001',
          ConnectionStatus.CONNECTED,
          new Date(),
          1500,
        ),
        new ConnectionCheckResult(
          'inst-002',
          ConnectionStatus.CONNECTED,
          new Date(),
          2000,
        ),
      ];

      connectionChecker.checkMultipleConnections.mockResolvedValue(
        checkResults,
      );
      historyRepository.saveMany.mockResolvedValue();

      const results = await useCase.execute({}, institutions);

      expect(results).toHaveLength(2);
      expect(results[0].institutionId).toBe('inst-001');
      expect(results[0].status).toBe(ConnectionStatus.CONNECTED);
      expect(results[1].institutionId).toBe('inst-002');
      expect(connectionChecker.checkMultipleConnections).toHaveBeenCalledWith([
        { id: 'inst-001', name: '三菱UFJ銀行', type: 'bank', apiClient: {} },
        {
          id: 'inst-002',
          name: '楽天カード',
          type: 'credit-card',
          apiClient: {},
        },
      ]);
      expect(historyRepository.saveMany).toHaveBeenCalledTimes(1);
    });

    it('特定の金融機関のみをチェックする', async () => {
      const institutions = [
        {
          id: 'inst-001',
          name: '三菱UFJ銀行',
          type: 'bank' as const,
          apiClient: {},
        },
        {
          id: 'inst-002',
          name: '楽天カード',
          type: 'credit-card' as const,
          apiClient: {},
        },
      ];

      const checkResults = [
        new ConnectionCheckResult(
          'inst-001',
          ConnectionStatus.CONNECTED,
          new Date(),
          1500,
        ),
      ];

      connectionChecker.checkMultipleConnections.mockResolvedValue(
        checkResults,
      );
      historyRepository.saveMany.mockResolvedValue();

      const results = await useCase.execute(
        { institutionId: 'inst-001' },
        institutions,
      );

      expect(results).toHaveLength(1);
      expect(results[0].institutionId).toBe('inst-001');
      expect(connectionChecker.checkMultipleConnections).toHaveBeenCalledWith([
        { id: 'inst-001', name: '三菱UFJ銀行', type: 'bank', apiClient: {} },
      ]);
    });

    it('金融機関が見つからない場合は空配列を返す', async () => {
      const results = await useCase.execute({}, []);

      expect(results).toEqual([]);
      expect(connectionChecker.checkMultipleConnections).not.toHaveBeenCalled();
      expect(historyRepository.saveMany).not.toHaveBeenCalled();
    });

    it('エラーが発生した金融機関の情報も記録する', async () => {
      const institutions = [
        {
          id: 'inst-001',
          name: '三菱UFJ銀行',
          type: 'bank' as const,
          apiClient: {},
        },
      ];

      const checkResults = [
        new ConnectionCheckResult(
          'inst-001',
          ConnectionStatus.DISCONNECTED,
          new Date(),
          3000,
          '接続に失敗しました',
          'CONNECTION_ERROR',
        ),
      ];

      connectionChecker.checkMultipleConnections.mockResolvedValue(
        checkResults,
      );
      historyRepository.saveMany.mockResolvedValue();

      const results = await useCase.execute({}, institutions);

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe(ConnectionStatus.DISCONNECTED);
      expect(results[0].errorMessage).toBe('接続に失敗しました');
      expect(results[0].errorCode).toBe('CONNECTION_ERROR');
      expect(historyRepository.saveMany).toHaveBeenCalled();
    });

    it('エラーが発生した場合、接続失敗イベントを発行する', async () => {
      const institutions = [
        {
          id: 'inst-001',
          name: '三菱UFJ銀行',
          type: 'bank' as const,
          apiClient: {},
        },
      ];

      const checkResults = [
        new ConnectionCheckResult(
          'inst-001',
          ConnectionStatus.DISCONNECTED,
          new Date(),
          3000,
          '接続に失敗しました',
          'CONNECTION_ERROR',
        ),
      ];

      connectionChecker.checkMultipleConnections.mockResolvedValue(
        checkResults,
      );
      historyRepository.saveMany.mockResolvedValue();

      await useCase.execute({}, institutions);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'connection.failed',
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              institutionId: 'inst-001',
              errorMessage: '接続に失敗しました',
            }),
          ]) as unknown[],
        }),
      );
    });

    it('エラーが発生しなかった場合、イベントを発行しない', async () => {
      const institutions = [
        {
          id: 'inst-001',
          name: '三菱UFJ銀行',
          type: 'bank' as const,
          apiClient: {},
        },
      ];

      const checkResults = [
        new ConnectionCheckResult(
          'inst-001',
          ConnectionStatus.CONNECTED,
          new Date(),
          1500,
        ),
      ];

      connectionChecker.checkMultipleConnections.mockResolvedValue(
        checkResults,
      );
      historyRepository.saveMany.mockResolvedValue();

      await useCase.execute({}, institutions);

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
