import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ISyncSettingsRepository } from '../../domain/repositories/sync-settings.repository.interface';
import { SYNC_SETTINGS_REPOSITORY } from '../../sync.tokens';
import { InstitutionSyncSettings } from '../../domain/entities/institution-sync-settings.entity';

/**
 * 全金融機関同期設定取得ユースケース
 *
 * @description
 * 全金融機関の同期設定を取得します。
 * FR-030: データ同期間隔の設定
 *
 * @usecase
 * @layer Application
 */
@Injectable()
export class GetAllInstitutionSyncSettingsUseCase {
  private readonly logger = new Logger(
    GetAllInstitutionSyncSettingsUseCase.name,
  );

  constructor(
    @Inject(SYNC_SETTINGS_REPOSITORY)
    private readonly syncSettingsRepository: ISyncSettingsRepository,
  ) {}

  /**
   * 全金融機関の同期設定を取得
   *
   * @returns 全金融機関の同期設定配列
   */
  async execute(): Promise<InstitutionSyncSettings[]> {
    this.logger.log('全金融機関同期設定取得を開始');

    const institutionSettings =
      await this.syncSettingsRepository.findAllInstitutionSettings();

    this.logger.log(
      `全金融機関同期設定取得完了: ${institutionSettings.length}件`,
    );
    return institutionSettings;
  }
}
