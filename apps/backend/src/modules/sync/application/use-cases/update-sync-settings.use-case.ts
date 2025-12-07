import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ISyncSettingsRepository } from '../../domain/repositories/sync-settings.repository.interface';
import type { ISchedulerService } from '../services/scheduler.service.interface';
import { SYNC_SETTINGS_REPOSITORY } from '../../sync.tokens';
import { SyncSettings } from '../../domain/entities/sync-settings.entity';
import { SyncInterval } from '../../domain/value-objects/sync-interval.vo';
import { SyncIntervalType } from '../../domain/enums/sync-interval-type.enum';
import { TimeUnit } from '../../domain/enums/time-unit.enum';

/**
 * 同期設定更新DTO
 */
export interface UpdateSyncSettingsDto {
  defaultInterval?: {
    type: SyncIntervalType;
    value?: number;
    unit?: TimeUnit;
    customSchedule?: string;
  };
  wifiOnly?: boolean;
  batterySavingMode?: boolean;
  autoRetry?: boolean;
  maxRetryCount?: number;
  nightModeSuspend?: boolean;
  nightModeStart?: string;
  nightModeEnd?: string;
}

/**
 * 同期設定更新ユースケース
 *
 * @description
 * 全体の同期設定を更新します。
 * 部分更新をサポートし、設定が存在しない場合は新規作成します。
 * デフォルト設定を利用している全金融機関の次回同期時刻も再計算します。
 * FR-030: データ同期間隔の設定
 *
 * @usecase
 * @layer Application
 */
@Injectable()
export class UpdateSyncSettingsUseCase {
  private readonly logger = new Logger(UpdateSyncSettingsUseCase.name);

  constructor(
    @Inject(SYNC_SETTINGS_REPOSITORY)
    private readonly syncSettingsRepository: ISyncSettingsRepository,
    @Inject('ISchedulerService')
    private readonly schedulerService: ISchedulerService,
  ) {}

  /**
   * 同期設定を更新
   *
   * @param dto - 更新DTO（部分更新をサポート）
   * @returns 更新された同期設定
   */
  async execute(dto: UpdateSyncSettingsDto): Promise<SyncSettings> {
    this.logger.log('同期設定更新を開始');

    // 既存設定を取得
    let settings = await this.syncSettingsRepository.find();

    // 設定が存在しない場合は新規作成
    if (!settings) {
      this.logger.log('同期設定が存在しないため、新規作成');
      settings = SyncSettings.createDefault();
    }

    // デフォルト同期間隔を更新
    if (dto.defaultInterval) {
      const interval = SyncInterval.fromPlain(dto.defaultInterval);
      settings = settings.updateDefaultInterval(interval);
    }

    // 詳細オプションを更新
    const options: {
      wifiOnly?: boolean;
      batterySavingMode?: boolean;
      autoRetry?: boolean;
      maxRetryCount?: number;
      nightModeSuspend?: boolean;
      nightModeStart?: string;
      nightModeEnd?: string;
    } = {};

    if (dto.wifiOnly !== undefined) {
      options.wifiOnly = dto.wifiOnly;
    }
    if (dto.batterySavingMode !== undefined) {
      options.batterySavingMode = dto.batterySavingMode;
    }
    if (dto.autoRetry !== undefined) {
      options.autoRetry = dto.autoRetry;
    }
    if (dto.maxRetryCount !== undefined) {
      options.maxRetryCount = dto.maxRetryCount;
    }
    if (dto.nightModeSuspend !== undefined) {
      options.nightModeSuspend = dto.nightModeSuspend;
    }
    if (dto.nightModeStart !== undefined) {
      options.nightModeStart = dto.nightModeStart;
    }
    if (dto.nightModeEnd !== undefined) {
      options.nightModeEnd = dto.nightModeEnd;
    }

    if (Object.keys(options).length > 0) {
      settings = settings.updateOptions(options);
    }

    // デフォルト設定を利用している全金融機関の次回同期時刻を再計算
    await this.recalculateInstitutionNextSyncTimes(settings);

    // 設定を保存
    const savedSettings = await this.syncSettingsRepository.save(settings);

    // スケジュールを更新
    await this.schedulerService.updateSchedule(savedSettings);

    this.logger.log('同期設定更新完了');
    return savedSettings;
  }

  /**
   * デフォルト設定を利用している全金融機関の次回同期時刻を再計算
   *
   * @param settings - 更新された同期設定
   */
  private async recalculateInstitutionNextSyncTimes(
    settings: SyncSettings,
  ): Promise<void> {
    this.logger.log(
      'デフォルト設定を利用している全金融機関の次回同期時刻を再計算',
    );

    const allInstitutionSettings =
      await this.syncSettingsRepository.findAllInstitutionSettings();

    for (const institutionSettings of allInstitutionSettings) {
      // デフォルト設定を利用している場合（個別設定がない場合）
      // または、個別設定がデフォルト設定と同じ場合
      // 注: 個別設定が明示的に設定されていない場合は、デフォルト設定を使用
      // ここでは、intervalがデフォルト設定と同じ場合に再計算
      if (institutionSettings.interval.equals(settings.defaultInterval)) {
        const updated = institutionSettings.updateInterval(
          settings.defaultInterval,
        );

        await this.syncSettingsRepository.saveInstitutionSettings(updated);
      }
    }
  }
}
