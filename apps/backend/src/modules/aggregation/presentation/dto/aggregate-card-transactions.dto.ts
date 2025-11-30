import { IsString, IsUUID, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * カード利用明細集計リクエストDTO
 */
export class AggregateCardTransactionsRequestDto {
  @ApiProperty({
    description: 'クレジットカードID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @IsUUID('4')
  cardId!: string;

  @ApiProperty({
    description: '集計開始月（YYYY-MM形式）',
    example: '2025-01',
    type: String,
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'startMonth must be in YYYY-MM format',
  })
  startMonth!: string;

  @ApiProperty({
    description: '集計終了月（YYYY-MM形式）',
    example: '2025-03',
    type: String,
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'endMonth must be in YYYY-MM format',
  })
  endMonth!: string;
}
