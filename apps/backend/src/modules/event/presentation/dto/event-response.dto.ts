import { ApiProperty } from '@nestjs/swagger';
import { EventCategory } from '../../domain/enums/event-category.enum';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';

/**
 * TransactionDto
 * 関連取引情報のDTO
 */
export class TransactionDto {
  @ApiProperty({
    description: '取引ID',
    example: 'txn_001',
  })
  id!: string;

  @ApiProperty({
    description: '取引日付（ISO 8601形式）',
    example: '2025-04-01',
  })
  date!: string;

  @ApiProperty({
    description: '金額',
    example: 50000,
  })
  amount!: number;

  @ApiProperty({
    description: 'カテゴリタイプ',
    example: 'EXPENSE',
  })
  categoryType!: string;

  @ApiProperty({
    description: 'カテゴリID',
    example: 'cat_001',
  })
  categoryId!: string;

  @ApiProperty({
    description: 'カテゴリ名',
    example: '教育費',
  })
  categoryName!: string;

  @ApiProperty({
    description: '金融機関ID',
    example: 'inst_001',
  })
  institutionId!: string;

  @ApiProperty({
    description: '説明',
    example: '入学式関連費用',
  })
  description!: string;
}

/**
 * EventResponseDto
 * イベント詳細のレスポンスDTO
 */
export class EventResponseDto {
  @ApiProperty({
    description: 'イベントID',
    example: 'evt_001',
  })
  id!: string;

  @ApiProperty({
    description: 'イベント日付（ISO 8601形式）',
    example: '2025-04-01',
  })
  date!: string;

  @ApiProperty({
    description: 'タイトル',
    example: '入学式',
  })
  title!: string;

  @ApiProperty({
    description: '説明',
    example: '長男の小学校入学式',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'イベントカテゴリ',
    enum: EventCategory,
    example: EventCategory.EDUCATION,
  })
  category!: EventCategory;

  @ApiProperty({
    description: 'タグ',
    example: ['学校', '入学'],
    type: [String],
  })
  tags!: string[];

  @ApiProperty({
    description: '関連取引一覧',
    type: [TransactionDto],
  })
  relatedTransactions!: TransactionDto[];

  @ApiProperty({
    description: '作成日時（ISO 8601形式）',
    example: '2025-01-27T10:00:00Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: '更新日時（ISO 8601形式）',
    example: '2025-01-27T10:00:00Z',
  })
  updatedAt!: string;
}

/**
 * EventResponseDtoに変換するヘルパー関数
 */
export function toEventResponseDto(
  event: {
    id: string;
    date: Date;
    title: string;
    description: string | null;
    category: EventCategory;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
  },
  relatedTransactions: TransactionEntity[] = [],
): EventResponseDto {
  return {
    id: event.id,
    date: event.date.toISOString().split('T')[0], // YYYY-MM-DD形式
    title: event.title,
    description: event.description,
    category: event.category,
    tags: event.tags,
    relatedTransactions: relatedTransactions.map((tx) => ({
      id: tx.id,
      date: tx.date.toISOString().split('T')[0], // YYYY-MM-DD形式
      amount: tx.amount,
      categoryType: tx.category.type,
      categoryId: tx.category.id,
      categoryName: tx.category.name,
      institutionId: tx.institutionId,
      description: tx.description,
    })),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}
