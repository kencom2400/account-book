import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ISyncSettingsRepository } from '../../domain/repositories/sync-settings.repository.interface';
import { SYNC_SETTINGS_REPOSITORY } from '../../sync.tokens';
import { InstitutionSyncSettings } from '../../domain/entities/institution-sync-settings.entity';
import { SyncSettings } from '../../domain/entities/sync-settings.entity';

/**
 * 金融機関同期設定取得ユースケース
 *
 * @description
 * 特定金融機関の同期設定を取得します。
 * 設定が存在しない場合はデフォルト設定を使用して新規作成します。
 * FR-030: データ同期間隔の設定
 *
 * @usecase
 * @layer Application
 */
@Injectable()
export class GetInstitutionSyncSettingsUseCase {
  private readonly logger = new Logger(GetInstitutionSyncSettingsUseCase.name);

  constructor(
    @Inject(SYNC_SETTINGS_REPOSITORY)
    private readonly syncSettingsRepository: ISyncSettingsRepository,
  ) {}

  /**
   * 金融機関同期設定を取得
   *
   * @param institutionId - 金融機関ID
   * @returns 金融機関同期設定
   * @throws NotFoundException 金融機関が存在しない場合
   */
  async execute(institutionId: string): Promise<InstitutionSyncSettings> {
    this.logger.log(
      `金融機関同期設定取得を開始: institutionId=${institutionId}`,
    );

    // 金融機関設定を取得
    let institutionSettings =
      await this.syncSettingsRepository.findInstitutionSettings(institutionId);

    // 設定が存在しない場合はデフォルト設定を使用して新規作成
    if (!institutionSettings) {
      this.logger.log(
        `金融機関設定が存在しないため、デフォルト設定を使用して新規作成: institutionId=${institutionId}`,
      );

      // 全体設定を取得（デフォルト設定用）
      const syncSettings = await this.syncSettingsRepository.find();
      const defaultInterval = syncSettings
        ? syncSettings.defaultInterval
        : SyncSettings.createDefault().defaultInterval;

      // 新規作成
      institutionSettings = InstitutionSyncSettings.create(
        institutionId,
        null, // デフォルト設定を使用
        defaultInterval,
      );

      // 保存
      institutionSettings =
        await this.syncSettingsRepository.saveInstitutionSettings(
          institutionSettings,
        );
    }

    this.logger.log(`金融機関同期設定取得完了: institutionId=${institutionId}`);
    return institutionSettings;
  }
}
