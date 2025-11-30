import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Matches } from 'class-validator';

/**
 * クレジットカード照合リクエストDTO
 */
export class ReconcileCreditCardRequestDto {
  @ApiProperty({
    description: 'クレジットカードID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  cardId!: string;

  @ApiProperty({
    description: '請求月（YYYY-MM形式）',
    example: '2025-01',
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'billingMonthはYYYY-MM形式である必要があります',
  })
  billingMonth!: string;
}
