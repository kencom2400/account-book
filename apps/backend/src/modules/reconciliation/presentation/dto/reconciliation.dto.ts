import { ApiProperty } from '@nestjs/swagger';
import { ReconciliationStatus } from '../../domain/enums/reconciliation-status.enum';

/**
 * 不一致詳細DTO
 */
export class DiscrepancyDto {
  @ApiProperty({
    description: '金額差（円）',
    example: 1000,
  })
  amountDifference!: number;

  @ApiProperty({
    description: '日数差（営業日）',
    example: 2,
  })
  dateDifference!: number;

  @ApiProperty({
    description: '摘要一致フラグ',
    example: false,
  })
  descriptionMatch!: boolean;

  @ApiProperty({
    description: '不一致理由',
    example: '照合対象が見つかりませんでした',
  })
  reason!: string;
}

/**
 * 照合結果DTO
 */
export class ReconciliationResultDto {
  @ApiProperty({
    description: '一致フラグ',
    example: true,
  })
  isMatched!: boolean;

  @ApiProperty({
    description: '信頼度スコア（0-100）',
    example: 100,
  })
  confidence!: number;

  @ApiProperty({
    description: '銀行取引ID（一致時）',
    example: 'tx-bank-001',
    nullable: true,
  })
  bankTransactionId!: string | null;

  @ApiProperty({
    description: 'カード月別集計ID',
    example: 'summary-001',
  })
  cardSummaryId!: string;

  @ApiProperty({
    description: '一致日時（一致時）',
    example: '2025-01-30T00:00:00.000Z',
    nullable: true,
  })
  matchedAt!: string | null;

  @ApiProperty({
    description: '不一致詳細（不一致時）',
    type: DiscrepancyDto,
    nullable: true,
  })
  discrepancy!: DiscrepancyDto | null;
}

/**
 * 照合サマリーDTO
 */
export class ReconciliationSummaryDto {
  @ApiProperty({
    description: '照合件数合計',
    example: 1,
  })
  total!: number;

  @ApiProperty({
    description: '一致件数',
    example: 1,
  })
  matched!: number;

  @ApiProperty({
    description: '不一致件数',
    example: 0,
  })
  unmatched!: number;

  @ApiProperty({
    description: '部分一致件数',
    example: 0,
  })
  partial!: number;
}

/**
 * 照合結果詳細レスポンスDTO
 * GET /api/reconciliations/:id で使用
 */
export class ReconciliationResponseDto {
  @ApiProperty({
    description: '照合結果ID',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  id!: string;

  @ApiProperty({
    description: 'クレジットカードID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  cardId!: string;

  @ApiProperty({
    description: '請求月（YYYY-MM形式）',
    example: '2025-01',
  })
  billingMonth!: string;

  @ApiProperty({
    description: '照合ステータス',
    example: 'MATCHED',
    enum: ReconciliationStatus,
  })
  status!: ReconciliationStatus;

  @ApiProperty({
    description: '照合実行日時',
    example: '2025-01-30T00:00:00.000Z',
  })
  executedAt!: string;

  @ApiProperty({
    description: '照合結果リスト',
    type: [ReconciliationResultDto],
  })
  results!: ReconciliationResultDto[];

  @ApiProperty({
    description: '照合サマリー',
    type: ReconciliationSummaryDto,
  })
  summary!: ReconciliationSummaryDto;

  @ApiProperty({
    description: '作成日時',
    example: '2025-01-30T00:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: '更新日時',
    example: '2025-01-30T00:00:00.000Z',
  })
  updatedAt!: string;
}

/**
 * 照合結果一覧項目DTO（簡略版）
 * GET /api/reconciliations で使用
 */
export class ReconciliationListItemDto {
  @ApiProperty({
    description: '照合結果ID',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  id!: string;

  @ApiProperty({
    description: 'クレジットカードID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  cardId!: string;

  @ApiProperty({
    description: '請求月（YYYY-MM形式）',
    example: '2025-01',
  })
  billingMonth!: string;

  @ApiProperty({
    description: '照合ステータス',
    example: 'MATCHED',
    enum: ReconciliationStatus,
  })
  status!: ReconciliationStatus;

  @ApiProperty({
    description: '照合実行日時',
    example: '2025-01-30T00:00:00.000Z',
  })
  executedAt!: string;

  @ApiProperty({
    description: '照合サマリー',
    type: ReconciliationSummaryDto,
  })
  summary!: ReconciliationSummaryDto;

  @ApiProperty({
    description: '作成日時',
    example: '2025-01-30T00:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: '更新日時',
    example: '2025-01-30T00:00:00.000Z',
  })
  updatedAt!: string;
}
