import { Injectable, Logger } from '@nestjs/common';

/**
 * 差分同期結果
 */
export interface IncrementalSyncResult {
  /** 同期に成功したか */
  success: boolean;
  /** 新規取得件数 */
  newTransactionsCount: number;
  /** エラーメッセージ */
  errorMessage?: string;
}

/**
 * 金融機関同期インターフェース
 */
export interface IFinancialInstitutionSync {
  /** 金融機関タイプ */
  type: 'credit-card' | 'securities' | 'bank';
  /** 金融機関ID */
  institutionId: string;
  /** 最終同期日時 */
  lastSyncedAt: Date | null;
  /** 同期実行メソッド */
  sync(startDate?: Date, endDate?: Date): Promise<IncrementalSyncResult>;
}

/**
 * 差分同期戦略
 * 前回同期日時以降のデータのみを取得する
 */
@Injectable()
export class IncrementalSyncStrategy {
  private readonly logger = new Logger(IncrementalSyncStrategy.name);

  /**
   * 差分同期を実行
   */
  async execute(
    institution: IFinancialInstitutionSync,
  ): Promise<IncrementalSyncResult> {
    try {
      // 前回同期日時を取得
      const lastSyncedAt = institution.lastSyncedAt;

      // 期間を設定
      const endDate = new Date();
      const startDate = lastSyncedAt || this.getDefaultStartDate();

      this.logger.log(
        `Syncing ${institution.type} ${institution.institutionId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
      );

      // 同期実行
      const result = await institution.sync(startDate, endDate);

      this.logger.log(
        `Sync completed for ${institution.type} ${institution.institutionId}: ${result.newTransactionsCount} new transactions`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Sync failed for ${institution.type} ${institution.institutionId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        success: false,
        newTransactionsCount: 0,
        errorMessage:
          error instanceof Error ? error.message : 'Unknown sync error',
      };
    }
  }

  /**
   * デフォルトの開始日（過去3ヶ月）を取得
   */
  private getDefaultStartDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date;
  }

  /**
   * 複数の金融機関を並列同期
   */
  async executeParallel(
    institutions: IFinancialInstitutionSync[],
  ): Promise<IncrementalSyncResult[]> {
    const results = await Promise.all(
      institutions.map((institution) => this.execute(institution)),
    );
    return results;
  }
}
