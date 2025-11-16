import { IsOptional, IsDateString, IsString } from 'class-validator';

export class GetTransactionsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  forceRefresh?: string; // 'true' or 'false'
}

