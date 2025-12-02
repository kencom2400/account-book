import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { PaymentStatusHistory } from '../../domain/entities/payment-status-history.entity';
import { PaymentStatusRecord } from '../../domain/entities/payment-status-record.entity';

/**
 * 支払いステータスレスポンスDTO
 */
export interface PaymentStatusResponseDto {
  id: string;
  cardSummaryId: string;
  status: PaymentStatus;
  previousStatus?: PaymentStatus;
  updatedAt: string;
  updatedBy: 'system' | 'user';
  reason?: string;
  reconciliationId?: string;
  notes?: string;
  createdAt: string;
}

/**
 * 支払いステータス記録DTO
 */
export interface PaymentStatusRecordDto {
  id: string;
  status: PaymentStatus;
  previousStatus?: PaymentStatus;
  updatedAt: string;
  updatedBy: 'system' | 'user';
  reason?: string;
  reconciliationId?: string;
  notes?: string;
  createdAt: string;
}

/**
 * 支払いステータス履歴レスポンスDTO
 */
export interface PaymentStatusHistoryResponseDto {
  cardSummaryId: string;
  statusChanges: PaymentStatusRecordDto[];
}

/**
 * 支払いステータス一覧アイテムDTO
 */
export interface PaymentStatusListItemDto {
  id: string;
  cardSummaryId: string;
  status: PaymentStatus;
  updatedAt: string;
  updatedBy: 'system' | 'user';
}

/**
 * PaymentStatusRecordからPaymentStatusResponseDtoに変換
 */
export function toPaymentStatusResponseDto(
  record: PaymentStatusRecord,
): PaymentStatusResponseDto {
  return {
    id: record.id,
    cardSummaryId: record.cardSummaryId,
    status: record.status,
    previousStatus: record.previousStatus,
    updatedAt: record.updatedAt.toISOString(),
    updatedBy: record.updatedBy,
    reason: record.reason,
    reconciliationId: record.reconciliationId,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
  };
}

/**
 * PaymentStatusRecordからPaymentStatusRecordDtoに変換
 */
export function toPaymentStatusRecordDto(
  record: PaymentStatusRecord,
): PaymentStatusRecordDto {
  return {
    id: record.id,
    status: record.status,
    previousStatus: record.previousStatus,
    updatedAt: record.updatedAt.toISOString(),
    updatedBy: record.updatedBy,
    reason: record.reason,
    reconciliationId: record.reconciliationId,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
  };
}

/**
 * PaymentStatusHistoryからPaymentStatusHistoryResponseDtoに変換
 */
export function toPaymentStatusHistoryResponseDto(
  history: PaymentStatusHistory,
): PaymentStatusHistoryResponseDto {
  return {
    cardSummaryId: history.cardSummaryId,
    statusChanges: history.statusChanges.map(toPaymentStatusRecordDto),
  };
}

/**
 * PaymentStatusRecordからPaymentStatusListItemDtoに変換
 */
export function toPaymentStatusListItemDto(
  record: PaymentStatusRecord,
): PaymentStatusListItemDto {
  return {
    id: record.id,
    cardSummaryId: record.cardSummaryId,
    status: record.status,
    updatedAt: record.updatedAt.toISOString(),
    updatedBy: record.updatedBy,
  };
}
