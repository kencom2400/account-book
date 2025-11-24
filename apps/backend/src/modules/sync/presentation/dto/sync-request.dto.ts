import {
  IsBoolean,
  IsOptional,
  IsArray,
  IsUUID,
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SyncStatus } from '../../domain/enums/sync-status.enum';

/**
 * 手動同期開始リクエストDTO
 *
 * @description
 * POST /api/sync/start のリクエストボディ
 */
export class SyncAllTransactionsRequestDto {
  /**
   * 全件同期を強制（差分同期をスキップ）
   * @default false
   */
  @IsOptional()
  @IsBoolean()
  forceFullSync?: boolean;

  /**
   * 同期対象の金融機関IDリスト（未指定の場合は全金融機関）
   */
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  institutionIds?: string[];
}

/**
 * 同期履歴取得リクエストDTO
 *
 * @description
 * GET /api/sync/history のクエリパラメータ
 */
export class GetSyncHistoryRequestDto {
  /**
   * 金融機関IDでフィルタ
   */
  @IsOptional()
  @IsUUID('4')
  institutionId?: string;

  /**
   * ステータスでフィルタ
   */
  @IsOptional()
  @IsEnum(SyncStatus)
  status?: SyncStatus;

  /**
   * 開始日（ISO8601形式）
   */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /**
   * 終了日（ISO8601形式）
   */
  @IsOptional()
  @IsDateString()
  endDate?: string;

  /**
   * 取得件数（最大100）
   * @default 20
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  /**
   * ページ番号
   * @default 1
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;
}

/**
 * 同期スケジュール更新リクエストDTO
 *
 * @description
 * PUT /api/sync/schedule のリクエストボディ
 */
export class UpdateSyncScheduleRequestDto {
  /**
   * スケジュール有効/無効
   */
  @IsBoolean()
  enabled!: boolean;

  /**
   * cron式（例: "0 0 4 * * *" = 毎日午前4時）
   * フォーマット: 秒 分 時 日 月 曜日
   */
  @IsString()
  @Matches(
    /^(\*|([0-5]?\d)) (\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([0-2]?\d|3[01])) (\*|([0]?\d|1[0-2])) (\*|([0-6]))$/,
    {
      message:
        'Invalid cron expression. Expected format: "second minute hour day month weekday" (6 fields)',
    },
  )
  cronExpression!: string;

  /**
   * タイムゾーン（IANA timezone）
   * @default "Asia/Tokyo"
   */
  @IsOptional()
  @IsString()
  timezone?: string;
}
