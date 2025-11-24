import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import type { IInstitutionRepository } from '../../../institution/domain/repositories/institution.repository.interface';
import { SYNC_HISTORY_REPOSITORY } from '../../sync.tokens';
import { INSTITUTION_REPOSITORY } from '../../../institution/institution.tokens';
import {
  SyncResult,
  SyncAllTransactionsResult,
  SyncTarget,
} from '../dto/sync-result.dto';
import { SyncHistory } from '../../domain/entities/sync-history.entity';
import { SyncStatus } from '../../domain/enums/sync-status.enum';
import { randomUUID } from 'crypto';

/**
 * 全金融機関の取引同期ユースケース
 *
 * @description
 * すべての接続済み金融機関から取引履歴を同期します。
 * 並行実行、差分同期、リトライをサポートします。
 *
 * @usecase
 * @layer Application
 */
@Injectable()
export class SyncAllTransactionsUseCase {
  private readonly logger = new Logger(SyncAllTransactionsUseCase.name);

  // ConfigServiceで環境変数を管理（デフォルト: 5件同時実行）
  // 【参照】: docs/detailed-design/FR-006_auto-fetch-transactions/未実装機能リスト.md
  private readonly MAX_PARALLEL: number;

  constructor(
    @Inject(SYNC_HISTORY_REPOSITORY)
    private readonly syncHistoryRepository: ISyncHistoryRepository,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
    private readonly configService: ConfigService,
  ) {
    this.MAX_PARALLEL = this.configService.get<number>('SYNC_MAX_PARALLEL', 5);
  }

  /**
   * 全金融機関の取引を同期
   *
   * @param input - 同期オプション
   * @returns 同期結果
   */
  async execute(input?: {
    forceFullSync?: boolean;
    institutionIds?: string[];
  }): Promise<SyncAllTransactionsResult> {
    const startTime = Date.now();
    this.logger.log('=== 全金融機関の同期開始 ===');

    // 同期対象の金融機関を取得
    const targets = await this.getSyncTargets(input?.institutionIds);

    if (targets.length === 0) {
      this.logger.warn('同期対象の金融機関がありません');
      return {
        results: [],
        summary: {
          totalInstitutions: 0,
          successCount: 0,
          failureCount: 0,
          totalFetched: 0,
          totalNew: 0,
          totalDuplicate: 0,
          duration: Date.now() - startTime,
        },
      };
    }

    this.logger.log(`同期対象: ${targets.length}件の金融機関`);

    // 並行同期実行
    const results = await this.syncInParallel(
      targets,
      input?.forceFullSync || false,
    );

    // サマリー作成
    const summary = this.createSummary(results, Date.now() - startTime);

    this.logger.log(
      `=== 全金融機関の同期完了 ===\n` +
        `  対象: ${summary.totalInstitutions}件\n` +
        `  成功: ${summary.successCount}件\n` +
        `  失敗: ${summary.failureCount}件\n` +
        `  新規データ: ${summary.totalNew}件\n` +
        `  処理時間: ${(summary.duration / 1000).toFixed(2)}秒`,
    );

    return { results, summary };
  }

  /**
   * 同期対象の金融機関を取得
   */
  private async getSyncTargets(
    institutionIds?: string[],
  ): Promise<SyncTarget[]> {
    // 指定されたIDがある場合はそれを取得、なければ全接続済み金融機関を取得
    if (institutionIds) {
      const institutions = await Promise.all(
        institutionIds.map((id) => this.institutionRepository.findById(id)),
      );
      // 型ガードを使用してnullと未接続を除外
      return institutions
        .filter(
          (inst): inst is NonNullable<typeof inst> =>
            inst !== null && inst.isConnected,
        )
        .map((inst) => ({
          institutionId: inst.id,
          institutionName: inst.name,
          institutionType: inst.type as 'bank' | 'credit-card' | 'securities',
          lastSyncDate: inst.lastSyncedAt,
        }));
    }

    const institutions =
      await this.institutionRepository.findByConnectionStatus(true);
    return institutions.map((inst) => ({
      institutionId: inst.id,
      institutionName: inst.name,
      institutionType: inst.type as 'bank' | 'credit-card' | 'securities',
      lastSyncDate: inst.lastSyncedAt,
    }));
  }

  /**
   * 金融機関を並行同期
   */
  private async syncInParallel(
    targets: SyncTarget[],
    forceFullSync: boolean,
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    // MAX_PARALLEL件ずつ並行実行
    for (let i = 0; i < targets.length; i += this.MAX_PARALLEL) {
      const batch = targets.slice(i, i + this.MAX_PARALLEL);
      const batchResults = await Promise.allSettled(
        batch.map((target) => this.syncOne(target, forceFullSync)),
      );

      // 結果を集約
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // 失敗した場合もエラー結果として記録
          const target = batch[index];
          let errorMessage = 'Unknown error';
          if (result.reason instanceof Error) {
            errorMessage = result.reason.message;
          } else if (typeof result.reason === 'string') {
            errorMessage = result.reason;
          }

          results.push({
            syncHistoryId: randomUUID(), // エラー報告用の一時的なID
            institutionId: target.institutionId,
            institutionName: target.institutionName,
            institutionType: target.institutionType,
            status: SyncStatus.FAILED,
            success: false,
            totalFetched: 0,
            newRecords: 0,
            duplicateRecords: 0,
            errorMessage,
            retryCount: 0,
            duration: 0,
            startedAt: new Date(),
            completedAt: new Date(),
          });
        }
      });
    }

    return results;
  }

  /**
   * 1つの金融機関を同期
   *
   * @param target - 同期対象
   * @param _forceFullSync - 全件同期フラグ（TODO: 実装予定）
   * @returns 同期結果
   */
  private async syncOne(
    target: SyncTarget,
    _forceFullSync: boolean,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    this.logger.log(
      `同期開始: ${target.institutionName} (${target.institutionType})`,
    );

    // 同期履歴を作成
    let syncHistory = SyncHistory.create(
      target.institutionId,
      target.institutionName,
      target.institutionType,
    );
    syncHistory = await this.syncHistoryRepository.create(syncHistory);

    try {
      // RUNNING状態に更新
      syncHistory = syncHistory.markAsRunning();
      syncHistory = await this.syncHistoryRepository.update(syncHistory);

      // TODO: 実際の金融機関APIから取引を取得する処理を実装。詳細は未実装機能リストを参照。
      // 【参照】: docs/detailed-design/FR-006_auto-fetch-transactions/未実装機能リスト.md
      // 【依存】: FR-001（銀行連携）、FR-002（カード連携）、FR-003（証券連携）
      // 【実装方針】: institutionTypeに応じて適切なUseCaseを呼び出す
      //   - FetchBankTransactionsUseCase
      //   - FetchCreditCardTransactionsUseCase
      //   - FetchSecurityTransactionsUseCase
      // 現在はモックデータとして処理
      const totalFetched = 0;
      const newRecords = 0;
      const duplicateRecords = 0;

      // COMPLETED状態に更新
      syncHistory = syncHistory.markAsCompleted(
        totalFetched,
        newRecords,
        duplicateRecords,
      );
      syncHistory = await this.syncHistoryRepository.update(syncHistory);

      const duration = Date.now() - startTime;
      this.logger.log(
        `同期完了: ${target.institutionName} - 新規${newRecords}件 (${(duration / 1000).toFixed(2)}秒)`,
      );

      return {
        syncHistoryId: syncHistory.id,
        institutionId: target.institutionId,
        institutionName: target.institutionName,
        institutionType: target.institutionType,
        status: syncHistory.status,
        success: true,
        totalFetched,
        newRecords,
        duplicateRecords,
        errorMessage: null,
        retryCount: syncHistory.retryCount,
        duration,
        startedAt: syncHistory.startedAt,
        completedAt: syncHistory.completedAt,
      };
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      this.logger.error(
        `同期失敗: ${target.institutionName} - ${errorMessage}`,
      );

      // FAILED状態に更新
      syncHistory = syncHistory.markAsFailed(errorMessage);
      await this.syncHistoryRepository.update(syncHistory);

      return {
        syncHistoryId: syncHistory.id,
        institutionId: target.institutionId,
        institutionName: target.institutionName,
        institutionType: target.institutionType,
        status: syncHistory.status,
        success: false,
        totalFetched: 0,
        newRecords: 0,
        duplicateRecords: 0,
        errorMessage,
        retryCount: syncHistory.retryCount,
        duration: Date.now() - startTime,
        startedAt: syncHistory.startedAt,
        completedAt: syncHistory.completedAt,
      };
    }
  }

  /**
   * サマリーを作成
   */
  private createSummary(
    results: SyncResult[],
    duration: number,
  ): SyncAllTransactionsResult['summary'] {
    return {
      totalInstitutions: results.length,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
      totalFetched: results.reduce((sum, r) => sum + r.totalFetched, 0),
      totalNew: results.reduce((sum, r) => sum + r.newRecords, 0),
      totalDuplicate: results.reduce((sum, r) => sum + r.duplicateRecords, 0),
      duration,
    };
  }
}
