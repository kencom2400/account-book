import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * サブカテゴリ更新リクエストDTO
 * FR-009: 詳細費目分類機能
 */
export class UpdateSubcategoryRequestDto {
  @ApiProperty({
    description: 'サブカテゴリID',
    example: 'food_cafe',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  subcategoryId!: string;
}
