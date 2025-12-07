import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

// Swaggerデコレータをモック
jest.mock('@nestjs/swagger', () => ({
  ApiTags: () => jest.fn(),
  ApiOperation: () => jest.fn(),
  ApiResponse: () => jest.fn(),
  ApiBearerAuth: () => jest.fn(),
  ApiProperty: () => jest.fn(),
  ApiPropertyOptional: () => jest.fn(),
}));

import { SyncSettingsController } from './sync-settings.controller';
import { GetSyncSettingsUseCase } from '../../application/use-cases/get-sync-settings.use-case';
import { UpdateSyncSettingsUseCase } from '../../application/use-cases/update-sync-settings.use-case';
import { GetInstitutionSyncSettingsUseCase } from '../../application/use-cases/get-institution-sync-settings.use-case';
import { GetAllInstitutionSyncSettingsUseCase } from '../../application/use-cases/get-all-institution-sync-settings.use-case';
import { UpdateInstitutionSyncSettingsUseCase } from '../../application/use-cases/update-institution-sync-settings.use-case';
import { SyncSettings } from '../../domain/entities/sync-settings.entity';
import { InstitutionSyncSettings } from '../../domain/entities/institution-sync-settings.entity';
import { SyncInterval } from '../../domain/value-objects/sync-interval.vo';
import { SyncIntervalType } from '../../domain/enums/sync-interval-type.enum';
import { TimeUnit } from '../../domain/enums/time-unit.enum';

describe('SyncSettingsController', () => {
  let controller: SyncSettingsController;
  let getSyncSettingsUseCase: jest.Mocked<GetSyncSettingsUseCase>;
  let updateSyncSettingsUseCase: jest.Mocked<UpdateSyncSettingsUseCase>;
  let getInstitutionSyncSettingsUseCase: jest.Mocked<GetInstitutionSyncSettingsUseCase>;
  let getAllInstitutionSyncSettingsUseCase: jest.Mocked<GetAllInstitutionSyncSettingsUseCase>;
  let updateInstitutionSyncSettingsUseCase: jest.Mocked<UpdateInstitutionSyncSettingsUseCase>;

  beforeEach(async () => {
    getSyncSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    updateSyncSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    getInstitutionSyncSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    getAllInstitutionSyncSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    updateInstitutionSyncSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncSettingsController],
      providers: [
        {
          provide: GetSyncSettingsUseCase,
          useValue: getSyncSettingsUseCase,
        },
        {
          provide: UpdateSyncSettingsUseCase,
          useValue: updateSyncSettingsUseCase,
        },
        {
          provide: GetInstitutionSyncSettingsUseCase,
          useValue: getInstitutionSyncSettingsUseCase,
        },
        {
          provide: GetAllInstitutionSyncSettingsUseCase,
          useValue: getAllInstitutionSyncSettingsUseCase,
        },
        {
          provide: UpdateInstitutionSyncSettingsUseCase,
          useValue: updateInstitutionSyncSettingsUseCase,
        },
      ],
    }).compile();

    module.useLogger(false);

    controller = module.get<SyncSettingsController>(SyncSettingsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSyncSettings', () => {
    it('全体設定を取得できる', async () => {
      const settings = SyncSettings.createDefault();
      getSyncSettingsUseCase.execute.mockResolvedValue(settings);

      const result = await controller.getSyncSettings();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.defaultInterval.type).toBe(
        settings.defaultInterval.type,
      );
      expect(result.data.wifiOnly).toBe(settings.wifiOnly);
      expect(result.data.batterySavingMode).toBe(settings.batterySavingMode);
      expect(result.data.autoRetry).toBe(settings.autoRetry);
      expect(result.data.maxRetryCount).toBe(settings.maxRetryCount);
      expect(getSyncSettingsUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('エラー時にエラーを投げる', async () => {
      const error = new Error('Database error');
      getSyncSettingsUseCase.execute.mockRejectedValue(error);

      await expect(controller.getSyncSettings()).rejects.toThrow(error);
    });
  });

  describe('updateSyncSettings', () => {
    it('全体設定を更新できる', async () => {
      const settings = SyncSettings.createDefault();
      const newInterval = new SyncInterval(SyncIntervalType.FREQUENT);
      const updatedSettings = settings.updateDefaultInterval(newInterval);

      updateSyncSettingsUseCase.execute.mockResolvedValue(updatedSettings);

      const dto = {
        defaultInterval: {
          type: SyncIntervalType.FREQUENT,
        },
      };

      const result = await controller.updateSyncSettings(dto);

      expect(result.success).toBe(true);
      expect(result.data.defaultInterval.type).toBe(SyncIntervalType.FREQUENT);
      expect(updateSyncSettingsUseCase.execute).toHaveBeenCalledWith({
        defaultInterval: {
          type: SyncIntervalType.FREQUENT,
          value: undefined,
          unit: undefined,
          customSchedule: undefined,
        },
        wifiOnly: undefined,
        batterySavingMode: undefined,
        autoRetry: undefined,
        maxRetryCount: undefined,
        nightModeSuspend: undefined,
        nightModeStart: undefined,
        nightModeEnd: undefined,
      });
    });

    it('部分更新ができる', async () => {
      const settings = SyncSettings.createDefault();
      const updatedSettings = settings.updateOptions({ wifiOnly: true });

      updateSyncSettingsUseCase.execute.mockResolvedValue(updatedSettings);

      const dto = {
        wifiOnly: true,
      };

      const result = await controller.updateSyncSettings(dto);

      expect(result.success).toBe(true);
      expect(result.data.wifiOnly).toBe(true);
    });

    it('カスタム間隔で更新できる', async () => {
      const settings = SyncSettings.createDefault();
      const customInterval = new SyncInterval(
        SyncIntervalType.CUSTOM,
        30,
        TimeUnit.MINUTES,
      );
      const updatedSettings = settings.updateDefaultInterval(customInterval);

      updateSyncSettingsUseCase.execute.mockResolvedValue(updatedSettings);

      const dto = {
        defaultInterval: {
          type: SyncIntervalType.CUSTOM,
          value: 30,
          unit: TimeUnit.MINUTES,
        },
      };

      const result = await controller.updateSyncSettings(dto);

      expect(result.success).toBe(true);
      expect(result.data.defaultInterval.type).toBe(SyncIntervalType.CUSTOM);
      expect(result.data.defaultInterval.value).toBe(30);
      expect(result.data.defaultInterval.unit).toBe(TimeUnit.MINUTES);
    });

    it('バリデーションエラー時にBadRequestExceptionを投げる', async () => {
      const error = new Error('Invalid maxRetryCount');
      updateSyncSettingsUseCase.execute.mockRejectedValue(error);

      const dto = {
        maxRetryCount: 11, // 無効な値
      };

      await expect(controller.updateSyncSettings(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAllInstitutionSyncSettings', () => {
    it('全金融機関の設定を取得できる', async () => {
      const defaultInterval = SyncSettings.createDefault().defaultInterval;
      const settings1 = InstitutionSyncSettings.create(
        'institution-001',
        null,
        defaultInterval,
      );
      const settings2 = InstitutionSyncSettings.create(
        'institution-002',
        null,
        defaultInterval,
      );

      getAllInstitutionSyncSettingsUseCase.execute.mockResolvedValue([
        settings1,
        settings2,
      ]);

      const result = await controller.getAllInstitutionSyncSettings();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].institutionId).toBe('institution-001');
      expect(result.data[1].institutionId).toBe('institution-002');
      expect(
        getAllInstitutionSyncSettingsUseCase.execute,
      ).toHaveBeenCalledTimes(1);
    });

    it('設定が存在しない場合は空配列を返す', async () => {
      getAllInstitutionSyncSettingsUseCase.execute.mockResolvedValue([]);

      const result = await controller.getAllInstitutionSyncSettings();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('エラー時にエラーを投げる', async () => {
      const error = new Error('Database error');
      getAllInstitutionSyncSettingsUseCase.execute.mockRejectedValue(error);

      await expect(controller.getAllInstitutionSyncSettings()).rejects.toThrow(
        error,
      );
    });
  });

  describe('getInstitutionSyncSettings', () => {
    it('特定金融機関の設定を取得できる', async () => {
      const defaultInterval = SyncSettings.createDefault().defaultInterval;
      const settings = InstitutionSyncSettings.create(
        'institution-001',
        null,
        defaultInterval,
      );

      getInstitutionSyncSettingsUseCase.execute.mockResolvedValue(settings);

      const result =
        await controller.getInstitutionSyncSettings('institution-001');

      expect(result.success).toBe(true);
      expect(result.data.institutionId).toBe('institution-001');
      expect(result.data.interval.type).toBe(settings.interval.type);
      expect(result.data.enabled).toBe(settings.enabled);
      expect(getInstitutionSyncSettingsUseCase.execute).toHaveBeenCalledWith(
        'institution-001',
      );
    });

    it('エラー時にエラーを投げる', async () => {
      const error = new Error('Institution not found');
      getInstitutionSyncSettingsUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.getInstitutionSyncSettings('institution-001'),
      ).rejects.toThrow(error);
    });
  });

  describe('updateInstitutionSyncSettings', () => {
    it('金融機関設定を更新できる', async () => {
      const defaultInterval = SyncSettings.createDefault().defaultInterval;
      const settings = InstitutionSyncSettings.create(
        'institution-001',
        null,
        defaultInterval,
      );
      const newInterval = new SyncInterval(SyncIntervalType.FREQUENT);
      const updatedSettings = settings.updateInterval(newInterval);

      updateInstitutionSyncSettingsUseCase.execute.mockResolvedValue(
        updatedSettings,
      );

      const dto = {
        interval: {
          type: SyncIntervalType.FREQUENT,
        },
      };

      const result = await controller.updateInstitutionSyncSettings(
        'institution-001',
        dto,
      );

      expect(result.success).toBe(true);
      expect(result.data.interval.type).toBe(SyncIntervalType.FREQUENT);
      expect(updateInstitutionSyncSettingsUseCase.execute).toHaveBeenCalledWith(
        'institution-001',
        {
          interval: {
            type: SyncIntervalType.FREQUENT,
            value: undefined,
            unit: undefined,
            customSchedule: undefined,
          },
          enabled: undefined,
        },
      );
    });

    it('有効/無効を更新できる', async () => {
      const defaultInterval = SyncSettings.createDefault().defaultInterval;
      const settings = InstitutionSyncSettings.create(
        'institution-001',
        null,
        defaultInterval,
      );
      const updatedSettings = settings.setEnabled(false);

      updateInstitutionSyncSettingsUseCase.execute.mockResolvedValue(
        updatedSettings,
      );

      const dto = {
        enabled: false,
      };

      const result = await controller.updateInstitutionSyncSettings(
        'institution-001',
        dto,
      );

      expect(result.success).toBe(true);
      expect(result.data.enabled).toBe(false);
    });

    it('カスタム間隔で更新できる', async () => {
      const defaultInterval = SyncSettings.createDefault().defaultInterval;
      const settings = InstitutionSyncSettings.create(
        'institution-001',
        null,
        defaultInterval,
      );
      const customInterval = new SyncInterval(
        SyncIntervalType.CUSTOM,
        30,
        TimeUnit.MINUTES,
      );
      const updatedSettings = settings.updateInterval(customInterval);

      updateInstitutionSyncSettingsUseCase.execute.mockResolvedValue(
        updatedSettings,
      );

      const dto = {
        interval: {
          type: SyncIntervalType.CUSTOM,
          value: 30,
          unit: TimeUnit.MINUTES,
        },
      };

      const result = await controller.updateInstitutionSyncSettings(
        'institution-001',
        dto,
      );

      expect(result.success).toBe(true);
      expect(result.data.interval.type).toBe(SyncIntervalType.CUSTOM);
      expect(result.data.interval.value).toBe(30);
      expect(result.data.interval.unit).toBe(TimeUnit.MINUTES);
    });

    it('バリデーションエラー時にBadRequestExceptionを投げる', async () => {
      const error = new Error('Invalid interval');
      updateInstitutionSyncSettingsUseCase.execute.mockRejectedValue(error);

      const dto = {
        interval: {
          type: SyncIntervalType.CUSTOM,
          value: -1, // 無効な値
        },
      };

      await expect(
        controller.updateInstitutionSyncSettings('institution-001', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('エラー時にエラーを投げる', async () => {
      const error = new Error('Institution not found');
      updateInstitutionSyncSettingsUseCase.execute.mockRejectedValue(error);

      const dto = {
        enabled: true,
      };

      await expect(
        controller.updateInstitutionSyncSettings('institution-999', dto),
      ).rejects.toThrow(error);
    });
  });
});
