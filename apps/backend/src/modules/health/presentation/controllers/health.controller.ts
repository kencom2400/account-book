import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { CheckConnectionStatusUseCase } from '../../application/use-cases/check-connection-status.use-case';
import type { ConnectionStatusResult } from '../../domain/types/connection-status-result.type';
import {
  GetConnectionHistoryUseCase,
  type ConnectionHistoryResult,
} from '../../application/use-cases/get-connection-history.use-case';
import {
  CheckConnectionRequestDto,
  CheckConnectionResponseDto,
  ConnectionStatusDto,
} from '../dto/check-connection.dto';
import {
  GetConnectionHistoryQueryDto,
  GetConnectionHistoryResponseDto,
  ConnectionHistoryDto,
} from '../dto/get-connection-history.dto';

// Application Services
import { InstitutionAggregationService } from '../../application/services/institution-aggregation.service';

/**
 * ヘルスチェックコントローラー
 * FR-004: バックグラウンド接続確認で使用
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly checkConnectionStatusUseCase: CheckConnectionStatusUseCase,
    private readonly getConnectionHistoryUseCase: GetConnectionHistoryUseCase,
    private readonly institutionAggregationService: InstitutionAggregationService,
  ) {}

  /**
   * GET /api/health/institutions
   * 全金融機関または特定の金融機関の接続状態をチェック
   */
  @Get('institutions')
  async checkInstitutionsHealth(
    @Query() query: CheckConnectionRequestDto,
  ): Promise<CheckConnectionResponseDto> {
    this.logger.log('接続状態チェック開始');

    // 登録されている金融機関を取得（InstitutionAggregationServiceを使用）
    const institutions =
      await this.institutionAggregationService.getAllInstitutions();

    if (institutions.length === 0) {
      return {
        results: [],
        totalCount: 0,
        successCount: 0,
        errorCount: 0,
        checkedAt: new Date().toISOString(),
      };
    }

    // 接続チェック実行
    // エラーハンドリングはHttpExceptionFilterが一元管理
    const results = await this.checkConnectionStatusUseCase.execute(
      { institutionId: query.institutionId },
      institutions,
    );

    const successCount = results.filter((r) => !r.errorMessage).length;
    const errorCount = results.length - successCount;

    return {
      results: results.map((r) => this.toConnectionStatusDto(r)),
      totalCount: results.length,
      successCount,
      errorCount,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * GET /api/health/institutions/:id
   * 特定の金融機関の接続履歴を取得
   */
  @Get('institutions/:id')
  async getInstitutionHistory(
    @Param('id') institutionId: string,
    @Query() query: GetConnectionHistoryQueryDto,
  ): Promise<GetConnectionHistoryResponseDto> {
    this.logger.log(`接続履歴取得: ${institutionId}`);

    // エラーハンドリングはHttpExceptionFilterが一元管理
    const histories = await this.getConnectionHistoryUseCase.execute({
      institutionId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit,
    });

    return {
      histories: histories.map((h) => this.toConnectionHistoryDto(h)),
      totalCount: histories.length,
    };
  }

  /**
   * GET /api/health/institutions/latest/all
   * 全金融機関の最新の接続状態を取得
   */
  @Get('institutions/latest/all')
  async getLatestStatuses(): Promise<GetConnectionHistoryResponseDto> {
    this.logger.log('最新の接続状態を取得');

    // エラーハンドリングはHttpExceptionFilterが一元管理
    const histories =
      await this.getConnectionHistoryUseCase.getLatestStatuses();

    return {
      histories: histories.map((h) => this.toConnectionHistoryDto(h)),
      totalCount: histories.length,
    };
  }

  /**
   * ConnectionStatusResultをDTOに変換
   */
  private toConnectionStatusDto(
    result: ConnectionStatusResult,
  ): ConnectionStatusDto {
    return {
      institutionId: result.institutionId,
      institutionName: result.institutionName,
      institutionType: result.institutionType,
      status: result.status,
      checkedAt: result.checkedAt,
      responseTime: result.responseTime,
      errorMessage: result.errorMessage,
      errorCode: result.errorCode,
    };
  }

  /**
   * ConnectionHistoryResultをDTOに変換
   */
  private toConnectionHistoryDto(
    history: ConnectionHistoryResult,
  ): ConnectionHistoryDto {
    return {
      id: history.id,
      institutionId: history.institutionId,
      institutionName: history.institutionName,
      institutionType: history.institutionType,
      status: history.status,
      checkedAt: history.checkedAt,
      responseTime: history.responseTime,
      errorMessage: history.errorMessage,
      errorCode: history.errorCode,
    };
  }
}
