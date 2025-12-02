import { ApiProperty } from '@nestjs/swagger';
import { AlertType } from '../../domain/enums/alert-type.enum';
import { AlertLevel } from '../../domain/enums/alert-level.enum';
import { AlertStatus } from '../../domain/enums/alert-status.enum';
import { ActionType } from '../../domain/enums/action-type.enum';

/**
 * アラート詳細情報DTO
 */
export class AlertDetailsDto {
  @ApiProperty({
    description: 'カードID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  cardId!: string;

  @ApiProperty({
    description: 'カード名',
    example: '三井住友カード',
  })
  cardName!: string;

  @ApiProperty({
    description: '請求月（YYYY-MM形式）',
    example: '2025-01',
  })
  billingMonth!: string;

  @ApiProperty({
    description: '請求額（期待値）',
    example: 50000,
  })
  expectedAmount!: number;

  @ApiProperty({
    description: '引落額（実際の値）',
    example: 48000,
    nullable: true,
  })
  actualAmount!: number | null;

  @ApiProperty({
    description: '差額',
    example: -2000,
    nullable: true,
  })
  discrepancy!: number | null;

  @ApiProperty({
    description: '引落予定日',
    example: '2025-02-27T00:00:00.000Z',
    nullable: true,
  })
  paymentDate!: string | null;

  @ApiProperty({
    description: '経過日数',
    example: 3,
    nullable: true,
  })
  daysElapsed!: number | null;

  @ApiProperty({
    description: '関連取引IDリスト',
    example: ['tx-001', 'tx-002'],
    type: [String],
  })
  relatedTransactions!: string[];

  @ApiProperty({
    description: '照合結果ID',
    example: 'reconciliation-001',
    nullable: true,
  })
  reconciliationId!: string | null;
}

/**
 * アラートアクションDTO
 */
export class AlertActionDto {
  @ApiProperty({
    description: 'アクションID',
    example: 'action-001',
  })
  id!: string;

  @ApiProperty({
    description: 'アクションラベル',
    example: '詳細を確認',
  })
  label!: string;

  @ApiProperty({
    description: 'アクションタイプ',
    example: 'view_details',
    enum: ActionType,
  })
  action!: ActionType;

  @ApiProperty({
    description: 'プライマリアクションかどうか',
    example: false,
  })
  isPrimary!: boolean;
}

/**
 * アラート一覧項目DTO（簡略版）
 * GET /api/alerts で使用
 */
export class AlertListItemDto {
  @ApiProperty({
    description: 'アラートID',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  id!: string;

  @ApiProperty({
    description: 'アラートタイプ',
    example: 'amount_mismatch',
    enum: AlertType,
  })
  type!: AlertType;

  @ApiProperty({
    description: 'アラートレベル',
    example: 'warning',
    enum: AlertLevel,
  })
  level!: AlertLevel;

  @ApiProperty({
    description: 'アラートタイトル',
    example: 'クレジットカード引落額が一致しません',
  })
  title!: string;

  @ApiProperty({
    description: 'アラートステータス',
    example: 'unread',
    enum: AlertStatus,
  })
  status!: AlertStatus;

  @ApiProperty({
    description: '作成日時',
    example: '2025-01-30T00:00:00.000Z',
  })
  createdAt!: string;
}

/**
 * アラート詳細レスポンスDTO
 * GET /api/alerts/:id で使用
 */
export class AlertResponseDto {
  @ApiProperty({
    description: 'アラートID',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  id!: string;

  @ApiProperty({
    description: 'アラートタイプ',
    example: 'amount_mismatch',
    enum: AlertType,
  })
  type!: AlertType;

  @ApiProperty({
    description: 'アラートレベル',
    example: 'warning',
    enum: AlertLevel,
  })
  level!: AlertLevel;

  @ApiProperty({
    description: 'アラートタイトル',
    example: 'クレジットカード引落額が一致しません',
  })
  title!: string;

  @ApiProperty({
    description: 'アラートメッセージ',
    example:
      '三井住友カードの2025-01分の引落額に差異があります。\n\n請求額: ¥50000\n引落額: ¥48000\n差額: ¥-2000',
  })
  message!: string;

  @ApiProperty({
    description: 'アラート詳細情報',
    type: AlertDetailsDto,
  })
  details!: AlertDetailsDto;

  @ApiProperty({
    description: 'アラートステータス',
    example: 'unread',
    enum: AlertStatus,
  })
  status!: AlertStatus;

  @ApiProperty({
    description: '作成日時',
    example: '2025-01-30T00:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: '解決日時',
    example: '2025-01-31T00:00:00.000Z',
    nullable: true,
  })
  resolvedAt!: string | null;

  @ApiProperty({
    description: '解決者',
    example: 'user-001',
    nullable: true,
  })
  resolvedBy!: string | null;

  @ApiProperty({
    description: '解決メモ',
    example: '手動で照合しました',
    nullable: true,
  })
  resolutionNote!: string | null;

  @ApiProperty({
    description: 'アクションリスト',
    type: [AlertActionDto],
  })
  actions!: AlertActionDto[];
}

/**
 * アラート一覧レスポンスDTO
 * GET /api/alerts で使用
 */
export class AlertListResponseDto {
  @ApiProperty({
    description: 'アラート一覧',
    type: [AlertListItemDto],
  })
  alerts!: AlertListItemDto[];

  @ApiProperty({
    description: '総件数',
    example: 10,
  })
  total!: number;

  @ApiProperty({
    description: '未読件数',
    example: 5,
  })
  unreadCount!: number;
}
