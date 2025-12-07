import { Test, TestingModule } from '@nestjs/testing';
import { GetAllInstitutionSyncSettingsUseCase } from './get-all-institution-sync-settings.use-case';
import { SYNC_SETTINGS_REPOSITORY } from '../../sync.tokens';
import type { ISyncSettingsRepository } from '../../domain/repositories/sync-settings.repository.interface';
import { InstitutionSyncSettings } from '../../domain/entities/institution-sync-settings.entity';
import { SyncSettings } from '../../domain/entities/sync-settings.entity';

describe('GetAllInstitutionSyncSettingsUseCase', () => {
  let useCase: GetAllInstitutionSyncSettingsUseCase;
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
        GetAllInstitutionSyncSettingsUseCase,
        {
          provide: SYNC_SETTINGS_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetAllInstitutionSyncSettingsUseCase>(
      GetAllInstitutionSyncSettingsUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('全金融機関の設定を取得する', async () => {
      // Arrange
      const defaultInterval = SyncSettings.createDefault().defaultInterval;
      const settings1 = InstitutionSyncSettings.create(
        'inst-1',
        null,
        defaultInterval,
      );
      const settings2 = InstitutionSyncSettings.create(
        'inst-2',
        null,
        defaultInterval,
      );
      mockRepository.findAllInstitutionSettings.mockResolvedValue([
        settings1,
        settings2,
      ]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].institutionId).toBe('inst-1');
      expect(result[1].institutionId).toBe('inst-2');
      expect(mockRepository.findAllInstitutionSettings).toHaveBeenCalledTimes(
        1,
      );
    });

    it('設定が存在しない場合は空配列を返す', async () => {
      // Arrange
      mockRepository.findAllInstitutionSettings.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(0);
      expect(mockRepository.findAllInstitutionSettings).toHaveBeenCalledTimes(
        1,
      );
    });
  });
});
