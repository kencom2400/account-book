import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IInstitutionInfo } from '../../domain/adapters/api-client.interface';

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
 * 金融機関情報の集約サービス
 * FR-004: 複数モジュールから金融機関情報を統合して取得
 *
 * 目的:
 * - 関心の分離: コントローラーやユースケースが直接リポジトリに依存しないようにする
 * - コードの重複排除: 金融機関リスト取得ロジックを一元化
 * - モジュール間の結合度低減: 公開インターフェースを通じてデータを集約
 */
@Injectable()
export class InstitutionAggregationService {
  private readonly logger = new Logger(InstitutionAggregationService.name);

  constructor(
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
   * 全ての金融機関情報を取得
   * 銀行、クレジットカード、証券口座の全てを統合して返す
   */
  async getAllInstitutions(): Promise<IInstitutionInfo[]> {
    const institutions: IInstitutionInfo[] = [];

    // 銀行を取得
    try {
      const banks = await this.institutionRepository.findAll();
      institutions.push(
        ...banks.map((bank) => ({
          id: bank.id,
          name: bank.name,
          type: 'bank' as const,
          // IBankApiAdapterはIFinancialApiClientを継承しているため、型安全
          apiClient: this.bankApiAdapter,
        })),
      );
      this.logger.debug(`${banks.length}件の銀行を取得しました`);
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
          // ICreditCardAPIClientはIFinancialApiClientを継承しているため、型安全
          apiClient: this.creditCardApiClient,
        })),
      );
      this.logger.debug(
        `${creditCards.length}件のクレジットカードを取得しました`,
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
          // ISecuritiesAPIClientはIFinancialApiClientを継承しているため、型安全
          apiClient: this.securitiesApiClient,
        })),
      );
      this.logger.debug(`${securities.length}件の証券口座を取得しました`);
    } catch (error: unknown) {
      this.logger.warn(
        '証券口座の取得に失敗しました',
        error instanceof Error ? error.stack : String(error),
      );
    }

    this.logger.debug(`合計${institutions.length}件の金融機関を取得しました`);

    return institutions;
  }

  /**
   * 特定の金融機関情報を取得
   * @param institutionId 金融機関ID
   */
  async getInstitutionById(
    institutionId: string,
  ): Promise<IInstitutionInfo | null> {
    const allInstitutions = await this.getAllInstitutions();
    return allInstitutions.find((inst) => inst.id === institutionId) || null;
  }
}
