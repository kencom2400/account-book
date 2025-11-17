import { IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class GetSecurityTransactionsDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  forceRefresh?: boolean;
}
