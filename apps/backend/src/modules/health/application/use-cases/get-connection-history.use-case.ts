import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IConnectionHistoryRepository } from '../../domain/repositories/connection-history.repository.interface';
import { CONNECTION_HISTORY_REPOSITORY } from '../../domain/repositories/connection-history.repository.interface';
import { ConnectionHistory } from '../../domain/entities/connection-history.entity';
import type {
  ConnectionStatusType,
  InstitutionType,
} from '../../domain/types/connection.types';
import { isPublicConnectionStatus } from '../../domain/types/connection.types';

export interface GetConnectionHistoryQuery {
  institutionId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  latestOnly?: boolean; // 最新の履歴のみ取得
}

export interface ConnectionHistoryResult {
  id: string;
  institutionId: string;
  institutionName: string;
  institutionType: InstitutionType;
  status: ConnectionStatusType;
  checkedAt: string;
  responseTime: number;
  errorMessage?: string;
  errorCode?: string;
}

/**
 * 接続履歴取得のユースケース
 * FR-004: バックグラウンド接続確認で使用
 */
@Injectable()
export class GetConnectionHistoryUseCase {
  private readonly logger = new Logger(GetConnectionHistoryUseCase.name);

  constructor(
    @Inject(CONNECTION_HISTORY_REPOSITORY)
    private readonly historyRepository: IConnectionHistoryRepository,
  ) {}

  /**
   * 接続履歴を取得
   * クエリパラメータの組み合わせを網羅的に処理
   */
  async execute(
    query: GetConnectionHistoryQuery,
  ): Promise<ConnectionHistoryResult[]> {
    try {
      let histories: ConnectionHistory[];

      // latestOnlyが指定されている場合
      if (query.latestOnly) {
        if (query.institutionId) {
          // 特定の金融機関の最新履歴
          this.logger.debug(`最新の接続履歴取得: ${query.institutionId}`);
          const latest = await this.historyRepository.findLatestByInstitutionId(
            query.institutionId,
          );
          histories = latest ? [latest] : [];
        } else {
          // 全金融機関の最新履歴
          this.logger.debug('全金融機関の最新接続履歴を取得');
          histories = await this.historyRepository.findAllLatest();
        }
      }
      // 期間指定がある場合
      else if (query.startDate && query.endDate) {
        if (query.institutionId) {
          // 特定の金融機関の期間指定
          this.logger.debug(
            `期間指定での接続履歴取得: ${query.institutionId} (${query.startDate.toISOString()} - ${query.endDate.toISOString()})`,
          );
          histories =
            await this.historyRepository.findByInstitutionIdAndDateRange(
              query.institutionId,
              query.startDate,
              query.endDate,
            );
        } else {
          // 全金融機関の期間指定（全履歴を取得後フィルタ）
          // TODO(パフォーマンス改善): 履歴データが大量になると性能問題の可能性
          // 将来的にDB移行時は、リポジトリ層で効率的な期間フィルタリング
          // （例: findAllByDateRange）を実装することが重要
          this.logger.debug(
            `全金融機関の期間指定履歴取得: ${query.startDate.toISOString()} - ${query.endDate.toISOString()}`,
          );
          this.logger.warn(
            '全履歴をメモリにロード後フィルタリング（データ量増加時は性能注意）',
          );
          const allHistories = await this.historyRepository.findAll();
          histories = allHistories.filter(
            (h) =>
              h.checkedAt >= query.startDate! && h.checkedAt <= query.endDate!,
          );
        }

        // limitを適用
        if (query.limit && query.limit > 0) {
          histories = histories.slice(0, query.limit);
        }
      }
      // institutionIdのみ指定
      else if (query.institutionId) {
        // 特定の金融機関の全履歴を取得
        this.logger.debug(`接続履歴取得: ${query.institutionId}`);
        const allHistories = await this.historyRepository.findAll();
        histories = allHistories.filter(
          (h) => h.institutionId === query.institutionId,
        );
        // limitを適用
        if (query.limit && query.limit > 0) {
          histories = histories.slice(0, query.limit);
        }
      }
      // 条件なし（全履歴）
      else {
        this.logger.debug('全接続履歴を取得');
        histories = await this.historyRepository.findAll(query.limit);
      }

      this.logger.debug(`${histories.length}件の接続履歴を取得しました`);

      return histories.map((history) => this.toResult(history));
    } catch (error) {
      this.logger.error(
        '接続履歴の取得中にエラーが発生しました',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * 全金融機関の最新の接続状態を取得
   */
  async getLatestStatuses(): Promise<ConnectionHistoryResult[]> {
    try {
      this.logger.debug('全金融機関の最新接続状態を取得');

      const histories = await this.historyRepository.findAllLatest();

      this.logger.debug(`${histories.length}件の最新接続状態を取得しました`);

      return histories.map((history) => this.toResult(history));
    } catch (error) {
      this.logger.error(
        '最新接続状態の取得中にエラーが発生しました',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * ConnectionHistoryをConnectionHistoryResultに変換
   */
  private toResult(history: ConnectionHistory): ConnectionHistoryResult {
    // 型ガードで安全に型変換
    if (!isPublicConnectionStatus(history.status)) {
      this.logger.warn(
        `内部ステータス '${history.status}' は公開APIでは使用できません。DISCONNECTEDとして扱います。`,
      );
      // 内部ステータス（CHECKING等）はDISCONNECTEDとして扱う
      return {
        id: history.id,
        institutionId: history.institutionId,
        institutionName: history.institutionName,
        institutionType: history.institutionType,
        status: 'DISCONNECTED',
        checkedAt: history.checkedAt.toISOString(),
        responseTime: history.responseTime,
        errorMessage: history.errorMessage,
        errorCode: history.errorCode,
      };
    }

    return {
      id: history.id,
      institutionId: history.institutionId,
      institutionName: history.institutionName,
      institutionType: history.institutionType,
      status: history.status, // 型ガードにより安全に代入可能
      checkedAt: history.checkedAt.toISOString(),
      responseTime: history.responseTime,
      errorMessage: history.errorMessage,
      errorCode: history.errorCode,
    };
  }
}
