import { Test, TestingModule } from '@nestjs/testing';
import { UpdateSyncSettingsUseCase } from './update-sync-settings.use-case';
import { SYNC_SETTINGS_REPOSITORY } from '../../sync.tokens';
import type { ISyncSettingsRepository } from '../../domain/repositories/sync-settings.repository.interface';
import type { ISchedulerService } from '../services/scheduler.service.interface';
import { SyncSettings } from '../../domain/entities/sync-settings.entity';
import { SyncInterval } from '../../domain/value-objects/sync-interval.vo';
import { SyncIntervalType } from '../../domain/enums/sync-interval-type.enum';
import { InstitutionSyncSettings } from '../../domain/entities/institution-sync-settings.entity';

describe('UpdateSyncSettingsUseCase', () => {
  let useCase: UpdateSyncSettingsUseCase;
  let mockRepository: jest.Mocked<ISyncSettingsRepository>;
  let mockSchedulerService: jest.Mocked<ISchedulerService>;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      save: jest.fn(),
      findInstitutionSettings: jest.fn(),
      findAllInstitutionSettings: jest.fn(),
      saveInstitutionSettings: jest.fn(),
      deleteInstitutionSettings: jest.fn(),
    };

    mockSchedulerService = {
      updateSchedule: jest.fn(),
      updateInstitutionSchedule: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSyncSettingsUseCase,
        {
          provide: SYNC_SETTINGS_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: 'ISchedulerService',
          useValue: mockSchedulerService,
        },
      ],
    }).compile();

    useCase = module.get<UpdateSyncSettingsUseCase>(UpdateSyncSettingsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('既存設定を更新する', async () => {
      // Arrange
      const existingSettings = SyncSettings.createDefault();
      mockRepository.find.mockResolvedValue(existingSettings);
      mockRepository.save.mockImplementation(async (settings) => settings);
      mockRepository.findAllInstitutionSettings.mockResolvedValue([]);

      const dto = {
        defaultInterval: {
          type: SyncIntervalType.FREQUENT,
        },
        wifiOnly: true,
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.defaultInterval.type).toBe(SyncIntervalType.FREQUENT);
      expect(result.wifiOnly).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockSchedulerService.updateSchedule).toHaveBeenCalledTimes(1);
    });

    it('設定が存在しない場合は新規作成する', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue(null);
      mockRepository.save.mockImplementation(async (settings) => settings);
      mockRepository.findAllInstitutionSettings.mockResolvedValue([]);

      const dto = {
        defaultInterval: {
          type: SyncIntervalType.STANDARD,
        },
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toBeInstanceOf(SyncSettings);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockSchedulerService.updateSchedule).toHaveBeenCalledTimes(1);
    });

    it('部分更新をサポートする', async () => {
      // Arrange
      const existingSettings = SyncSettings.createDefault();
      mockRepository.find.mockResolvedValue(existingSettings);
      mockRepository.save.mockImplementation(async (settings) => settings);
      mockRepository.findAllInstitutionSettings.mockResolvedValue([]);

      const dto = {
        wifiOnly: true,
      };

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result.wifiOnly).toBe(true);
      expect(result.defaultInterval.type).toBe(
        existingSettings.defaultInterval.type,
      );
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('デフォルト設定を利用している全金融機関の次回同期時刻を再計算する', async () => {
      // Arrange
      const existingSettings = SyncSettings.createDefault();
      const defaultInterval = new SyncInterval(SyncIntervalType.STANDARD);
      const institutionSettings1 = InstitutionSyncSettings.create(
        'inst-1',
        null,
        defaultInterval,
      );
      const institutionSettings2 = InstitutionSyncSettings.create(
        'inst-2',
        new SyncInterval(SyncIntervalType.FREQUENT),
        defaultInterval,
      );

      mockRepository.find.mockResolvedValue(existingSettings);
      mockRepository.save.mockImplementation(async (settings) => settings);
      mockRepository.findAllInstitutionSettings.mockResolvedValue([
        institutionSettings1,
        institutionSettings2,
      ]);
      mockRepository.saveInstitutionSettings.mockImplementation(
        async (settings) => settings,
      );

      const dto = {
        defaultInterval: {
          type: SyncIntervalType.FREQUENT,
        },
      };

      // Act
      await useCase.execute(dto);

      // Assert
      // デフォルト設定と同じ間隔を使用している金融機関のみ更新される
      expect(mockRepository.saveInstitutionSettings).toHaveBeenCalledTimes(1);
    });
  });
});
