import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * アラート解決リクエストDTO
 * PATCH /api/alerts/:id/resolve で使用
 */
export class ResolveAlertRequestDto {
  @ApiProperty({
    description: '解決者',
    example: 'user-001',
  })
  @IsNotEmpty({ message: 'resolvedByは必須です' })
  @IsString({ message: 'resolvedByは文字列である必要があります' })
  resolvedBy!: string;

  @ApiProperty({
    description: '解決メモ',
    example: '手動で照合しました',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'resolutionNoteは文字列である必要があります' })
  @MaxLength(500, {
    message: 'resolutionNoteは500文字以内である必要があります',
  })
  resolutionNote?: string;
}
