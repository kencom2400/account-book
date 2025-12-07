import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ISyncSettingsRepository } from '../../domain/repositories/sync-settings.repository.interface';
import type { ISchedulerService } from '../services/scheduler.service.interface';
import { SYNC_SETTINGS_REPOSITORY } from '../../sync.tokens';
import { InstitutionSyncSettings } from '../../domain/entities/institution-sync-settings.entity';
import { SyncSettings } from '../../domain/entities/sync-settings.entity';
import { SyncInterval } from '../../domain/value-objects/sync-interval.vo';
import { SyncIntervalType } from '../../domain/enums/sync-interval-type.enum';
import { TimeUnit } from '../../domain/enums/time-unit.enum';

/**
 * 金融機関同期設定更新DTO
 */
export interface UpdateInstitutionSyncSettingsDto {
  interval?: {
    type: SyncIntervalType;
    value?: number;
    unit?: TimeUnit;
    customSchedule?: string;
  };
  enabled?: boolean;
}

/**
 * 金融機関同期設定更新ユースケース
 *
 * @description
 * 特定金融機関の同期設定を更新します。
 * 部分更新をサポートし、設定が存在しない場合は新規作成します。
 * FR-030: データ同期間隔の設定
 *
 * @usecase
 * @layer Application
 */
@Injectable()
export class UpdateInstitutionSyncSettingsUseCase {
  private readonly logger = new Logger(
    UpdateInstitutionSyncSettingsUseCase.name,
  );

  constructor(
    @Inject(SYNC_SETTINGS_REPOSITORY)
    private readonly syncSettingsRepository: ISyncSettingsRepository,
    @Inject('ISchedulerService')
    private readonly schedulerService: ISchedulerService,
  ) {}

  /**
   * 金融機関同期設定を更新
   *
   * @param institutionId - 金融機関ID
   * @param dto - 更新DTO（部分更新をサポート）
   * @returns 更新された金融機関同期設定
   * @throws NotFoundException 金融機関が存在しない場合
   */
  async execute(
    institutionId: string,
    dto: UpdateInstitutionSyncSettingsDto,
  ): Promise<InstitutionSyncSettings> {
    this.logger.log(
      `金融機関同期設定更新を開始: institutionId=${institutionId}`,
    );

    // 既存設定を取得
    let institutionSettings =
      await this.syncSettingsRepository.findInstitutionSettings(institutionId);

    // 設定が存在しない場合は新規作成
    if (!institutionSettings) {
      this.logger.log(
        `金融機関設定が存在しないため、新規作成: institutionId=${institutionId}`,
      );

      // 全体設定を取得（デフォルト設定用）
      const syncSettings = await this.syncSettingsRepository.find();
      const defaultInterval = syncSettings
        ? syncSettings.defaultInterval
        : SyncSettings.createDefault().defaultInterval;

      // 新規作成
      institutionSettings = InstitutionSyncSettings.create(
        institutionId,
        dto.interval ? SyncInterval.fromPlain(dto.interval) : null,
        defaultInterval,
      );
    } else {
      // 既存設定を更新
      if (dto.interval) {
        const interval = SyncInterval.fromPlain(dto.interval);
        institutionSettings = institutionSettings.updateInterval(interval);
      }

      if (dto.enabled !== undefined) {
        institutionSettings = institutionSettings.setEnabled(dto.enabled);
      }
    }

    // 設定を保存
    const savedSettings =
      await this.syncSettingsRepository.saveInstitutionSettings(
        institutionSettings,
      );

    // スケジュールを更新
    await this.schedulerService.updateInstitutionSchedule(
      institutionId,
      savedSettings,
    );

    this.logger.log(`金融機関同期設定更新完了: institutionId=${institutionId}`);
    return savedSettings;
  }
}
