import { v4 as uuidv4 } from 'uuid';
import { ConnectionStatus } from '../value-objects/connection-status.enum';

/**
 * 接続履歴エンティティ
 * FR-004: バックグラウンド接続確認で使用
 */
export class ConnectionHistory {
  private constructor(
    public readonly id: string,
    public readonly institutionId: string,
    public readonly institutionName: string,
    public readonly institutionType: 'bank' | 'credit-card' | 'securities',
    public readonly status: ConnectionStatus,
    public readonly checkedAt: Date,
    public readonly responseTime: number, // ミリ秒
    public readonly errorMessage?: string,
    public readonly errorCode?: string,
  ) {}

  /**
   * 新しい接続履歴を作成
   */
  static create(
    institutionId: string,
    institutionName: string,
    institutionType: 'bank' | 'credit-card' | 'securities',
    status: ConnectionStatus,
    checkedAt: Date,
    responseTime: number,
    errorMessage?: string,
    errorCode?: string,
  ): ConnectionHistory {
    return new ConnectionHistory(
      uuidv4(),
      institutionId,
      institutionName,
      institutionType,
      status,
      checkedAt,
      responseTime,
      errorMessage,
      errorCode,
    );
  }

  /**
   * 既存データから復元
   */
  static restore(
    id: string,
    institutionId: string,
    institutionName: string,
    institutionType: 'bank' | 'credit-card' | 'securities',
    status: ConnectionStatus,
    checkedAt: Date,
    responseTime: number,
    errorMessage?: string,
    errorCode?: string,
  ): ConnectionHistory {
    return new ConnectionHistory(
      id,
      institutionId,
      institutionName,
      institutionType,
      status,
      checkedAt,
      responseTime,
      errorMessage,
      errorCode,
    );
  }

  /**
   * JSONにシリアライズ
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      institutionId: this.institutionId,
      institutionName: this.institutionName,
      institutionType: this.institutionType,
      status: this.status,
      checkedAt: this.checkedAt.toISOString(),
      responseTime: this.responseTime,
      errorMessage: this.errorMessage,
      errorCode: this.errorCode,
    };
  }

  /**
   * 接続が成功したかどうかを判定
   */
  isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }

  /**
   * エラーが発生したかどうかを判定
   */
  hasError(): boolean {
    return (
      this.status === ConnectionStatus.DISCONNECTED ||
      this.status === ConnectionStatus.NEED_REAUTH
    );
  }
}
