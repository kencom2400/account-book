import { Test, TestingModule } from '@nestjs/testing';
import { UpdateInstitutionSyncSettingsUseCase } from './update-institution-sync-settings.use-case';
import { SYNC_SETTINGS_REPOSITORY } from '../../sync.tokens';
import type { ISyncSettingsRepository } from '../../domain/repositories/sync-settings.repository.interface';
import type { ISchedulerService } from '../services/scheduler.service.interface';
import { InstitutionSyncSettings } from '../../domain/entities/institution-sync-settings.entity';
import { SyncSettings } from '../../domain/entities/sync-settings.entity';
import { SyncIntervalType } from '../../domain/enums/sync-interval-type.enum';

describe('UpdateInstitutionSyncSettingsUseCase', () => {
  let useCase: UpdateInstitutionSyncSettingsUseCase;
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
        UpdateInstitutionSyncSettingsUseCase,
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

    useCase = module.get<UpdateInstitutionSyncSettingsUseCase>(
      UpdateInstitutionSyncSettingsUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('既存設定を更新する', async () => {
      // Arrange
      const institutionId = 'inst-001';
      const defaultInterval = SyncSettings.createDefault().defaultInterval;
      const existingSettings = InstitutionSyncSettings.create(
        institutionId,
        null,
        defaultInterval,
      );
      mockRepository.findInstitutionSettings.mockResolvedValue(
        existingSettings,
      );
      mockRepository.find.mockResolvedValue(SyncSettings.createDefault());
      mockRepository.saveInstitutionSettings.mockImplementation(
        async (settings) => settings,
      );

      const dto = {
        interval: {
          type: SyncIntervalType.FREQUENT,
        },
        enabled: false,
      };

      // Act
      const result = await useCase.execute(institutionId, dto);

      // Assert
      expect(result.interval.type).toBe(SyncIntervalType.FREQUENT);
      expect(result.enabled).toBe(false);
      expect(mockRepository.saveInstitutionSettings).toHaveBeenCalledTimes(1);
      expect(
        mockSchedulerService.updateInstitutionSchedule,
      ).toHaveBeenCalledTimes(1);
    });

    it('設定が存在しない場合は新規作成する', async () => {
      // Arrange
      const institutionId = 'inst-001';
      mockRepository.findInstitutionSettings.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue(SyncSettings.createDefault());
      mockRepository.saveInstitutionSettings.mockImplementation(
        async (settings) => settings,
      );

      const dto = {
        interval: {
          type: SyncIntervalType.STANDARD,
        },
      };

      // Act
      const result = await useCase.execute(institutionId, dto);

      // Assert
      expect(result).toBeInstanceOf(InstitutionSyncSettings);
      expect(result.institutionId).toBe(institutionId);
      expect(mockRepository.saveInstitutionSettings).toHaveBeenCalledTimes(1);
      expect(
        mockSchedulerService.updateInstitutionSchedule,
      ).toHaveBeenCalledTimes(1);
    });

    it('部分更新をサポートする', async () => {
      // Arrange
      const institutionId = 'inst-001';
      const defaultInterval = SyncSettings.createDefault().defaultInterval;
      const existingSettings = InstitutionSyncSettings.create(
        institutionId,
        null,
        defaultInterval,
      );
      mockRepository.findInstitutionSettings.mockResolvedValue(
        existingSettings,
      );
      mockRepository.find.mockResolvedValue(SyncSettings.createDefault());
      mockRepository.saveInstitutionSettings.mockImplementation(
        async (settings) => settings,
      );

      const dto = {
        enabled: false,
      };

      // Act
      const result = await useCase.execute(institutionId, dto);

      // Assert
      expect(result.enabled).toBe(false);
      expect(result.interval.type).toBe(existingSettings.interval.type);
      expect(mockRepository.saveInstitutionSettings).toHaveBeenCalledTimes(1);
    });
  });
});
