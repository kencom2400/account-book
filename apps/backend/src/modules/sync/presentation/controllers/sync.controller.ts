import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Param,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SyncTransactionsUseCase } from '../../application/use-cases/sync-transactions.use-case';
import { ScheduledSyncJob } from '../../application/jobs/scheduled-sync.job';
import type { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { Inject } from '@nestjs/common';
import { SYNC_HISTORY_REPOSITORY } from '../../sync.tokens';
import { SyncTransactionsDto, GetSyncHistoryDto } from '../dto/sync.dto';

/**
 * 同期コントローラー
 */
@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);
  private static readonly DEFAULT_HISTORY_LIMIT = 50;

  constructor(
    private readonly syncTransactionsUseCase: SyncTransactionsUseCase,
    private readonly scheduledSyncJob: ScheduledSyncJob,
    @Inject(SYNC_HISTORY_REPOSITORY)
    private readonly syncHistoryRepository: ISyncHistoryRepository,
  ) {}

  /**
   * 手動で同期を実行
   * POST /sync
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async syncTransactions(@Body() dto: SyncTransactionsDto): Promise<{
    success: boolean;
    data: {
      syncId: string;
      status: string;
      successCount: number;
      failureCount: number;
      newTransactionsCount: number;
      startedAt: Date;
      completedAt: Date | null;
    };
  }> {
    this.logger.log('Manual sync requested');

    const result = await this.syncTransactionsUseCase.execute({
      forceFullSync: dto.forceFullSync,
    });

    return {
      success: true,
      data: {
        syncId: result.syncHistory.id,
        status: result.syncHistory.status,
        successCount: result.successCount,
        failureCount: result.failureCount,
        newTransactionsCount: result.newTransactionsCount,
        startedAt: result.syncHistory.startedAt,
        completedAt: result.syncHistory.completedAt,
      },
    };
  }

  /**
   * 同期ステータスを取得
   * GET /sync/status
   */
  @Get('status')
  async getSyncStatus(): Promise<{
    success: boolean;
    data: {
      isRunning: boolean;
      latestSync: {
        syncId: string;
        status: string;
        startedAt: Date;
        completedAt: Date | null;
        successCount: number;
        failureCount: number;
        newTransactionsCount: number;
      } | null;
    };
  }> {
    const isRunning = this.scheduledSyncJob.isSyncRunning();
    const latestSync = await this.syncHistoryRepository.findLatest();

    return {
      success: true,
      data: {
        isRunning,
        latestSync: latestSync
          ? {
              syncId: latestSync.id,
              status: latestSync.status,
              startedAt: latestSync.startedAt,
              completedAt: latestSync.completedAt,
              successCount: latestSync.successCount,
              failureCount: latestSync.failureCount,
              newTransactionsCount: latestSync.newTransactionsCount,
            }
          : null,
      },
    };
  }

  /**
   * 同期履歴一覧を取得
   * GET /sync/history
   */
  @Get('history')
  async getSyncHistory(@Query() query: GetSyncHistoryDto): Promise<{
    success: boolean;
    data: Array<{
      syncId: string;
      status: string;
      startedAt: Date;
      completedAt: Date | null;
      totalInstitutions: number;
      successCount: number;
      failureCount: number;
      newTransactionsCount: number;
      errorMessage: string | null;
    }>;
  }> {
    let histories;

    if (query.startDate && query.endDate) {
      histories = await this.syncHistoryRepository.findByDateRange(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    } else {
      histories = await this.syncHistoryRepository.findAll(
        SyncController.DEFAULT_HISTORY_LIMIT,
      );
    }

    return {
      success: true,
      data: histories.map((history) => ({
        syncId: history.id,
        status: history.status,
        startedAt: history.startedAt,
        completedAt: history.completedAt,
        totalInstitutions: history.totalInstitutions,
        successCount: history.successCount,
        failureCount: history.failureCount,
        newTransactionsCount: history.newTransactionsCount,
        errorMessage: history.errorMessage,
      })),
    };
  }

  /**
   * 特定の同期履歴を取得
   * GET /sync/history/:id
   */
  @Get('history/:id')
  async getSyncHistoryById(@Param('id') id: string): Promise<{
    success: boolean;
    data: {
      syncId: string;
      status: string;
      startedAt: Date;
      completedAt: Date | null;
      totalInstitutions: number;
      successCount: number;
      failureCount: number;
      newTransactionsCount: number;
      errorMessage: string | null;
      errorDetails: Record<string, unknown> | null;
    };
  }> {
    const history = await this.syncHistoryRepository.findById(id);

    if (!history) {
      throw new NotFoundException('Sync history not found');
    }

    return {
      success: true,
      data: {
        syncId: history.id,
        status: history.status,
        startedAt: history.startedAt,
        completedAt: history.completedAt,
        totalInstitutions: history.totalInstitutions,
        successCount: history.successCount,
        failureCount: history.failureCount,
        newTransactionsCount: history.newTransactionsCount,
        errorMessage: history.errorMessage,
        errorDetails: history.errorDetails,
      },
    };
  }
}
