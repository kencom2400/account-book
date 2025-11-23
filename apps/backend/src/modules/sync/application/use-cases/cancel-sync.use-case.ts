import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import type { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { SYNC_HISTORY_REPOSITORY } from '../../sync.tokens';

/**
 * 同期キャンセル結果
 */
export interface CancelSyncOutput {
  success: boolean;
  message: string;
}

/**
 * 同期キャンセルユースケース
 *
 * @description
 * 実行中の同期をキャンセルします。
 * キャンセルされた同期は CANCELLED ステータスに更新されます。
 *
 * @usecase
 * @layer Application
 */
@Injectable()
export class CancelSyncUseCase {
  private readonly logger = new Logger(CancelSyncUseCase.name);

  constructor(
    @Inject(SYNC_HISTORY_REPOSITORY)
    private readonly syncHistoryRepository: ISyncHistoryRepository,
  ) {}

  /**
   * 同期をキャンセル
   *
   * @param syncId - 同期履歴ID
   * @returns キャンセル結果
   * @throws NotFoundException - 同期履歴が見つからない場合
   */
  async execute(syncId: string): Promise<CancelSyncOutput> {
    this.logger.log(`同期キャンセル: ${syncId}`);

    // 同期履歴を取得
    const syncHistory = await this.syncHistoryRepository.findById(syncId);

    if (!syncHistory) {
      throw new NotFoundException(`Sync history not found: ${syncId}`);
    }

    // 実行中でない場合はキャンセルできない
    if (!syncHistory.isRunning()) {
      const message = `Cannot cancel sync: status is ${syncHistory.status}`;
      this.logger.warn(message);
      return {
        success: false,
        message,
      };
    }

    // キャンセル状態に更新
    const cancelledSync = syncHistory.markAsCancelled();
    await this.syncHistoryRepository.update(cancelledSync);

    // TODO: 実際の同期処理を停止する処理を実装
    // 現在はステータスを更新するのみ

    this.logger.log(`同期キャンセル完了: ${syncId}`);

    return {
      success: true,
      message: 'Sync cancelled successfully',
    };
  }
}
