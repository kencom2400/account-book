import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class ConnectSecuritiesAccountDto {
  @IsString()
  @IsNotEmpty()
  securitiesCompanyName!: string;

  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @IsEnum(['general', 'specific', 'nisa', 'tsumitate-nisa', 'isa'])
  @IsNotEmpty()
  accountType!: 'general' | 'specific' | 'nisa' | 'tsumitate-nisa' | 'isa';

  @IsString()
  @IsNotEmpty()
  loginId!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsOptional()
  tradingPassword?: string;
}
