import { IsBoolean, IsOptional, IsDateString } from 'class-validator';

/**
 * 同期実行DTO
 */
export class SyncTransactionsDto {
  @IsOptional()
  @IsBoolean()
  forceFullSync?: boolean;
}

/**
 * 同期履歴取得DTO
 */
export class GetSyncHistoryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
