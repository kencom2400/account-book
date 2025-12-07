import { SyncSettings } from '../../domain/entities/sync-settings.entity';
import { InstitutionSyncSettings } from '../../domain/entities/institution-sync-settings.entity';

/**
 * スケジューラサービスインターフェース
 *
 * @description
 * スケジュール更新を担当するサービスのインターフェース。
 * Application層で定義し、Infrastructure層で実装します。
 * FR-030: データ同期間隔の設定
 *
 * @note
 * Onion Architecture原則に従い、Application層からInfrastructure層への
 * 直接依存を避けるため、インターフェースをApplication層に定義します。
 */
export interface ISchedulerService {
  /**
   * 全体のスケジュールを更新
   *
   * @param settings - 同期設定
   */
  updateSchedule(settings: SyncSettings): Promise<void>;

  /**
   * 特定金融機関のスケジュールを更新
   *
   * @param institutionId - 金融機関ID
   * @param settings - 金融機関同期設定
   */
  updateInstitutionSchedule(
    institutionId: string,
    settings: InstitutionSyncSettings,
  ): Promise<void>;
}
