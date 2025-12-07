import { Test, TestingModule } from '@nestjs/testing';
import { GetSyncSettingsUseCase } from './get-sync-settings.use-case';
import { SYNC_SETTINGS_REPOSITORY } from '../../sync.tokens';
import type { ISyncSettingsRepository } from '../../domain/repositories/sync-settings.repository.interface';
import { SyncSettings } from '../../domain/entities/sync-settings.entity';
import { SyncIntervalType } from '../../domain/enums/sync-interval-type.enum';

describe('GetSyncSettingsUseCase', () => {
  let useCase: GetSyncSettingsUseCase;
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
        GetSyncSettingsUseCase,
        {
          provide: SYNC_SETTINGS_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetSyncSettingsUseCase>(GetSyncSettingsUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('設定が存在する場合はその設定を返す', async () => {
      // Arrange
      const existingSettings = SyncSettings.createDefault();
      mockRepository.find.mockResolvedValue(existingSettings);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBe(existingSettings);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });

    it('設定が存在しない場合はデフォルト設定を返す', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue(null);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toBeInstanceOf(SyncSettings);
      expect(result.defaultInterval.type).toBe(SyncIntervalType.STANDARD);
      expect(result.wifiOnly).toBe(false);
      expect(result.batterySavingMode).toBe(false);
      expect(result.autoRetry).toBe(true);
      expect(result.maxRetryCount).toBe(3);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });
  });
});
