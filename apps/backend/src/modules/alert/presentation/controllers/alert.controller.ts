import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  NotFoundException,
  UnprocessableEntityException,
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateAlertUseCase } from '../../application/use-cases/create-alert.use-case';
import { GetAlertsUseCase } from '../../application/use-cases/get-alerts.use-case';
import { ResolveAlertUseCase } from '../../application/use-cases/resolve-alert.use-case';
import { MarkAlertAsReadUseCase } from '../../application/use-cases/mark-alert-as-read.use-case';
import type { AlertRepository } from '../../domain/repositories/alert.repository.interface';
import { Alert } from '../../domain/entities/alert.entity';
import {
  AlertResponseDto,
  AlertListResponseDto,
  AlertListItemDto,
} from '../dto/alert.dto';
import { CreateAlertRequestDto } from '../dto/create-alert.dto';
import { ResolveAlertRequestDto } from '../dto/resolve-alert.dto';
import {
  AlertNotFoundException,
  DuplicateAlertException,
  AlertAlreadyResolvedException,
  CriticalAlertDeletionException,
} from '../../domain/errors/alert.errors';
import { ALERT_REPOSITORY } from '../../alert.tokens';

/**
 * アラートコントローラー
 * 不一致時のアラート表示機能を提供
 */
@ApiTags('alerts')
@Controller('api/alerts')
export class AlertController {
  constructor(
    private readonly createAlertUseCase: CreateAlertUseCase,
    private readonly getAlertsUseCase: GetAlertsUseCase,
    private readonly resolveAlertUseCase: ResolveAlertUseCase,
    private readonly markAlertAsReadUseCase: MarkAlertAsReadUseCase,
    @Inject(ALERT_REPOSITORY)
    private readonly alertRepository: AlertRepository,
  ) {}

  /**
   * POST /api/alerts
   * アラートを生成（内部用）
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'アラートを生成（内部用）' })
  @ApiResponse({
    status: 201,
    description: 'アラート生成成功',
    type: AlertResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 404, description: '照合結果が見つからない' })
  @ApiResponse({ status: 422, description: '重複アラート生成エラー' })
  async createAlert(@Body() dto: CreateAlertRequestDto): Promise<{
    success: boolean;
    data: AlertResponseDto;
  }> {
    try {
      const alert = await this.createAlertUseCase.execute(dto.reconciliationId);

      return {
        success: true,
        data: this.toResponseDto(alert),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * GET /api/alerts
   * アラート一覧を取得
   */
  @Get()
  @ApiOperation({ summary: 'アラート一覧を取得' })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: AlertListResponseDto,
  })
  async getAlerts(
    @Query('level') level?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('cardId') cardId?: string,
    @Query('billingMonth') billingMonth?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    success: boolean;
    data: AlertListResponseDto;
  }> {
    const result = await this.getAlertsUseCase.execute({
      level,
      status,
      type,
      cardId,
      billingMonth,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    const unreadCount = await this.alertRepository.countUnread();

    return {
      success: true,
      data: {
        alerts: result.data.map((a) => this.toListItemDto(a)),
        total: result.total,
        unreadCount,
      },
    };
  }

  /**
   * GET /api/alerts/:id
   * アラート詳細を取得
   */
  @Get(':id')
  @ApiOperation({ summary: 'アラート詳細を取得' })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: AlertResponseDto,
  })
  @ApiResponse({ status: 404, description: 'アラートが見つからない' })
  async getAlert(@Param('id') id: string): Promise<{
    success: boolean;
    data: AlertResponseDto;
  }> {
    const alert = await this.alertRepository.findById(id);

    if (!alert) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        message: 'アラートが見つかりません',
        code: 'AL001',
        errors: [],
        timestamp: new Date().toISOString(),
        path: `/api/alerts/${id}`,
      });
    }

    return {
      success: true,
      data: this.toResponseDto(alert),
    };
  }

  /**
   * PATCH /api/alerts/:id/resolve
   * アラートを解決済みにする
   */
  @Patch(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'アラートを解決済みにする' })
  @ApiResponse({
    status: 200,
    description: '解決成功',
    type: AlertResponseDto,
  })
  @ApiResponse({ status: 404, description: 'アラートが見つからない' })
  @ApiResponse({ status: 422, description: '既に解決済みのアラート' })
  async resolveAlert(
    @Param('id') id: string,
    @Body() dto: ResolveAlertRequestDto,
  ): Promise<{
    success: boolean;
    data: AlertResponseDto;
  }> {
    try {
      const alert = await this.resolveAlertUseCase.execute(
        id,
        dto.resolvedBy,
        dto.resolutionNote,
      );

      return {
        success: true,
        data: this.toResponseDto(alert),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * PATCH /api/alerts/:id/read
   * アラートを既読にする
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'アラートを既読にする' })
  @ApiResponse({
    status: 200,
    description: '既読成功',
    type: AlertResponseDto,
  })
  @ApiResponse({ status: 404, description: 'アラートが見つからない' })
  async markAlertAsRead(@Param('id') id: string): Promise<{
    success: boolean;
    data: AlertResponseDto;
  }> {
    try {
      const alert = await this.markAlertAsReadUseCase.execute(id);

      return {
        success: true,
        data: this.toResponseDto(alert),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * DELETE /api/alerts/:id
   * アラートを削除
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'アラートを削除' })
  @ApiResponse({ status: 204, description: '削除成功' })
  @ApiResponse({ status: 404, description: 'アラートが見つからない' })
  @ApiResponse({ status: 422, description: 'CRITICALアラート削除不可' })
  async deleteAlert(@Param('id') id: string): Promise<void> {
    try {
      const alert = await this.alertRepository.findById(id);

      if (!alert) {
        throw new AlertNotFoundException(id);
      }

      await this.alertRepository.delete(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * エラーハンドリング
   */
  private handleError(error: unknown): never {
    if (error instanceof AlertNotFoundException) {
      throw new NotFoundException({
        success: false,
        statusCode: 404,
        message: error.message,
        code: 'AL001',
        errors: [],
        timestamp: new Date().toISOString(),
        path: '/api/alerts',
      });
    }

    if (error instanceof DuplicateAlertException) {
      throw new UnprocessableEntityException({
        success: false,
        statusCode: 422,
        message: error.message,
        code: 'AL002',
        errors: [],
        timestamp: new Date().toISOString(),
        path: '/api/alerts',
      });
    }

    if (error instanceof AlertAlreadyResolvedException) {
      throw new UnprocessableEntityException({
        success: false,
        statusCode: 422,
        message: error.message,
        code: 'AL003',
        errors: [],
        timestamp: new Date().toISOString(),
        path: '/api/alerts',
      });
    }

    if (error instanceof CriticalAlertDeletionException) {
      throw new UnprocessableEntityException({
        success: false,
        statusCode: 422,
        message: error.message,
        code: 'AL004',
        errors: [],
        timestamp: new Date().toISOString(),
        path: '/api/alerts',
      });
    }

    // その他のエラー
    throw error;
  }

  /**
   * AlertエンティティをResponseDTOに変換
   */
  private toResponseDto(alert: Alert): AlertResponseDto {
    return {
      id: alert.id,
      type: alert.type,
      level: alert.level,
      title: alert.title,
      message: alert.message,
      details: {
        cardId: alert.details.cardId,
        cardName: alert.details.cardName,
        billingMonth: alert.details.billingMonth,
        expectedAmount: alert.details.expectedAmount,
        actualAmount: alert.details.actualAmount,
        discrepancy: alert.details.discrepancy,
        paymentDate: alert.details.paymentDate?.toISOString() ?? null,
        daysElapsed: alert.details.daysElapsed,
        relatedTransactions: alert.details.relatedTransactions,
        reconciliationId: alert.details.reconciliationId,
      },
      status: alert.status,
      createdAt: alert.createdAt.toISOString(),
      resolvedAt: alert.resolvedAt?.toISOString() ?? null,
      resolvedBy: alert.resolvedBy,
      resolutionNote: alert.resolutionNote,
      actions: alert.actions.map((a) => ({
        id: a.id,
        label: a.label,
        action: a.action,
        isPrimary: a.isPrimary,
      })),
    };
  }

  /**
   * AlertエンティティをListItemDTOに変換
   */
  private toListItemDto(alert: Alert): AlertListItemDto {
    return {
      id: alert.id,
      type: alert.type,
      level: alert.level,
      title: alert.title,
      status: alert.status,
      createdAt: alert.createdAt.toISOString(),
    };
  }
}
