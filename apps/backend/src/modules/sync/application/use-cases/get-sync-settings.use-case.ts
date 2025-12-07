import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ISyncSettingsRepository } from '../../domain/repositories/sync-settings.repository.interface';
import { SYNC_SETTINGS_REPOSITORY } from '../../sync.tokens';
import { SyncSettings } from '../../domain/entities/sync-settings.entity';

/**
 * 同期設定取得ユースケース
 *
 * @description
 * 全体の同期設定を取得します。
 * 設定が存在しない場合はデフォルト設定を返します。
 * FR-030: データ同期間隔の設定
 *
 * @usecase
 * @layer Application
 */
@Injectable()
export class GetSyncSettingsUseCase {
  private readonly logger = new Logger(GetSyncSettingsUseCase.name);

  constructor(
    @Inject(SYNC_SETTINGS_REPOSITORY)
    private readonly syncSettingsRepository: ISyncSettingsRepository,
  ) {}

  /**
   * 同期設定を取得
   *
   * @returns 同期設定（存在しない場合はデフォルト設定）
   */
  async execute(): Promise<SyncSettings> {
    this.logger.log('同期設定取得を開始');

    const settings = await this.syncSettingsRepository.find();

    if (!settings) {
      this.logger.log('同期設定が存在しないため、デフォルト設定を返却');
      return SyncSettings.createDefault();
    }

    this.logger.log('同期設定取得完了');
    return settings;
  }
}
