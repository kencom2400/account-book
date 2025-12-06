import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * LinkTransactionRequestDto
 * 取引とイベントの紐付けリクエストDTO
 */
export class LinkTransactionRequestDto {
  @ApiProperty({
    description: '取引ID',
    example: 'txn_123',
  })
  @IsString()
  @IsNotEmpty({ message: 'transactionIdは必須です' })
  transactionId!: string;
}
