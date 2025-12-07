import { SyncSettings } from '../entities/sync-settings.entity';
import { InstitutionSyncSettings } from '../entities/institution-sync-settings.entity';

/**
 * 同期設定リポジトリインターフェース
 *
 * @description
 * 同期設定の永続化を担当するリポジトリのインターフェース。
 * FR-030: データ同期間隔の設定
 */
export interface ISyncSettingsRepository {
  /**
   * 全体設定を取得
   *
   * @returns 同期設定、存在しない場合はnull
   */
  find(): Promise<SyncSettings | null>;

  /**
   * 全体設定を保存
   *
   * @param settings - 保存する同期設定
   * @returns 保存された同期設定
   */
  save(settings: SyncSettings): Promise<SyncSettings>;

  /**
   * 特定金融機関の設定を取得
   *
   * @param institutionId - 金融機関ID
   * @returns 金融機関同期設定、存在しない場合はnull
   */
  findInstitutionSettings(
    institutionId: string,
  ): Promise<InstitutionSyncSettings | null>;

  /**
   * 全金融機関の設定を取得
   *
   * @returns 全金融機関の同期設定配列
   */
  findAllInstitutionSettings(): Promise<InstitutionSyncSettings[]>;

  /**
   * 金融機関設定を保存
   *
   * @param settings - 保存する金融機関同期設定
   * @returns 保存された金融機関同期設定
   */
  saveInstitutionSettings(
    settings: InstitutionSyncSettings,
  ): Promise<InstitutionSyncSettings>;

  /**
   * 金融機関設定を削除
   *
   * @param institutionId - 金融機関ID
   */
  deleteInstitutionSettings(institutionId: string): Promise<void>;
}
