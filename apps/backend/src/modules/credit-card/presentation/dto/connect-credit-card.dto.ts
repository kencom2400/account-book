import { IsString, IsNumber, IsDateString, Min, Max } from 'class-validator';

export class ConnectCreditCardDto {
  @IsString()
  cardName!: string;

  @IsString()
  cardNumber!: string; // 下4桁のみ

  @IsString()
  cardHolderName!: string;

  @IsDateString()
  expiryDate!: string; // YYYY-MM-DD形式

  @IsString()
  username!: string;

  @IsString()
  password!: string;

  @IsString()
  issuer!: string;

  @IsNumber()
  @Min(1)
  @Max(31)
  paymentDay!: number;

  @IsNumber()
  @Min(1)
  @Max(31)
  closingDay!: number;
}
