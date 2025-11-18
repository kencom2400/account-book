import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConnectionCheckerService } from '../../infrastructure/services/connection-checker.service';
import type { IConnectionHistoryRepository } from '../../domain/repositories/connection-history.repository.interface';
import { CONNECTION_HISTORY_REPOSITORY } from '../../domain/repositories/connection-history.repository.interface';
import { ConnectionHistory } from '../../domain/entities/connection-history.entity';
import type { IInstitutionInfo } from '../../domain/adapters/api-client.interface';

export interface CheckConnectionStatusCommand {
  institutionId?: string; // 指定されない場合は全金融機関をチェック
}

export interface ConnectionStatusResult {
  institutionId: string;
  institutionName: string;
  institutionType: 'bank' | 'credit-card' | 'securities';
  status: string;
  checkedAt: string;
  responseTime: number;
  errorMessage?: string;
  errorCode?: string;
}

/**
 * 接続状態チェックのユースケース
 * FR-004: バックグラウンド接続確認で使用
 */
@Injectable()
export class CheckConnectionStatusUseCase {
  private readonly logger = new Logger(CheckConnectionStatusUseCase.name);

  constructor(
    private readonly connectionChecker: ConnectionCheckerService,
    @Inject(CONNECTION_HISTORY_REPOSITORY)
    private readonly historyRepository: IConnectionHistoryRepository,
  ) {}

  /**
   * 接続状態をチェックして履歴に記録
   */
  async execute(
    command: CheckConnectionStatusCommand,
    institutions: IInstitutionInfo[],
  ): Promise<ConnectionStatusResult[]> {
    try {
      this.logger.log('接続状態チェック開始');

      // 単一の金融機関をチェックするか、全てチェックするか
      const targetInstitutions = command.institutionId
        ? institutions.filter((inst) => inst.id === command.institutionId)
        : institutions;

      if (targetInstitutions.length === 0) {
        this.logger.warn('チェック対象の金融機関が見つかりません');
        return [];
      }

      // 接続チェック実行（並列処理、最大5件同時）
      const checkResults =
        await this.connectionChecker.checkMultipleConnections(
          targetInstitutions.map((inst) => ({
            id: inst.id,
            name: inst.name,
            type: inst.type,
            apiClient: inst.apiClient,
          })),
        );

      // 金融機関情報をMapに変換（IDで高速検索）
      const institutionMap = new Map(
        targetInstitutions.map((inst) => [inst.id, inst]),
      );

      // 履歴エンティティに変換
      // 配列順序に依存せず、institutionIdで検索
      const histories = checkResults
        .map((result) => {
          const institution = institutionMap.get(result.institutionId);
          if (!institution) {
            this.logger.warn(
              `チェック結果に対応する金融機関が見つかりませんでした: ${result.institutionId}`,
            );
            return null;
          }
          return ConnectionHistory.create(
            result.institutionId,
            institution.name,
            institution.type,
            result.status,
            result.checkedAt,
            result.responseTime,
            result.errorMessage,
            result.errorCode,
          );
        })
        .filter((history): history is ConnectionHistory => history !== null);

      // 履歴を保存
      await this.historyRepository.saveMany(histories);

      // 結果を返却用の形式に変換
      const results = histories.map((history) => this.toResult(history));

      // エラーがあった場合はログ出力
      const errorCount = results.filter((r) => r.errorMessage).length;
      if (errorCount > 0) {
        this.logger.warn(`${errorCount}件の金融機関で接続エラーが発生しました`);
      }

      this.logger.log(
        `接続状態チェック完了: ${results.length}件中${results.length - errorCount}件成功`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        '接続状態チェック中にエラーが発生しました',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * ConnectionHistoryをConnectionStatusResultに変換
   */
  private toResult(history: ConnectionHistory): ConnectionStatusResult {
    return {
      institutionId: history.institutionId,
      institutionName: history.institutionName,
      institutionType: history.institutionType,
      status: history.status,
      checkedAt: history.checkedAt.toISOString(),
      responseTime: history.responseTime,
      errorMessage: history.errorMessage,
      errorCode: history.errorCode,
    };
  }
}
