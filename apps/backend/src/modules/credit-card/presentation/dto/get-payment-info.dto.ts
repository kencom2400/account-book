import { IsOptional, IsString } from 'class-validator';

export class GetPaymentInfoDto {
  @IsOptional()
  @IsString()
  billingMonth?: string; // YYYY-MM形式

  @IsOptional()
  @IsString()
  forceRefresh?: string; // 'true' or 'false'
}

