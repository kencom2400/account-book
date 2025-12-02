import { ActionType } from '../enums/action-type.enum';

/**
 * アラートアクション Value Object
 *
 * アラートに対するアクションを保持する不変オブジェクト
 */
export class AlertAction {
  constructor(
    public readonly id: string,
    public readonly label: string,
    public readonly action: ActionType,
    public readonly isPrimary: boolean,
  ) {
    this.validate();
  }

  /**
   * バリデーション
   */
  private validate(): void {
    if (!this.id) {
      throw new Error('Action ID is required');
    }
    if (!this.label) {
      throw new Error('Action label is required');
    }
    if (!this.action) {
      throw new Error('Action type is required');
    }
  }

  /**
   * プレーンオブジェクトに変換
   */
  toPlain(): {
    id: string;
    label: string;
    action: ActionType;
    isPrimary: boolean;
  } {
    return {
      id: this.id,
      label: this.label,
      action: this.action,
      isPrimary: this.isPrimary,
    };
  }

  /**
   * プレーンオブジェクトから生成
   */
  static fromPlain(plain: {
    id: string;
    label: string;
    action: ActionType;
    isPrimary: boolean;
  }): AlertAction {
    return new AlertAction(
      plain.id,
      plain.label,
      plain.action,
      plain.isPrimary,
    );
  }
}
