import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '@account-book/types';

/**
 * サブカテゴリレスポンスDTO
 * FR-009: 詳細費目分類機能
 */
export interface SubcategoryResponseDto {
  id: string;
  categoryType: CategoryType;
  name: string;
  parentId: string | null;
  displayOrder: number;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: SubcategoryResponseDto[];
}

/**
 * サブカテゴリ一覧レスポンスDTO
 */
export class SubcategoryListResponseDto {
  @ApiProperty({
    description: '成功フラグ',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'サブカテゴリ一覧',
  })
  data!: SubcategoryResponseDto[];

  @ApiPropertyOptional({
    description: '合計件数',
  })
  total?: number;
}
