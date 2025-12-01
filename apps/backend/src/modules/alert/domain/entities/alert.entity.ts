import { AlertType } from '../enums/alert-type.enum';
import { AlertLevel } from '../enums/alert-level.enum';
import { AlertStatus } from '../enums/alert-status.enum';
import { AlertDetails } from '../value-objects/alert-details.vo';
import { AlertAction } from '../value-objects/alert-action.vo';

/**
 * アラートエンティティ
 *
 * アラート情報を保持し、アラートステータスを管理する
 */
export class Alert {
  private _status: AlertStatus;

  constructor(
    public readonly id: string,
    public readonly type: AlertType,
    public readonly level: AlertLevel,
    public readonly title: string,
    public readonly message: string,
    public readonly details: AlertDetails,
    status: AlertStatus,
    public readonly createdAt: Date,
    public readonly resolvedAt: Date | null,
    public readonly resolvedBy: string | null,
    public readonly resolutionNote: string | null,
    public readonly actions: AlertAction[],
  ) {
    this._status = status;
    this.validate();
  }

  /**
   * バリデーション
   */
  private validate(): void {
    if (!this.id) {
      throw new Error('ID is required');
    }
    if (!this.type) {
      throw new Error('Type is required');
    }
    if (!this.level) {
      throw new Error('Level is required');
    }
    if (!this.title) {
      throw new Error('Title is required');
    }
    if (!this.message) {
      throw new Error('Message is required');
    }
    if (!this.details) {
      throw new Error('Details is required');
    }
    if (!this.createdAt) {
      throw new Error('Created at is required');
    }
    if (!Array.isArray(this.actions)) {
      throw new Error('Actions must be an array');
    }
    // 解決済みの場合は解決情報が必要
    if (this._status === AlertStatus.RESOLVED) {
      if (!this.resolvedAt) {
        throw new Error('Resolved at is required when status is RESOLVED');
      }
      if (!this.resolvedBy) {
        throw new Error('Resolved by is required when status is RESOLVED');
      }
    }
  }

  /**
   * ステータスを取得
   */
  get status(): AlertStatus {
    return this._status;
  }

  /**
   * アラートを既読にする
   */
  markAsRead(): void {
    if (this._status === AlertStatus.RESOLVED) {
      throw new Error('Cannot mark resolved alert as read');
    }
    this._status = AlertStatus.READ;
  }

  /**
   * アラートを解決済みにする
   * 新しいインスタンスを返す（不変性を保つため）
   */
  markAsResolved(resolvedBy: string, resolutionNote?: string): Alert {
    if (this._status === AlertStatus.RESOLVED) {
      throw new Error('Alert is already resolved');
    }
    return new Alert(
      this.id,
      this.type,
      this.level,
      this.title,
      this.message,
      this.details,
      AlertStatus.RESOLVED,
      this.createdAt,
      new Date(), // resolvedAt
      resolvedBy,
      resolutionNote ?? null,
      this.actions,
    );
  }

  /**
   * アクションを追加
   * 新しいインスタンスを返す（不変性を保つため）
   */
  addAction(action: AlertAction): Alert {
    return new Alert(
      this.id,
      this.type,
      this.level,
      this.title,
      this.message,
      this.details,
      this._status,
      this.createdAt,
      this.resolvedAt,
      this.resolvedBy,
      this.resolutionNote,
      [...this.actions, action],
    );
  }

  /**
   * プレーンオブジェクトに変換
   */
  toPlain(): {
    id: string;
    type: AlertType;
    level: AlertLevel;
    title: string;
    message: string;
    details: {
      cardId: string;
      cardName: string;
      billingMonth: string;
      expectedAmount: number;
      actualAmount: number | null;
      discrepancy: number | null;
      paymentDate: Date | null;
      daysElapsed: number | null;
      relatedTransactions: string[];
      reconciliationId: string | null;
    };
    status: AlertStatus;
    createdAt: Date;
    resolvedAt: Date | null;
    resolvedBy: string | null;
    resolutionNote: string | null;
    actions: Array<{
      id: string;
      label: string;
      action: string;
      isPrimary: boolean;
    }>;
  } {
    return {
      id: this.id,
      type: this.type,
      level: this.level,
      title: this.title,
      message: this.message,
      details: this.details.toPlain(),
      status: this._status,
      createdAt: this.createdAt,
      resolvedAt: this.resolvedAt,
      resolvedBy: this.resolvedBy,
      resolutionNote: this.resolutionNote,
      actions: this.actions.map((a) => a.toPlain()),
    };
  }

  /**
   * プレーンオブジェクトから生成
   */
  static fromPlain(plain: {
    id: string;
    type: AlertType;
    level: AlertLevel;
    title: string;
    message: string;
    details: {
      cardId: string;
      cardName: string;
      billingMonth: string;
      expectedAmount: number;
      actualAmount: number | null;
      discrepancy: number | null;
      paymentDate: Date | null;
      daysElapsed: number | null;
      relatedTransactions: string[];
      reconciliationId: string | null;
    };
    status: AlertStatus;
    createdAt: Date;
    resolvedAt: Date | null;
    resolvedBy: string | null;
    resolutionNote: string | null;
    actions: Array<{
      id: string;
      label: string;
      action: string;
      isPrimary: boolean;
    }>;
  }): Alert {
    return new Alert(
      plain.id,
      plain.type,
      plain.level,
      plain.title,
      plain.message,
      AlertDetails.fromPlain(plain.details),
      plain.status,
      plain.createdAt,
      plain.resolvedAt,
      plain.resolvedBy,
      plain.resolutionNote,
      plain.actions.map((a) => AlertAction.fromPlain(a)),
    );
  }
}
