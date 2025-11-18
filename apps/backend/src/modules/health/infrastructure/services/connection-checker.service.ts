import { Injectable, Logger } from '@nestjs/common';
import { ConnectionStatus } from '../../domain/value-objects/connection-status.enum';
import { ConnectionCheckResult } from '../../domain/value-objects/connection-check-result.vo';
import type {
  IFinancialApiClient,
  IInstitutionInfo,
} from '../../domain/adapters/api-client.interface';

/**
 * 金融機関への接続チェックを行うサービス
 * FR-004: バックグラウンド接続確認で使用
 */
@Injectable()
export class ConnectionCheckerService {
  private readonly logger = new Logger(ConnectionCheckerService.name);
  private readonly TIMEOUT_MS = 10000; // 10秒（要件より）
  private readonly MAX_RESPONSE_TIME_MS = 5000; // 5秒（要件より）

  /**
   * 単一の金融機関への接続をチェック
   * @param institutionId 金融機関ID
   * @param institutionType 金融機関タイプ
   * @param apiClient APIクライアント（各モジュールから注入）
   */
  async checkConnection(
    institutionId: string,
    institutionType: 'bank' | 'credit-card' | 'securities',
    apiClient: IFinancialApiClient,
  ): Promise<ConnectionCheckResult> {
    const startTime = Date.now();
    const checkedAt = new Date();

    try {
      this.logger.debug(
        `接続チェック開始: ${institutionType} - ${institutionId}`,
      );

      // タイムアウト処理付きでヘルスチェック実行
      const result = await Promise.race([
        this.performHealthCheck(apiClient, institutionId),
        this.timeoutPromise(),
      ]);

      const responseTime = Date.now() - startTime;

      if (result.success) {
        this.logger.debug(`接続成功: ${institutionId} (${responseTime}ms)`);

        // パフォーマンス要件の確認
        if (responseTime > this.MAX_RESPONSE_TIME_MS) {
          this.logger.warn(
            `応答時間が要件を超過: ${institutionId} (${responseTime}ms > ${this.MAX_RESPONSE_TIME_MS}ms)`,
          );
        }

        return new ConnectionCheckResult(
          institutionId,
          ConnectionStatus.CONNECTED,
          checkedAt,
          responseTime,
        );
      } else if (result.needsReauth) {
        this.logger.warn(`再認証が必要: ${institutionId}`);

        return new ConnectionCheckResult(
          institutionId,
          ConnectionStatus.NEED_REAUTH,
          checkedAt,
          responseTime,
          result.errorMessage || '認証情報が無効です',
          result.errorCode || 'AUTH_ERROR',
        );
      } else {
        this.logger.error(
          `接続失敗: ${institutionId} - ${result.errorMessage}`,
        );

        return new ConnectionCheckResult(
          institutionId,
          ConnectionStatus.DISCONNECTED,
          checkedAt,
          responseTime,
          result.errorMessage || '接続に失敗しました',
          result.errorCode || 'CONNECTION_ERROR',
        );
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.logger.error(
        `接続チェック中にエラー: ${institutionId}`,
        error instanceof Error ? error.stack : String(error),
      );

      // タイムアウトかその他のエラーかを判定
      const isTimeout = error instanceof Error && error.message === 'TIMEOUT';

      return new ConnectionCheckResult(
        institutionId,
        ConnectionStatus.DISCONNECTED,
        checkedAt,
        responseTime,
        isTimeout ? 'タイムアウトしました' : '予期しないエラーが発生しました',
        isTimeout ? 'TIMEOUT' : 'UNEXPECTED_ERROR',
      );
    }
  }

  /**
   * 複数の金融機関への接続を並列チェック
   * 最大5件同時実行（要件より）
   */
  async checkMultipleConnections(
    institutions: IInstitutionInfo[],
  ): Promise<ConnectionCheckResult[]> {
    const MAX_PARALLEL = 5;
    const results: ConnectionCheckResult[] = [];

    // チャンク単位で処理
    for (let i = 0; i < institutions.length; i += MAX_PARALLEL) {
      const chunk = institutions.slice(i, i + MAX_PARALLEL);
      const chunkResults = await Promise.all(
        chunk.map((inst) =>
          this.checkConnection(inst.id, inst.type, inst.apiClient),
        ),
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * ヘルスチェックの実行
   * 各APIアダプターのhealthCheckメソッドを呼び出す
   */
  private async performHealthCheck(
    apiClient: IFinancialApiClient,
    institutionId: string,
  ): Promise<{
    success: boolean;
    needsReauth?: boolean;
    errorMessage?: string;
    errorCode?: string;
  }> {
    try {
      // IFinancialApiClientインターフェースのhealthCheckメソッドを呼び出す
      // 各APIアダプターはIFinancialApiClientを継承しているため、このメソッドは必ず実装されている
      return await apiClient.healthCheck(institutionId);
    } catch (error: unknown) {
      this.logger.error(
        `APIクライアントのヘルスチェック中にエラー: ${institutionId} - ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        success: false,
        errorMessage:
          error instanceof Error ? error.message : '不明なAPIエラー',
        errorCode: 'API_CLIENT_ERROR',
      };
    }
  }

  /**
   * タイムアウト用Promise
   */
  private timeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, this.TIMEOUT_MS);
    });
  }
}
