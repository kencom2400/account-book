import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  Max,
  Matches,
  ValidateIf,
} from 'class-validator';
import { SyncIntervalType } from '../../domain/enums/sync-interval-type.enum';
import { TimeUnit } from '../../domain/enums/time-unit.enum';
import { InstitutionSyncStatus } from '../../domain/enums/institution-sync-status.enum';

/**
 * 同期間隔DTO
 */
export class SyncIntervalDto {
  @ApiProperty({
    description: '同期間隔タイプ',
    enum: SyncIntervalType,
    example: SyncIntervalType.STANDARD,
  })
  @IsEnum(SyncIntervalType)
  type!: SyncIntervalType;

  @ApiPropertyOptional({
    description: 'カスタムの場合の値',
    example: 30,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(43200) // 30日 = 30 * 24 * 60分
  @ValidateIf((o) => o.type === SyncIntervalType.CUSTOM)
  value?: number;

  @ApiPropertyOptional({
    description: 'カスタムの場合の単位',
    enum: TimeUnit,
    example: TimeUnit.HOURS,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(TimeUnit)
  @ValidateIf((o) => o.type === SyncIntervalType.CUSTOM)
  unit?: TimeUnit;

  @ApiPropertyOptional({
    description: 'Cron式',
    example: '0 */6 * * *',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  customSchedule?: string;
}

/**
 * 同期設定レスポンスDTO
 */
export class SyncSettingsDataDto {
  @ApiProperty({
    description: 'デフォルト同期間隔',
    type: SyncIntervalDto,
  })
  defaultInterval!: SyncIntervalDto;

  @ApiProperty({
    description: 'Wi-Fi接続時のみ自動同期',
    example: false,
  })
  wifiOnly!: boolean;

  @ApiProperty({
    description: 'バッテリー節約モード時は同期を控える',
    example: false,
  })
  batterySavingMode!: boolean;

  @ApiProperty({
    description: 'エラー時は自動リトライ',
    example: true,
  })
  autoRetry!: boolean;

  @ApiProperty({
    description: '最大リトライ回数',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  maxRetryCount!: number;

  @ApiProperty({
    description: '夜間モード有効化',
    example: false,
  })
  nightModeSuspend!: boolean;

  @ApiProperty({
    description: '夜間モード開始時刻（HH:mm形式）',
    example: '22:00',
  })
  nightModeStart!: string;

  @ApiProperty({
    description: '夜間モード終了時刻（HH:mm形式）',
    example: '06:00',
  })
  nightModeEnd!: string;
}

/**
 * 同期設定更新リクエストDTO
 */
export class UpdateSyncSettingsRequestDto {
  @ApiPropertyOptional({
    description: 'デフォルト同期間隔',
    type: SyncIntervalDto,
  })
  @IsOptional()
  defaultInterval?: SyncIntervalDto;

  @ApiPropertyOptional({
    description: 'Wi-Fi接続時のみ自動同期',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  wifiOnly?: boolean;

  @ApiPropertyOptional({
    description: 'バッテリー節約モード時は同期を控える',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  batterySavingMode?: boolean;

  @ApiPropertyOptional({
    description: 'エラー時は自動リトライ',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  autoRetry?: boolean;

  @ApiPropertyOptional({
    description: '最大リトライ回数',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetryCount?: number;

  @ApiPropertyOptional({
    description: '夜間モード有効化',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  nightModeSuspend?: boolean;

  @ApiPropertyOptional({
    description: '夜間モード開始時刻（HH:mm形式）',
    example: '22:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'nightModeStart must be in HH:mm format',
  })
  @ValidateIf((o) => o.nightModeSuspend === true)
  nightModeStart?: string;

  @ApiPropertyOptional({
    description: '夜間モード終了時刻（HH:mm形式）',
    example: '06:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'nightModeEnd must be in HH:mm format',
  })
  @ValidateIf((o) => o.nightModeSuspend === true)
  nightModeEnd?: string;
}

/**
 * 金融機関同期設定レスポンスDTO
 */
export class InstitutionSyncSettingsResponseDto {
  @ApiProperty({
    description: '設定ID',
    example: 'inst-sync-001',
  })
  id!: string;

  @ApiProperty({
    description: '金融機関ID',
    example: 'inst_001',
  })
  institutionId!: string;

  @ApiProperty({
    description: '同期間隔',
    type: SyncIntervalDto,
  })
  interval!: SyncIntervalDto;

  @ApiProperty({
    description: '有効/無効',
    example: true,
  })
  enabled!: boolean;

  @ApiProperty({
    description: '最終同期日時',
    example: '2025-01-15T10:30:00.000Z',
    nullable: true,
  })
  lastSyncedAt!: string | null;

  @ApiProperty({
    description: '次回同期予定時刻',
    example: '2025-01-15T16:30:00.000Z',
    nullable: true,
  })
  nextSyncAt!: string | null;

  @ApiProperty({
    description: '同期ステータス',
    enum: InstitutionSyncStatus,
    example: InstitutionSyncStatus.IDLE,
  })
  syncStatus!: InstitutionSyncStatus;

  @ApiProperty({
    description: 'エラー回数',
    example: 0,
  })
  errorCount!: number;

  @ApiProperty({
    description: '最終エラーメッセージ',
    example: null,
    nullable: true,
  })
  lastError!: string | null;
}

/**
 * 金融機関同期設定更新リクエストDTO
 */
export class UpdateInstitutionSyncSettingsRequestDto {
  @ApiPropertyOptional({
    description: '同期間隔',
    type: SyncIntervalDto,
  })
  @IsOptional()
  interval?: SyncIntervalDto;

  @ApiPropertyOptional({
    description: '有効/無効',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

/**
 * 共通レスポンスDTO
 */
export interface SyncSettingsSuccessResponseDto<T> {
  success: true;
  data: T;
}

export interface SyncSettingsErrorResponseDto {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type SyncSettingsResponseDtoType<T> =
  | SyncSettingsSuccessResponseDto<T>
  | SyncSettingsErrorResponseDto;
