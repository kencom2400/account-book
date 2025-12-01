import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentStatusRecord } from './payment-status-record.entity';

/**
 * 支払いステータス履歴 Entity
 *
 * ステータス変更履歴を保持し、履歴の操作を提供する
 */
export class PaymentStatusHistory {
  constructor(
    public readonly cardSummaryId: string,
    public readonly statusChanges: PaymentStatusRecord[],
  ) {
    this.validate();
  }

  /**
   * バリデーション
   */
  private validate(): void {
    if (!this.cardSummaryId) {
      throw new Error('Card summary ID is required');
    }
    if (!this.statusChanges) {
      throw new Error('Status changes is required');
    }
    // すべてのstatusChangesが同じcardSummaryIdを持つことを確認
    const invalidRecords = this.statusChanges.filter(
      (record) => record.cardSummaryId !== this.cardSummaryId,
    );
    if (invalidRecords.length > 0) {
      throw new Error('All status changes must have the same card summary ID');
    }
  }

  /**
   * 新しいステータス変更を追加
   *
   * @param record ステータス変更記録
   * @returns 新しいPaymentStatusHistoryインスタンス（不変性を保証）
   */
  addStatusChange(record: PaymentStatusRecord): PaymentStatusHistory {
    if (record.cardSummaryId !== this.cardSummaryId) {
      throw new Error(
        'Status change record must have the same card summary ID',
      );
    }

    // 新しい配列を作成して追加（不変性を保証）
    const newStatusChanges = [...this.statusChanges, record];

    return new PaymentStatusHistory(this.cardSummaryId, newStatusChanges);
  }

  /**
   * 最新のステータスを取得
   *
   * @returns 最新のステータス
   * @throws Error ステータス変更履歴が存在しない場合
   */
  getLatestStatus(): PaymentStatus {
    if (this.statusChanges.length === 0) {
      throw new Error('No status changes found');
    }
    return this.statusChanges[this.statusChanges.length - 1].status;
  }

  /**
   * 指定日時点のステータスを取得
   *
   * @param date 指定日時
   * @returns 指定日時点のステータス記録、存在しない場合はnull
   */
  getStatusAt(date: Date): PaymentStatusRecord | null {
    // statusChangesはupdatedAt昇順でソートされていると仮定し、逆順にしてから検索します
    // 指定日以前で最も新しいレコードを返す
    return (
      this.statusChanges
        .slice()
        .reverse()
        .find((record) => record.updatedAt <= date) || null
    );
  }

  /**
   * 空の履歴を作成（ファクトリメソッド）
   *
   * @param cardSummaryId カード集計ID
   * @returns 新しいPaymentStatusHistoryインスタンス
   */
  static createEmpty(cardSummaryId: string): PaymentStatusHistory {
    return new PaymentStatusHistory(cardSummaryId, []);
  }
}
