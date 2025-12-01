import { PaymentStatus } from '../../enums/payment-status.enum';
import { PaymentStatusHistory } from '../entities/payment-status-history.entity';
import { PaymentStatusRecord } from '../entities/payment-status-record.entity';

/**
 * 支払いステータスリポジトリ インターフェース
 *
 * 支払いステータス記録の永続化を担当
 * 履歴は追記のみ（append-only）で、削除・変更は不可
 */
export interface PaymentStatusRepository {
  /**
   * ステータス記録を保存
   * 既存データがある場合は更新（ただし、履歴は追記のみ）
   */
  save(record: PaymentStatusRecord): Promise<PaymentStatusRecord>;

  /**
   * IDでステータス記録を検索
   */
  findById(id: string): Promise<PaymentStatusRecord | null>;

  /**
   * カード集計IDで最新のステータス記録を検索
   */
  findByCardSummaryId(
    cardSummaryId: string,
  ): Promise<PaymentStatusRecord | null>;

  /**
   * カード集計IDでステータス変更履歴を取得
   */
  findHistoryByCardSummaryId(
    cardSummaryId: string,
  ): Promise<PaymentStatusHistory>;

  /**
   * ステータスでステータス記録を検索
   */
  findAllByStatus(status: PaymentStatus): Promise<PaymentStatusRecord[]>;
}
