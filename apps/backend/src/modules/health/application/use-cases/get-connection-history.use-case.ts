import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IConnectionHistoryRepository } from '../../domain/repositories/connection-history.repository.interface';
import { CONNECTION_HISTORY_REPOSITORY } from '../../domain/repositories/connection-history.repository.interface';
import { ConnectionHistory } from '../../domain/entities/connection-history.entity';

export interface GetConnectionHistoryQuery {
  institutionId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface ConnectionHistoryResult {
  id: string;
  institutionId: string;
  institutionName: string;
  institutionType: string;
  status: string;
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
   */
  async execute(
    query: GetConnectionHistoryQuery,
  ): Promise<ConnectionHistoryResult[]> {
    try {
      let histories: ConnectionHistory[];

      if (query.institutionId && query.startDate && query.endDate) {
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
      } else if (query.institutionId) {
        // 特定の金融機関の最新履歴のみ
        this.logger.debug(`最新の接続履歴取得: ${query.institutionId}`);
        const latest = await this.historyRepository.findLatestByInstitutionId(
          query.institutionId,
        );
        histories = latest ? [latest] : [];
      } else {
        // 全金融機関の履歴
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
    return {
      id: history.id,
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
