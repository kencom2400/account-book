import { IsBoolean, IsOptional } from 'class-validator';

export class GetHoldingsDto {
  @IsBoolean()
  @IsOptional()
  forceRefresh?: boolean;
}
