import { Test, TestingModule } from '@nestjs/testing';
import { GetInstitutionSyncSettingsUseCase } from './get-institution-sync-settings.use-case';
import { SYNC_SETTINGS_REPOSITORY } from '../../sync.tokens';
import type { ISyncSettingsRepository } from '../../domain/repositories/sync-settings.repository.interface';
import { SyncSettings } from '../../domain/entities/sync-settings.entity';
import { InstitutionSyncSettings } from '../../domain/entities/institution-sync-settings.entity';
import { SyncIntervalType } from '../../domain/enums/sync-interval-type.enum';

describe('GetInstitutionSyncSettingsUseCase', () => {
  let useCase: GetInstitutionSyncSettingsUseCase;
  let mockRepository: jest.Mocked<ISyncSettingsRepository>;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      save: jest.fn(),
      findInstitutionSettings: jest.fn(),
      findAllInstitutionSettings: jest.fn(),
      saveInstitutionSettings: jest.fn(),
      deleteInstitutionSettings: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetInstitutionSyncSettingsUseCase,
        {
          provide: SYNC_SETTINGS_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetInstitutionSyncSettingsUseCase>(
      GetInstitutionSyncSettingsUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('設定が存在する場合はその設定を返す', async () => {
      // Arrange
      const institutionId = 'inst-001';
      const existingSettings = InstitutionSyncSettings.create(
        institutionId,
        null,
        SyncSettings.createDefault().defaultInterval,
      );
      mockRepository.findInstitutionSettings.mockResolvedValue(
        existingSettings,
      );

      // Act
      const result = await useCase.execute(institutionId);

      // Assert
      expect(result).toBe(existingSettings);
      expect(mockRepository.findInstitutionSettings).toHaveBeenCalledWith(
        institutionId,
      );
      expect(mockRepository.findInstitutionSettings).toHaveBeenCalledTimes(1);
    });

    it('設定が存在しない場合はデフォルト設定を使用して新規作成する', async () => {
      // Arrange
      const institutionId = 'inst-001';
      const defaultSettings = SyncSettings.createDefault();
      mockRepository.findInstitutionSettings.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue(defaultSettings);
      mockRepository.saveInstitutionSettings.mockImplementation(
        async (settings) => settings,
      );

      // Act
      const result = await useCase.execute(institutionId);

      // Assert
      expect(result).toBeInstanceOf(InstitutionSyncSettings);
      expect(result.institutionId).toBe(institutionId);
      expect(result.interval.type).toBe(SyncIntervalType.STANDARD);
      expect(mockRepository.saveInstitutionSettings).toHaveBeenCalledTimes(1);
    });

    it('全体設定が存在しない場合はデフォルト設定を作成して使用する', async () => {
      // Arrange
      const institutionId = 'inst-001';
      mockRepository.findInstitutionSettings.mockResolvedValue(null);
      mockRepository.find.mockResolvedValue(null);
      mockRepository.saveInstitutionSettings.mockImplementation(
        async (settings) => settings,
      );

      // Act
      const result = await useCase.execute(institutionId);

      // Assert
      expect(result).toBeInstanceOf(InstitutionSyncSettings);
      expect(result.institutionId).toBe(institutionId);
      expect(mockRepository.saveInstitutionSettings).toHaveBeenCalledTimes(1);
    });
  });
});
