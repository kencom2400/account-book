import { ConnectionStatus } from './connection-status.enum';

/**
 * 接続チェック結果の値オブジェクト
 * FR-004: バックグラウンド接続確認で使用
 */
export class ConnectionCheckResult {
  constructor(
    public readonly institutionId: string,
    public readonly status: ConnectionStatus,
    public readonly checkedAt: Date,
    public readonly responseTime: number, // ミリ秒
    public readonly errorMessage?: string,
    public readonly errorCode?: string,
  ) {}

  /**
   * 接続が成功したかどうかを判定
   */
  isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }

  /**
   * 再認証が必要かどうかを判定
   */
  needsReauth(): boolean {
    return this.status === ConnectionStatus.NEED_REAUTH;
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

  /**
   * パフォーマンス要件を満たしているかを判定
   * 要件: 各金融機関あたり最大5秒
   */
  meetsPerformanceRequirement(): boolean {
    return this.responseTime <= 5000;
  }
}
