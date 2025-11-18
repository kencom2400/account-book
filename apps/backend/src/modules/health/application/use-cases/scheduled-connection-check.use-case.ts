import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CheckConnectionStatusUseCase } from './check-connection-status.use-case';
import type {
  IInstitutionInfo,
  IFinancialApiClient,
} from '../../domain/adapters/api-client.interface';

// 金融機関モジュールのリポジトリとAPIクライアント
import {
  INSTITUTION_REPOSITORY,
  BANK_API_ADAPTER,
} from '../../../institution/institution.tokens';
import type { IInstitutionRepository } from '../../../institution/domain/repositories/institution.repository.interface';
import type { IBankApiAdapter } from '../../../institution/domain/adapters/bank-api.adapter.interface';
import {
  CREDIT_CARD_REPOSITORY,
  CREDIT_CARD_API_CLIENT,
} from '../../../credit-card/credit-card.tokens';
import type { ICreditCardRepository } from '../../../credit-card/domain/repositories/credit-card.repository.interface';
import type { ICreditCardAPIClient } from '../../../credit-card/infrastructure/adapters/credit-card-api.adapter.interface';
import {
  SECURITIES_ACCOUNT_REPOSITORY,
  SECURITIES_API_CLIENT,
} from '../../../securities/securities.tokens';
import type { ISecuritiesAccountRepository } from '../../../securities/domain/repositories/securities.repository.interface';
import type { ISecuritiesAPIClient } from '../../../securities/infrastructure/adapters/securities-api.adapter.interface';

/**
 * 定期的な接続チェックのユースケース
 * FR-004: バックグラウンド接続確認で使用
 * 要件: 1時間ごとに自動実行
 */
@Injectable()
export class ScheduledConnectionCheckUseCase {
  private readonly logger = new Logger(ScheduledConnectionCheckUseCase.name);
  private isRunning = false;

  constructor(
    private readonly checkConnectionStatusUseCase: CheckConnectionStatusUseCase,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: ICreditCardRepository,
    @Inject(SECURITIES_ACCOUNT_REPOSITORY)
    private readonly securitiesRepository: ISecuritiesAccountRepository,
    @Inject(BANK_API_ADAPTER)
    private readonly bankApiAdapter: IBankApiAdapter,
    @Inject(CREDIT_CARD_API_CLIENT)
    private readonly creditCardApiClient: ICreditCardAPIClient,
    @Inject(SECURITIES_API_CLIENT)
    private readonly securitiesApiClient: ISecuritiesAPIClient,
  ) {}

  /**
   * 1時間ごとに実行される定期チェック
   * Cronパターン: 毎時0分に実行
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleScheduledCheck(): Promise<void> {
    // 既に実行中の場合はスキップ（二重実行防止）
    if (this.isRunning) {
      this.logger.warn('前回のチェックがまだ実行中のため、スキップします');
      return;
    }

    try {
      this.isRunning = true;
      this.logger.log('定期接続チェックを開始します');

      // 金融機関リストを取得
      const institutions = await this.getAllInstitutions();

      if (institutions.length === 0) {
        this.logger.warn(
          '登録されている金融機関がありません。チェックをスキップします。',
        );
        return;
      }

      // 全金融機関をチェック
      const results = await this.checkConnectionStatusUseCase.execute(
        {},
        institutions,
      );

      const errorCount = results.filter((r) => r.errorMessage).length;

      if (errorCount > 0) {
        this.logger.warn(
          `定期接続チェック完了: ${errorCount}/${results.length}件で問題が検出されました`,
        );
        // TODO: FR-005 (通知機能) を実装後に通知を送信
      } else {
        this.logger.log(
          `定期接続チェック完了: 全${results.length}件の金融機関は正常です`,
        );
      }
    } catch (error) {
      this.logger.error(
        '定期接続チェック中にエラーが発生しました',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 登録されている全金融機関を取得
   * TODO: この処理を専用のサービスに切り出す（Gemini指摘対応）
   */
  private async getAllInstitutions(): Promise<IInstitutionInfo[]> {
    const institutions: IInstitutionInfo[] = [];

    // 銀行を取得
    try {
      const banks = await this.institutionRepository.findAll();
      institutions.push(
        ...banks.map((bank) => ({
          id: bank.id,
          name: bank.name,
          type: 'bank' as const,
          // TODO: 各APIアダプターにhealthCheckメソッドを追加

          apiClient: this.bankApiAdapter as unknown as IFinancialApiClient,
        })),
      );
    } catch (error: unknown) {
      this.logger.warn(
        '銀行の取得に失敗しました',
        error instanceof Error ? error.stack : String(error),
      );
    }

    // クレジットカードを取得
    try {
      const creditCards = await this.creditCardRepository.findAll();
      institutions.push(
        ...creditCards.map((card) => ({
          id: card.id,
          name: card.issuer,
          type: 'credit-card' as const,
          // TODO: ICreditCardAPIClientにhealthCheckメソッドを追加

          apiClient: this.creditCardApiClient as unknown as IFinancialApiClient,
        })),
      );
    } catch (error: unknown) {
      this.logger.warn(
        'クレジットカードの取得に失敗しました',
        error instanceof Error ? error.stack : String(error),
      );
    }

    // 証券口座を取得
    try {
      const securities = await this.securitiesRepository.findAll();
      institutions.push(
        ...securities.map((sec) => ({
          id: sec.id,
          name: sec.securitiesCompanyName,
          type: 'securities' as const,
          // TODO: ISecuritiesAPIClientにhealthCheckメソッドを追加

          apiClient: this.securitiesApiClient as unknown as IFinancialApiClient,
        })),
      );
    } catch (error: unknown) {
      this.logger.warn(
        '証券口座の取得に失敗しました',
        error instanceof Error ? error.stack : String(error),
      );
    }

    return institutions;
  }

  /**
   * 手動で定期チェックをトリガー（テスト用）
   */
  async triggerManualCheck(institutions: IInstitutionInfo[]): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('チェックが既に実行中です');
      return;
    }

    try {
      this.isRunning = true;
      this.logger.log('手動での接続チェックを開始します');

      // 全金融機関をチェック
      await this.checkConnectionStatusUseCase.execute({}, institutions);

      this.logger.log('手動での接続チェックが完了しました');
    } catch (error) {
      this.logger.error(
        '手動チェック中にエラーが発生しました',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 現在チェックが実行中かどうかを返す
   */
  isCheckRunning(): boolean {
    return this.isRunning;
  }
}
