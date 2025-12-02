import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsISO8601,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '@account-book/types';

/**
 * サブカテゴリ自動分類リクエストDTO
 * FR-009: 詳細費目分類機能
 */
export class ClassificationRequestDto {
  @ApiProperty({
    description: '取引ID',
    example: 'tx_1234567890',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  transactionId!: string;

  @ApiProperty({
    description: '取引説明',
    example: 'スターバックス 表参道店',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;

  @ApiProperty({
    description: '金額',
    example: -450,
  })
  @IsNumber()
  amount!: number;

  @ApiProperty({
    description: '主カテゴリ',
    enum: CategoryType,
    example: CategoryType.EXPENSE,
  })
  @IsEnum(CategoryType)
  mainCategory!: CategoryType;

  @ApiPropertyOptional({
    description: '取引日時（ISO 8601形式）',
    example: '2025-11-24T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  transactionDate?: string;
}
