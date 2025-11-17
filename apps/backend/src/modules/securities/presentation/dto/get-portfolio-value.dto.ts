import { IsString, IsNotEmpty } from 'class-validator';

export class GetPortfolioValueDto {
  @IsString()
  @IsNotEmpty()
  accountId!: string;
}
