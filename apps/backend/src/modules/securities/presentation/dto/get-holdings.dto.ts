import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class GetHoldingsDto {
  @IsString()
  @IsNotEmpty()
  accountId!: string;

  @IsBoolean()
  @IsOptional()
  forceRefresh?: boolean;
}
