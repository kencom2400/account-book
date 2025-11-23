import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SyncAllTransactionsUseCase } from '../../application/use-cases/sync-all-transactions.use-case';
import { GetSyncHistoryUseCase } from '../../application/use-cases/get-sync-history.use-case';
import { GetSyncStatusUseCase } from '../../application/use-cases/get-sync-status.use-case';
import { CancelSyncUseCase } from '../../application/use-cases/cancel-sync.use-case';
import {
  SyncAllTransactionsRequestDto,
  GetSyncHistoryRequestDto,
  UpdateSyncScheduleRequestDto,
} from '../dto/sync-request.dto';
import {
  SyncAllTransactionsResponseDto,
  SyncStatusResponseDto,
  SyncHistoryResponseDto,
  CancelSyncResponseDto,
  SyncHistoryDto,
} from '../dto/sync-response.dto';
import type { SyncScheduleResponseDto } from '../dto/sync-response.dto';

/**
 * 同期コントローラー
 *
 * @description
 * 取引履歴の自動同期機能を提供するAPIエンドポイント群
 *
 * @controller
 * @layer Presentation
 */
@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(
    private readonly syncAllTransactionsUseCase: SyncAllTransactionsUseCase,
    private readonly getSyncHistoryUseCase: GetSyncHistoryUseCase,
    private readonly getSyncStatusUseCase: GetSyncStatusUseCase,
    private readonly cancelSyncUseCase: CancelSyncUseCase,
  ) {}

  /**
   * 手動同期を開始
   *
   * POST /api/sync/start
   *
   * @param dto - 同期オプション
   * @returns 同期結果
   */
  @Post('start')
  @HttpCode(HttpStatus.OK)
  async startSync(
    @Body() dto: SyncAllTransactionsRequestDto,
  ): Promise<SyncAllTransactionsResponseDto> {
    this.logger.log('=== 手動同期開始 ===');

    const result = await this.syncAllTransactionsUseCase.execute({
      forceFullSync: dto.forceFullSync,
      institutionIds: dto.institutionIds,
    });

    // ドメインエンティティをDTOに変換
    const data: SyncHistoryDto[] = result.results.map((r) => ({
      id: r.syncHistoryId,
      institutionId: r.institutionId,
      institutionName: r.institutionName,
      institutionType: r.institutionType,
      status: r.status,
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      totalFetched: r.totalFetched,
      newRecords: r.newRecords,
      duplicateRecords: r.duplicateRecords,
      errorMessage: r.errorMessage,
      retryCount: 0, // TODO: SyncResultにretryCountを追加
    }));

    return {
      success: true,
      data,
      summary: {
        totalInstitutions: result.summary.totalInstitutions,
        successCount: result.summary.successCount,
        failureCount: result.summary.failureCount,
        totalFetched: result.summary.totalFetched,
        totalNew: result.summary.totalNew,
        totalDuplicate: result.summary.totalDuplicate,
        duration: result.summary.duration,
      },
    };
  }

  /**
   * 同期ステータスを取得
   *
   * GET /api/sync/status
   *
   * @returns 同期ステータス情報
   */
  @Get('status')
  async getSyncStatus(): Promise<SyncStatusResponseDto> {
    this.logger.log('同期ステータス取得');

    const status = await this.getSyncStatusUseCase.execute();

    return {
      success: true,
      data: {
        isRunning: status.isRunning,
        currentSyncId: status.currentSyncId,
        startedAt: status.startedAt ? status.startedAt.toISOString() : null,
        progress: status.progress,
      },
    };
  }

  /**
   * 同期履歴を取得
   *
   * GET /api/sync/history
   *
   * @param query - フィルタ条件とページネーション設定
   * @returns 同期履歴一覧
   */
  @Get('history')
  async getSyncHistory(
    @Query() query: GetSyncHistoryRequestDto,
  ): Promise<SyncHistoryResponseDto> {
    this.logger.log(
      `同期履歴取得: page=${query.page || 1}, limit=${query.limit || 20}`,
    );

    const result = await this.getSyncHistoryUseCase.execute({
      institutionId: query.institutionId,
      status: query.status,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit,
      page: query.page,
    });

    // ドメインエンティティをDTOに変換
    const data: SyncHistoryDto[] = result.histories.map((history) => ({
      id: history.id,
      institutionId: history.institutionId,
      institutionName: history.institutionName,
      institutionType: history.institutionType,
      status: history.status,
      startedAt: history.startedAt.toISOString(),
      completedAt: history.completedAt
        ? history.completedAt.toISOString()
        : null,
      totalFetched: history.totalFetched,
      newRecords: history.newRecords,
      duplicateRecords: history.duplicateRecords,
      errorMessage: history.errorMessage,
    }));

    return {
      success: true,
      data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * 実行中の同期をキャンセル
   *
   * PUT /api/sync/cancel/:id
   *
   * @param id - 同期履歴ID
   * @returns キャンセル結果
   */
  @Put('cancel/:id')
  @HttpCode(HttpStatus.OK)
  async cancelSync(@Param('id') id: string): Promise<CancelSyncResponseDto> {
    this.logger.log(`同期キャンセル: ${id}`);

    const result = await this.cancelSyncUseCase.execute(id);

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * 同期スケジュール設定を取得
   *
   * GET /api/sync/schedule
   *
   * @returns スケジュール設定
   */
  @Get('schedule')
  getSyncSchedule(): SyncScheduleResponseDto {
    this.logger.log('同期スケジュール設定取得');

    // TODO: スケジュール管理機能の実装。詳細は未実装機能リストを参照。
    // 【参照】: docs/detailed-design/FR-006_auto-fetch-transactions/未実装機能リスト.md
    // 【実装方針】: ScheduledSyncJob.getSchedule()から実際の設定を取得
    // 【依存】: ScheduledSyncJobの動的スケジュール更新機能
    // 現在はモックデータを返す
    return {
      success: true,
      data: {
        enabled: true,
        cronExpression: '0 4 * * *',
        timezone: 'Asia/Tokyo',
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }

  /**
   * 同期スケジュール設定を更新
   *
   * PUT /api/sync/schedule
   *
   * @param dto - スケジュール設定
   * @returns 更新されたスケジュール設定
   */
  @Put('schedule')
  @HttpCode(HttpStatus.OK)
  updateSyncSchedule(
    @Body() dto: UpdateSyncScheduleRequestDto,
  ): SyncScheduleResponseDto {
    this.logger.log('同期スケジュール設定更新');

    // TODO: スケジュール管理機能の実装。詳細は未実装機能リストを参照。
    // 【参照】: docs/detailed-design/FR-006_auto-fetch-transactions/未実装機能リスト.md
    // 【実装方針】: ScheduledSyncJob.updateSchedule()を呼び出して実際の設定を更新
    // 【依存】: ScheduledSyncJobの動的スケジュール更新機能
    // 現在はモックレスポンスを返す
    return {
      success: true,
      data: {
        enabled: dto.enabled,
        cronExpression: dto.cronExpression,
        timezone: dto.timezone || 'Asia/Tokyo',
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }
}
