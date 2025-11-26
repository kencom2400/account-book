import { ApiProperty } from '@nestjs/swagger';
import { ClassificationReason } from '../../domain/enums/classification-reason.enum';

/**
 * サブカテゴリ更新レスポンスDTO
 * FR-009: 詳細費目分類機能
 */
export class UpdateSubcategoryResponseDto {
  @ApiProperty({
    description: '成功フラグ',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: '更新結果',
  })
  transaction!: {
    id: string;
    subcategoryId: string;
    subcategoryName: string;
    classificationConfidence: number;
    classificationReason: ClassificationReason;
    confirmedAt: string;
  };
}
