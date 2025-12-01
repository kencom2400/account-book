import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * アラート生成リクエストDTO
 * POST /api/alerts で使用
 */
export class CreateAlertRequestDto {
  @ApiProperty({
    description: '照合結果ID',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  @IsNotEmpty({ message: 'reconciliationIdは必須です' })
  @IsUUID('4', { message: 'reconciliationIdはUUID形式である必要があります' })
  reconciliationId!: string;
}
