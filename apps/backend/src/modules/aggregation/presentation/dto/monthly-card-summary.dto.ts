import { ApiProperty } from '@nestjs/swagger';

/**
 * カテゴリ別集計データDTO
 */
export class CategoryAmountDto {
  @ApiProperty({
    description: 'カテゴリ名',
    example: '食費',
  })
  category!: string;

  @ApiProperty({
    description: '金額',
    example: 30000,
  })
  amount!: number;

  @ApiProperty({
    description: '取引件数',
    example: 10,
  })
  count!: number;
}

/**
 * 月別集計詳細レスポンスDTO（完全版）
 * POST /api/aggregation/card/monthly と GET /api/aggregation/card/monthly/:id で使用
 */
export class MonthlyCardSummaryResponseDto {
  @ApiProperty({
    description: '集計データID',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  id!: string;

  @ApiProperty({
    description: 'クレジットカードID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  cardId!: string;

  @ApiProperty({
    description: 'クレジットカード名',
    example: '楽天カード',
  })
  cardName!: string;

  @ApiProperty({
    description: '請求月（YYYY-MM形式）',
    example: '2025-01',
  })
  billingMonth!: string;

  @ApiProperty({
    description: '締め日',
    example: '2025-01-31T00:00:00.000Z',
  })
  closingDate!: string;

  @ApiProperty({
    description: '支払日',
    example: '2025-02-27T00:00:00.000Z',
  })
  paymentDate!: string;

  @ApiProperty({
    description: '合計金額',
    example: 50000,
  })
  totalAmount!: number;

  @ApiProperty({
    description: '取引件数',
    example: 15,
  })
  transactionCount!: number;

  @ApiProperty({
    description: 'カテゴリ別内訳',
    type: [CategoryAmountDto],
  })
  categoryBreakdown!: CategoryAmountDto[];

  @ApiProperty({
    description: '取引IDリスト',
    example: ['tx-001', 'tx-002', 'tx-003'],
    type: [String],
  })
  transactionIds!: string[];

  @ApiProperty({
    description: '最終支払額',
    example: 50000,
  })
  netPaymentAmount!: number;

  @ApiProperty({
    description: '支払いステータス',
    example: 'PENDING',
    enum: [
      'PENDING',
      'PROCESSING',
      'PAID',
      'OVERDUE',
      'PARTIAL',
      'DISPUTED',
      'CANCELLED',
      'MANUAL_CONFIRMED',
    ],
  })
  status!: string;

  @ApiProperty({
    description: '作成日時',
    example: '2025-11-30T00:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: '更新日時',
    example: '2025-11-30T00:00:00.000Z',
  })
  updatedAt!: string;
}

/**
 * 月別集計リスト項目DTO（簡略版）
 * GET /api/aggregation/card/monthly で使用
 */
export class MonthlyCardSummaryListItemDto {
  @ApiProperty({
    description: '集計データID',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  id!: string;

  @ApiProperty({
    description: 'クレジットカードID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  cardId!: string;

  @ApiProperty({
    description: 'クレジットカード名',
    example: '楽天カード',
  })
  cardName!: string;

  @ApiProperty({
    description: '請求月（YYYY-MM形式）',
    example: '2025-01',
  })
  billingMonth!: string;

  @ApiProperty({
    description: '支払日',
    example: '2025-02-27T00:00:00.000Z',
  })
  paymentDate!: string;

  @ApiProperty({
    description: '合計金額',
    example: 50000,
  })
  totalAmount!: number;

  @ApiProperty({
    description: '取引件数',
    example: 15,
  })
  transactionCount!: number;

  @ApiProperty({
    description: '最終支払額',
    example: 50000,
  })
  netPaymentAmount!: number;

  @ApiProperty({
    description: '支払いステータス',
    example: 'PENDING',
    enum: [
      'PENDING',
      'PROCESSING',
      'PAID',
      'OVERDUE',
      'PARTIAL',
      'DISPUTED',
      'CANCELLED',
      'MANUAL_CONFIRMED',
    ],
  })
  status!: string;
}
