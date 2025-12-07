import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetSyncSettingsUseCase } from '../../application/use-cases/get-sync-settings.use-case';
import { UpdateSyncSettingsUseCase } from '../../application/use-cases/update-sync-settings.use-case';
import { GetInstitutionSyncSettingsUseCase } from '../../application/use-cases/get-institution-sync-settings.use-case';
import { GetAllInstitutionSyncSettingsUseCase } from '../../application/use-cases/get-all-institution-sync-settings.use-case';
import { UpdateInstitutionSyncSettingsUseCase } from '../../application/use-cases/update-institution-sync-settings.use-case';
import {
  SyncSettingsDataDto,
  UpdateSyncSettingsRequestDto,
  InstitutionSyncSettingsResponseDto,
  UpdateInstitutionSyncSettingsRequestDto,
  SyncSettingsSuccessResponseDto,
} from '../dto/sync-settings.dto';
import { SyncInterval } from '../../domain/value-objects/sync-interval.vo';
import { SyncIntervalType } from '../../domain/enums/sync-interval-type.enum';
import { TimeUnit } from '../../domain/enums/time-unit.enum';
import { InstitutionSyncSettings } from '../../domain/entities/institution-sync-settings.entity';

/**
 * 同期設定コントローラー
 *
 * @description
 * データ同期間隔設定機能のAPIエンドポイントを提供します。
 * FR-030: データ同期間隔の設定
 *
 * @controller
 * @layer Presentation
 */
@ApiTags('同期設定')
@ApiBearerAuth()
@Controller('sync-settings')
export class SyncSettingsController {
  private readonly logger = new Logger(SyncSettingsController.name);

  constructor(
    private readonly getSyncSettingsUseCase: GetSyncSettingsUseCase,
    private readonly updateSyncSettingsUseCase: UpdateSyncSettingsUseCase,
    private readonly getInstitutionSyncSettingsUseCase: GetInstitutionSyncSettingsUseCase,
    private readonly getAllInstitutionSyncSettingsUseCase: GetAllInstitutionSyncSettingsUseCase,
    private readonly updateInstitutionSyncSettingsUseCase: UpdateInstitutionSyncSettingsUseCase,
  ) {}

  /**
   * 全体設定を取得
   *
   * GET /api/sync-settings
   */
  @Get()
  @ApiOperation({ summary: '全体設定を取得' })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: SyncSettingsDataDto,
  })
  @ApiResponse({ status: 401, description: '認証エラー' })
  @ApiResponse({ status: 500, description: 'サーバーエラー' })
  async getSyncSettings(): Promise<
    SyncSettingsSuccessResponseDto<SyncSettingsDataDto>
  > {
    this.logger.log('全体設定取得リクエスト');

    try {
      const settings = await this.getSyncSettingsUseCase.execute();

      const response: SyncSettingsSuccessResponseDto<SyncSettingsDataDto> = {
        success: true,
        data: {
          defaultInterval: this.toSyncIntervalDto(settings.defaultInterval),
          wifiOnly: settings.wifiOnly,
          batterySavingMode: settings.batterySavingMode,
          autoRetry: settings.autoRetry,
          maxRetryCount: settings.maxRetryCount,
          nightModeSuspend: settings.nightModeSuspend,
          nightModeStart: settings.nightModeStart,
          nightModeEnd: settings.nightModeEnd,
        },
      };

      return response;
    } catch (error) {
      this.logger.error('全体設定取得エラー', error);
      throw error;
    }
  }

  /**
   * 全体設定を更新
   *
   * PATCH /api/sync-settings
   */
  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '全体設定を更新（部分更新）' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: SyncSettingsDataDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 401, description: '認証エラー' })
  @ApiResponse({ status: 500, description: 'サーバーエラー' })
  async updateSyncSettings(
    @Body() dto: UpdateSyncSettingsRequestDto,
  ): Promise<SyncSettingsSuccessResponseDto<SyncSettingsDataDto>> {
    this.logger.log('全体設定更新リクエスト');

    try {
      // DTOをUseCaseのDTOに変換
      const useCaseDto = {
        defaultInterval: dto.defaultInterval
          ? {
              type: dto.defaultInterval.type,
              value: dto.defaultInterval.value,
              unit: dto.defaultInterval.unit,
              customSchedule: dto.defaultInterval.customSchedule,
            }
          : undefined,
        wifiOnly: dto.wifiOnly,
        batterySavingMode: dto.batterySavingMode,
        autoRetry: dto.autoRetry,
        maxRetryCount: dto.maxRetryCount,
        nightModeSuspend: dto.nightModeSuspend,
        nightModeStart: dto.nightModeStart,
        nightModeEnd: dto.nightModeEnd,
      };

      const settings = await this.updateSyncSettingsUseCase.execute(useCaseDto);

      const response: SyncSettingsSuccessResponseDto<SyncSettingsDataDto> = {
        success: true,
        data: {
          defaultInterval: this.toSyncIntervalDto(settings.defaultInterval),
          wifiOnly: settings.wifiOnly,
          batterySavingMode: settings.batterySavingMode,
          autoRetry: settings.autoRetry,
          maxRetryCount: settings.maxRetryCount,
          nightModeSuspend: settings.nightModeSuspend,
          nightModeStart: settings.nightModeStart,
          nightModeEnd: settings.nightModeEnd,
        },
      };

      return response;
    } catch (error) {
      this.logger.error('全体設定更新エラー', error);
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * 全金融機関の設定を取得
   *
   * GET /api/sync-settings/institutions
   */
  @Get('institutions')
  @ApiOperation({ summary: '全金融機関の設定を取得' })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: [InstitutionSyncSettingsResponseDto],
  })
  @ApiResponse({ status: 401, description: '認証エラー' })
  @ApiResponse({ status: 500, description: 'サーバーエラー' })
  async getAllInstitutionSyncSettings(): Promise<
    SyncSettingsSuccessResponseDto<InstitutionSyncSettingsResponseDto[]>
  > {
    this.logger.log('全金融機関設定取得リクエスト');

    try {
      const settings =
        await this.getAllInstitutionSyncSettingsUseCase.execute();

      const response: SyncSettingsSuccessResponseDto<
        InstitutionSyncSettingsResponseDto[]
      > = {
        success: true,
        data: settings.map((s) => this.toInstitutionSyncSettingsDto(s)),
      };

      return response;
    } catch (error) {
      this.logger.error('全金融機関設定取得エラー', error);
      throw error;
    }
  }

  /**
   * 特定金融機関の設定を取得
   *
   * GET /api/sync-settings/institutions/:id
   */
  @Get('institutions/:id')
  @ApiOperation({ summary: '特定金融機関の設定を取得' })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: InstitutionSyncSettingsResponseDto,
  })
  @ApiResponse({ status: 401, description: '認証エラー' })
  @ApiResponse({ status: 404, description: '金融機関が見つからない' })
  @ApiResponse({ status: 500, description: 'サーバーエラー' })
  async getInstitutionSyncSettings(
    @Param('id') institutionId: string,
  ): Promise<
    SyncSettingsSuccessResponseDto<InstitutionSyncSettingsResponseDto>
  > {
    this.logger.log(
      `金融機関設定取得リクエスト: institutionId=${institutionId}`,
    );

    try {
      const settings =
        await this.getInstitutionSyncSettingsUseCase.execute(institutionId);

      const response: SyncSettingsSuccessResponseDto<InstitutionSyncSettingsResponseDto> =
        {
          success: true,
          data: this.toInstitutionSyncSettingsDto(settings),
        };

      return response;
    } catch (error) {
      this.logger.error(
        `金融機関設定取得エラー: institutionId=${institutionId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 特定金融機関の設定を更新
   *
   * PATCH /api/sync-settings/institutions/:id
   */
  @Patch('institutions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '特定金融機関の設定を更新（部分更新）' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: InstitutionSyncSettingsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  @ApiResponse({ status: 401, description: '認証エラー' })
  @ApiResponse({ status: 404, description: '金融機関が見つからない' })
  @ApiResponse({ status: 500, description: 'サーバーエラー' })
  async updateInstitutionSyncSettings(
    @Param('id') institutionId: string,
    @Body() dto: UpdateInstitutionSyncSettingsRequestDto,
  ): Promise<
    SyncSettingsSuccessResponseDto<InstitutionSyncSettingsResponseDto>
  > {
    this.logger.log(
      `金融機関設定更新リクエスト: institutionId=${institutionId}`,
    );

    try {
      // DTOをUseCaseのDTOに変換
      const useCaseDto = {
        interval: dto.interval
          ? {
              type: dto.interval.type,
              value: dto.interval.value,
              unit: dto.interval.unit,
              customSchedule: dto.interval.customSchedule,
            }
          : undefined,
        enabled: dto.enabled,
      };

      const settings = await this.updateInstitutionSyncSettingsUseCase.execute(
        institutionId,
        useCaseDto,
      );

      const response: SyncSettingsSuccessResponseDto<InstitutionSyncSettingsResponseDto> =
        {
          success: true,
          data: this.toInstitutionSyncSettingsDto(settings),
        };

      return response;
    } catch (error) {
      this.logger.error(
        `金融機関設定更新エラー: institutionId=${institutionId}`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * SyncIntervalをDTOに変換
   */
  private toSyncIntervalDto(interval: SyncInterval): {
    type: SyncIntervalType;
    value?: number;
    unit?: TimeUnit;
    customSchedule?: string;
  } {
    return {
      type: interval.type,
      value: interval.value,
      unit: interval.unit,
      customSchedule: interval.customSchedule,
    };
  }

  /**
   * InstitutionSyncSettingsをDTOに変換
   */
  private toInstitutionSyncSettingsDto(
    settings: InstitutionSyncSettings,
  ): InstitutionSyncSettingsResponseDto {
    return {
      id: settings.id,
      institutionId: settings.institutionId,
      interval: this.toSyncIntervalDto(settings.interval),
      enabled: settings.enabled,
      lastSyncedAt: settings.lastSyncedAt?.toISOString() ?? null,
      nextSyncAt: settings.nextSyncAt?.toISOString() ?? null,
      syncStatus: settings.syncStatus,
      errorCount: settings.errorCount,
      lastError: settings.lastError,
    };
  }
}
