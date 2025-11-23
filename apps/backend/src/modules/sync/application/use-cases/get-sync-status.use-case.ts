import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { SYNC_HISTORY_REPOSITORY } from '../../sync.tokens';

/**
 * 同期ステータス情報
 */
export interface SyncStatusInfo {
  isRunning: boolean;
  currentSyncId: string | null;
  startedAt: Date | null;
  progress: {
    totalInstitutions: number;
    completedInstitutions: number;
    currentInstitution: string;
    percentage: number;
  } | null;
}

/**
 * 同期ステータス取得ユースケース
 *
 * @description
 * 現在実行中の同期のステータスと進捗情報を取得します。
 *
 * @usecase
 * @layer Application
 */
@Injectable()
export class GetSyncStatusUseCase {
  private readonly logger = new Logger(GetSyncStatusUseCase.name);

  constructor(
    @Inject(SYNC_HISTORY_REPOSITORY)
    private readonly syncHistoryRepository: ISyncHistoryRepository,
  ) {}

  /**
   * 同期ステータスを取得
   *
   * @returns 同期ステータス情報
   */
  async execute(): Promise<SyncStatusInfo> {
    this.logger.log('同期ステータス取得');

    // 実行中の同期を取得
    const runningSync = await this.syncHistoryRepository.findRunning();

    if (runningSync.length === 0) {
      this.logger.log('実行中の同期なし');
      return {
        isRunning: false,
        currentSyncId: null,
        startedAt: null,
        progress: null,
      };
    }

    // 最新の実行中同期を取得（通常は1件のみ）
    const currentSync = runningSync[0];

    // TODO: 進捗情報の計算（現在はモック）
    // 実際にはOrchestratorまたは別のサービスから進捗情報を取得する必要がある
    const progress = {
      totalInstitutions: 5,
      completedInstitutions: 2,
      currentInstitution: currentSync.institutionName,
      percentage: 40,
    };

    this.logger.log(
      `実行中の同期: ${currentSync.id} (進捗: ${progress.percentage}%)`,
    );

    return {
      isRunning: true,
      currentSyncId: currentSync.id,
      startedAt: currentSync.startedAt,
      progress,
    };
  }
}
