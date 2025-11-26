import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassificationReason } from '../../domain/enums/classification-reason.enum';

/**
 * サブカテゴリ詳細情報
 */
export interface SubcategoryDto {
  id: string;
  categoryType: string;
  name: string;
  parentId: string | null;
  displayOrder: number;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  isActive: boolean;
}

/**
 * サブカテゴリ自動分類レスポンスDTO
 * FR-009: 詳細費目分類機能
 */
export class ClassificationResponseDto {
  @ApiProperty({
    description: '成功フラグ',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: '分類結果',
  })
  data!: {
    subcategory: SubcategoryDto;
    confidence: number;
    reason: ClassificationReason;
    merchantId?: string | null;
    merchantName?: string | null;
  };

  @ApiPropertyOptional({
    description: 'エラーメッセージ（失敗時のみ）',
  })
  error?: string;
}
