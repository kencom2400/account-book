import type { ConnectionStatusResult } from '../../application/use-cases/check-connection-status.use-case';

/**
 * 接続失敗イベント
 * 金融機関の接続チェックでエラーが発生した際に発行される
 */
export class ConnectionFailedEvent {
  constructor(
    public readonly errors: ConnectionStatusResult[],
    public readonly checkedAt: Date,
  ) {}
}
