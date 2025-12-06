import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EventCategory } from '../../domain/enums/event-category.enum';

/**
 * UpdateEventRequestDto
 * イベント更新のリクエストDTO
 */
export class UpdateEventRequestDto {
  @ApiPropertyOptional({
    description: 'イベント日付（ISO 8601形式: YYYY-MM-DD）',
    example: '2025-04-01',
  })
  @IsOptional()
  @IsDateString({}, { message: '日付は有効な日付形式である必要があります' })
  date?: string;

  @ApiPropertyOptional({
    description: 'タイトル（1-100文字）',
    example: '入学式',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'タイトルは1文字以上である必要があります' })
  @MaxLength(100, { message: 'タイトルは100文字以下である必要があります' })
  title?: string;

  @ApiPropertyOptional({
    description: '説明（最大1000文字）',
    example: '長男の小学校入学式',
    maxLength: 1000,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: '説明は1000文字以下である必要があります' })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'イベントカテゴリ',
    enum: EventCategory,
    example: EventCategory.EDUCATION,
  })
  @IsOptional()
  @IsEnum(EventCategory, { message: 'カテゴリは有効な値である必要があります' })
  category?: EventCategory;

  @ApiPropertyOptional({
    description: 'タグ（文字列配列）',
    example: ['学校', '入学'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
