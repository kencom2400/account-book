import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ScheduledSyncJob } from './scheduled-sync.job';
import { SyncAllTransactionsUseCase } from '../use-cases/sync-all-transactions.use-case';
import { SyncSettings } from '../../domain/entities/sync-settings.entity';
import { InstitutionSyncSettings } from '../../domain/entities/institution-sync-settings.entity';
import { SyncInterval } from '../../domain/value-objects/sync-interval.vo';
import { SyncIntervalType } from '../../domain/enums/sync-interval-type.enum';
import { InstitutionSyncStatus } from '../../domain/enums/institution-sync-status.enum';
import { SYNC_SETTINGS_REPOSITORY } from '../../sync.tokens';
import type { ISyncSettingsRepository } from '../../domain/repositories/sync-settings.repository.interface';

// CronJobをモック
jest.mock('cron', () => {
  return {
    CronJob: jest.fn().mockImplementation(() => ({
      stop: jest.fn(),
      start: jest.fn(),
    })),
  };
});

describe('ScheduledSyncJob - ISchedulerService実装', () => {
  let job: ScheduledSyncJob;
  let mockSyncAllTransactionsUseCase: jest.Mocked<SyncAllTransactionsUseCase>;
  let mockSchedulerRegistry: jest.Mocked<SchedulerRegistry>;
  let mockSyncSettingsRepository: jest.Mocked<ISyncSettingsRepository>;

  beforeEach(async () => {
    mockSyncAllTransactionsUseCase = {
      execute: jest.fn(),
    } as any;

    mockSchedulerRegistry = {
      getCronJob: jest.fn(),
      getCronJobs: jest.fn().mockReturnValue(new Map()),
      deleteCronJob: jest.fn(),
      addCronJob: jest.fn(),
    } as any;

    mockSyncSettingsRepository = {
      find: jest.fn(),
      save: jest.fn(),
      findInstitutionSettings: jest.fn(),
      findAllInstitutionSettings: jest.fn(),
      saveInstitutionSettings: jest.fn(),
      deleteInstitutionSettings: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledSyncJob,
        {
          provide: SyncAllTransactionsUseCase,
          useValue: mockSyncAllTransactionsUseCase,
        },
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
        {
          provide: SYNC_SETTINGS_REPOSITORY,
          useValue: mockSyncSettingsRepository,
        },
      ],
    }).compile();

    module.useLogger(false);

    job = module.get<ScheduledSyncJob>(ScheduledSyncJob);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateSchedule', () => {
    it('全体のスケジュールを更新できる', () => {
      const settings = SyncSettings.createDefault();

      // 既存のジョブが存在しない場合
      mockSchedulerRegistry.getCronJob.mockImplementation(() => {
        throw new Error('Job not found');
      });

      job.updateSchedule(settings);

      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalled();
    });

    it('既存のジョブを停止してから新しいジョブを登録する', () => {
      const settings = SyncSettings.createDefault();

      const existingJob = {
        stop: jest.fn(),
      };

      mockSchedulerRegistry.getCronJobs.mockReturnValue(
        new Map([['scheduled-sync', existingJob]]),
      );

      job.updateSchedule(settings);

      expect(existingJob.stop).toHaveBeenCalled();
      expect(mockSchedulerRegistry.deleteCronJob).toHaveBeenCalledWith(
        'scheduled-sync',
      );
      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalled();
    });

    it('手動同期のみの場合はスケジュールを更新しない', () => {
      const manualInterval = new SyncInterval(SyncIntervalType.MANUAL);
      const settings = new SyncSettings(
        'settings-001',
        manualInterval,
        false,
        false,
        true,
        3,
        false,
        '22:00',
        '06:00',
        new Date(),
        new Date(),
      );

      // モックをリセット
      jest.clearAllMocks();

      // updateScheduleはtoCronExpression()がnullを返すため、早期リターンする
      // updateCronJobは呼ばれない
      job.updateSchedule(settings);

      // CronJobが作成されないことを確認
      expect(mockSchedulerRegistry.addCronJob).not.toHaveBeenCalled();
      expect(mockSchedulerRegistry.getCronJob).not.toHaveBeenCalled();
    });

    it('カスタム間隔でスケジュールを更新できる', () => {
      const customInterval = new SyncInterval(
        SyncIntervalType.CUSTOM,
        30,
        'minutes' as any,
      );
      const settings = new SyncSettings(
        'settings-001',
        customInterval,
        false,
        false,
        true,
        3,
        false,
        '22:00',
        '06:00',
        new Date(),
        new Date(),
      );

      mockSchedulerRegistry.getCronJob.mockImplementation(() => {
        throw new Error('Job not found');
      });

      job.updateSchedule(settings);

      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalled();
    });
  });

  describe('updateInstitutionSchedule', () => {
    it('有効な金融機関設定でスケジュールを更新できる', async () => {
      const defaultInterval = new SyncInterval(SyncIntervalType.STANDARD);
      const settings = InstitutionSyncSettings.create(
        'institution-001',
        null,
        defaultInterval,
      );

      mockSyncSettingsRepository.findAllInstitutionSettings.mockResolvedValue([
        settings,
      ]);
      mockSchedulerRegistry.getCronJobs.mockReturnValue(new Map());

      await job.updateInstitutionSchedule('institution-001', settings);

      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalled();
    });

    it('無効な金融機関設定の場合はスケジュールを更新しない', async () => {
      const defaultInterval = new SyncInterval(SyncIntervalType.STANDARD);
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        defaultInterval,
        false, // enabled = false
        null,
        null,
        InstitutionSyncStatus.IDLE,
        0,
        null,
        new Date(),
        new Date(),
      );

      mockSyncSettingsRepository.findAllInstitutionSettings.mockResolvedValue([
        settings,
      ]);

      await job.updateInstitutionSchedule('institution-001', settings);

      expect(mockSchedulerRegistry.addCronJob).not.toHaveBeenCalled();
    });

    it('手動同期のみの金融機関設定の場合はスケジュールを更新しない', async () => {
      const manualInterval = new SyncInterval(SyncIntervalType.MANUAL);
      const settings = new InstitutionSyncSettings(
        'inst-settings-001',
        'institution-001',
        manualInterval,
        true, // enabled = true
        null,
        null,
        InstitutionSyncStatus.IDLE,
        0,
        null,
        new Date(),
        new Date(),
      );

      mockSyncSettingsRepository.findAllInstitutionSettings.mockResolvedValue([
        settings,
      ]);

      await job.updateInstitutionSchedule('institution-001', settings);

      expect(mockSchedulerRegistry.addCronJob).not.toHaveBeenCalled();
    });

    it('既存のジョブを停止してから新しいジョブを登録する', async () => {
      const defaultInterval = new SyncInterval(SyncIntervalType.FREQUENT);
      const settings = InstitutionSyncSettings.create(
        'institution-001',
        null,
        defaultInterval,
      );

      const existingJob = {
        stop: jest.fn(),
      };

      mockSyncSettingsRepository.findAllInstitutionSettings.mockResolvedValue([
        settings,
      ]);
      mockSchedulerRegistry.getCronJobs.mockReturnValue(
        new Map([['scheduled-sync', existingJob]]),
      );

      await job.updateInstitutionSchedule('institution-001', settings);

      expect(existingJob.stop).toHaveBeenCalled();
      expect(mockSchedulerRegistry.deleteCronJob).toHaveBeenCalledWith(
        'scheduled-sync',
      );
      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalled();
    });
  });

  describe('getSchedule', () => {
    it('現在のスケジュール設定を取得できる', () => {
      const schedule = job.getSchedule();

      expect(schedule).toHaveProperty('cronExpression');
      expect(schedule).toHaveProperty('timezone');
      expect(schedule).toHaveProperty('enabled');
      expect(schedule.cronExpression).toBe('0 4 * * *');
      expect(schedule.timezone).toBe('Asia/Tokyo');
      expect(schedule.enabled).toBe(true);
    });
  });

  describe('setEnabled', () => {
    it('スケジュールを有効化できる', () => {
      job.setEnabled(true);

      const schedule = job.getSchedule();
      expect(schedule.enabled).toBe(true);
    });

    it('スケジュールを無効化できる', () => {
      job.setEnabled(false);

      const schedule = job.getSchedule();
      expect(schedule.enabled).toBe(false);
    });
  });

  describe('isSyncRunning', () => {
    it('初期状態ではfalseを返す', () => {
      expect(job.isSyncRunning()).toBe(false);
    });
  });

  describe('getMetrics', () => {
    it('メトリクスを取得できる', () => {
      const metrics = job.getMetrics();

      expect(metrics).toHaveProperty('totalExecutions');
      expect(metrics).toHaveProperty('successfulExecutions');
      expect(metrics).toHaveProperty('failedExecutions');
      expect(metrics).toHaveProperty('averageDuration');
      expect(metrics).toHaveProperty('lastExecutionTime');
      expect(metrics).toHaveProperty('lastSuccessTime');
      expect(metrics).toHaveProperty('lastFailureTime');
      expect(metrics.totalExecutions).toBe(0);
    });
  });

  describe('resetMetrics', () => {
    it('メトリクスをリセットできる', () => {
      job.resetMetrics();

      const metrics = job.getMetrics();
      expect(metrics.totalExecutions).toBe(0);
      expect(metrics.successfulExecutions).toBe(0);
      expect(metrics.failedExecutions).toBe(0);
      expect(metrics.averageDuration).toBe(0);
      expect(metrics.lastExecutionTime).toBeNull();
      expect(metrics.lastSuccessTime).toBeNull();
      expect(metrics.lastFailureTime).toBeNull();
    });
  });
});
