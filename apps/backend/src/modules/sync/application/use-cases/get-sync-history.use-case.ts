import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { SYNC_HISTORY_REPOSITORY } from '../../sync.tokens';
import { SyncHistory } from '../../domain/entities/sync-history.entity';
import { SyncStatus } from '../../domain/enums/sync-status.enum';

/**
 * 同期履歴取得入力
 */
export interface GetSyncHistoryInput {
  institutionId?: string;
  status?: SyncStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  page?: number;
}

/**
 * 同期履歴取得結果
 */
export interface GetSyncHistoryOutput {
  histories: SyncHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 同期履歴取得ユースケース
 *
 * @description
 * フィルタリングとページネーションをサポートした同期履歴の取得を行います。
 *
 * @usecase
 * @layer Application
 */
@Injectable()
export class GetSyncHistoryUseCase {
  private readonly logger = new Logger(GetSyncHistoryUseCase.name);

  constructor(
    @Inject(SYNC_HISTORY_REPOSITORY)
    private readonly syncHistoryRepository: ISyncHistoryRepository,
  ) {}

  /**
   * 同期履歴を取得
   *
   * @param input - フィルタ条件とページネーション設定
   * @returns 同期履歴と メタ情報
   */
  async execute(
    input: GetSyncHistoryInput = {},
  ): Promise<GetSyncHistoryOutput> {
    const limit = input.limit || 20;
    const page = input.page || 1;
    const offset = (page - 1) * limit;

    this.logger.log(
      `同期履歴取得: page=${page}, limit=${limit}, institutionId=${input.institutionId || 'all'}, status=${input.status || 'all'}`,
    );

    // フィルタ条件を構築
    const filters = {
      institutionId: input.institutionId,
      status: input.status,
      startDate: input.startDate,
      endDate: input.endDate,
    };

    // 履歴を取得
    const [histories, total] = await Promise.all([
      this.syncHistoryRepository.findWithFilters(filters, limit, offset),
      this.syncHistoryRepository.countWithFilters(filters),
    ]);

    const totalPages = Math.ceil(total / limit);

    this.logger.log(
      `同期履歴取得完了: ${histories.length}件取得（全${total}件）`,
    );

    return {
      histories,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
