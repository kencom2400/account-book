import { randomUUID } from 'crypto';
import { PaymentStatus } from '../enums/payment-status.enum';

/**
 * 支払いステータス記録 Entity
 *
 * 支払いステータスの変更履歴を保持し、ステータス遷移の妥当性を検証する
 */
export class PaymentStatusRecord {
  /**
   * ステータス遷移ルール（一元管理）
   */
  private static readonly ALLOWED_TRANSITIONS: Record<
    PaymentStatus,
    PaymentStatus[]
  > = {
    [PaymentStatus.PENDING]: [
      PaymentStatus.PROCESSING,
      PaymentStatus.PARTIAL,
      PaymentStatus.CANCELLED,
      PaymentStatus.MANUAL_CONFIRMED,
    ],
    [PaymentStatus.PROCESSING]: [
      PaymentStatus.PAID,
      PaymentStatus.DISPUTED,
      PaymentStatus.OVERDUE,
    ],
    [PaymentStatus.DISPUTED]: [PaymentStatus.MANUAL_CONFIRMED],
    [PaymentStatus.PAID]: [],
    [PaymentStatus.OVERDUE]: [],
    [PaymentStatus.PARTIAL]: [],
    [PaymentStatus.CANCELLED]: [],
    [PaymentStatus.MANUAL_CONFIRMED]: [],
  };

  constructor(
    public readonly id: string,
    public readonly cardSummaryId: string,
    public readonly status: PaymentStatus,
    public readonly previousStatus: PaymentStatus | undefined,
    public readonly updatedAt: Date,
    public readonly updatedBy: 'system' | 'user',
    public readonly reason: string | undefined,
    public readonly reconciliationId: string | undefined,
    public readonly notes: string | undefined,
    public readonly createdAt: Date,
  ) {
    this.validate();
  }

  /**
   * バリデーション
   */
  private validate(): void {
    if (!this.id) {
      throw new Error('ID is required');
    }
    if (!this.cardSummaryId) {
      throw new Error('Card summary ID is required');
    }
    if (!this.status) {
      throw new Error('Status is required');
    }
    if (!this.updatedAt) {
      throw new Error('Updated at is required');
    }
    if (!this.updatedBy) {
      throw new Error('Updated by is required');
    }
    if (!this.createdAt) {
      throw new Error('Created at is required');
    }
  }

  /**
   * 指定されたステータスへの遷移が可能か判定
   *
   * @param newStatus 遷移先のステータス
   * @returns 遷移可能な場合true
   */
  canTransitionTo(newStatus: PaymentStatus): boolean {
    // 同じステータスへの遷移は不可
    if (this.status === newStatus) {
      return false;
    }

    // 終端状態からは遷移不可
    const terminalStatuses = [
      PaymentStatus.PAID,
      PaymentStatus.OVERDUE,
      PaymentStatus.PARTIAL,
      PaymentStatus.CANCELLED,
      PaymentStatus.MANUAL_CONFIRMED,
    ];
    if (terminalStatuses.includes(this.status)) {
      return false;
    }

    // 遷移ルールを静的メンバーから取得
    const allowed = PaymentStatusRecord.ALLOWED_TRANSITIONS[this.status] || [];
    return allowed.includes(newStatus);
  }

  /**
   * 遷移可能なステータスリストを取得
   *
   * @returns 遷移可能なステータスの配列
   */
  getAllowedTransitions(): PaymentStatus[] {
    // 遷移ルールを静的メンバーから取得
    return PaymentStatusRecord.ALLOWED_TRANSITIONS[this.status] || [];
  }

  /**
   * ステータスを遷移（新しいインスタンスを返す）
   *
   * @param newStatus 遷移先のステータス
   * @param updatedBy 更新者
   * @param reason ステータス変更理由（オプション）
   * @param notes ユーザー入力メモ（オプション）
   * @param reconciliationId 照合ID（オプション）
   * @returns 新しいPaymentStatusRecordインスタンス
   * @throws Error 遷移が不可能な場合
   */
  transitionTo(
    newStatus: PaymentStatus,
    updatedBy: 'system' | 'user',
    reason?: string,
    notes?: string,
    reconciliationId?: string,
  ): PaymentStatusRecord {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
    }

    return new PaymentStatusRecord(
      randomUUID(),
      this.cardSummaryId,
      newStatus,
      this.status,
      new Date(),
      updatedBy,
      reason,
      reconciliationId,
      notes,
      new Date(),
    );
  }

  /**
   * 最初のステータス記録を作成（ファクトリメソッド）
   *
   * @param cardSummaryId カード集計ID
   * @param initialStatus 初期ステータス
   * @param updatedBy 更新者
   * @param reason ステータス変更理由（オプション）
   * @returns 新しいPaymentStatusRecordインスタンス
   */
  static createInitial(
    cardSummaryId: string,
    initialStatus: PaymentStatus,
    updatedBy: 'system' | 'user' = 'system',
    reason?: string,
  ): PaymentStatusRecord {
    return new PaymentStatusRecord(
      randomUUID(),
      cardSummaryId,
      initialStatus,
      undefined,
      new Date(),
      updatedBy,
      reason,
      undefined,
      undefined,
      new Date(),
    );
  }
}
