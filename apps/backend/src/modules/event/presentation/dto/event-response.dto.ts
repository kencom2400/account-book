import { ApiProperty } from '@nestjs/swagger';
import { EventCategory } from '../../domain/enums/event-category.enum';
import { TransactionEntity } from '../../../transaction/domain/entities/transaction.entity';
import { EventEntity } from '../../domain/entities/event.entity';

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
 * EventSummaryDto
 * 収支サマリー専用のイベント情報DTO（relatedTransactionsを除外）
 */
export class EventSummaryDto {
  @ApiProperty({
    description: 'イベントID',
    example: 'evt_001',
  })
  id!: string;

  @ApiProperty({
    description: 'イベント日付（ISO 8601形式）',
    example: '2025-08-10',
  })
  date!: string;

  @ApiProperty({
    description: 'イベントタイトル',
    example: '沖縄旅行',
  })
  title!: string;

  @ApiProperty({
    description: 'イベント説明',
    example: '家族旅行',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'イベントカテゴリ',
    enum: EventCategory,
    example: EventCategory.TRAVEL,
  })
  category!: EventCategory;

  @ApiProperty({
    description: 'タグ',
    example: ['旅行', '沖縄'],
    type: [String],
  })
  tags!: string[];

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
 * SuggestedTransactionDto
 * 推奨取引のレスポンスDTO
 */
export class SuggestedTransactionDto {
  @ApiProperty({
    description: '取引情報',
    type: TransactionDto,
  })
  transaction!: TransactionDto;

  @ApiProperty({
    description: '推奨スコア（0-100）',
    example: 85,
  })
  score!: number;

  @ApiProperty({
    description: '推奨理由の配列',
    example: [
      '日付が近い（0日差）',
      '高額取引（5万円以上）',
      'カテゴリが関連（交通費）',
    ],
    type: [String],
  })
  reasons!: string[];
}

/**
 * EventFinancialSummaryResponseDto
 * イベント別収支サマリーレスポンスDTO
 */
export class EventFinancialSummaryResponseDto {
  @ApiProperty({
    description: 'イベント情報（relatedTransactionsを除外）',
    type: EventSummaryDto,
  })
  event!: EventSummaryDto;

  @ApiProperty({
    description: '関連取引一覧',
    type: [TransactionDto],
  })
  relatedTransactions!: TransactionDto[];

  @ApiProperty({
    description: '総収入（円）',
    example: 0,
  })
  totalIncome!: number;

  @ApiProperty({
    description: '総支出（円）',
    example: 80000,
  })
  totalExpense!: number;

  @ApiProperty({
    description: '純収支（totalIncome - totalExpense）',
    example: -80000,
  })
  netAmount!: number;

  @ApiProperty({
    description: '関連取引件数',
    example: 2,
  })
  transactionCount!: number;
}

/**
 * EventResponseDtoに変換するヘルパー関数
 */
export function toEventResponseDto(
  event:
    | EventEntity
    | {
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

/**
 * EventSummaryDtoに変換するヘルパー関数
 */
export function toEventSummaryDto(event: EventEntity): EventSummaryDto {
  return {
    id: event.id,
    date: event.date.toISOString().split('T')[0], // YYYY-MM-DD形式
    title: event.title,
    description: event.description,
    category: event.category,
    tags: event.tags,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

/**
 * TransactionDtoに変換するヘルパー関数
 */
export function toTransactionDto(
  transaction: TransactionEntity,
): TransactionDto {
  return {
    id: transaction.id,
    date: transaction.date.toISOString().split('T')[0], // YYYY-MM-DD形式
    amount: transaction.amount,
    categoryType: transaction.category.type,
    categoryId: transaction.category.id,
    categoryName: transaction.category.name,
    institutionId: transaction.institutionId,
    description: transaction.description,
  };
}
