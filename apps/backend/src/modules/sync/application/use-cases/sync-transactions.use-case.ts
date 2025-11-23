import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { SyncHistory } from '../../domain/entities/sync-history.entity';
import { SYNC_HISTORY_REPOSITORY } from '../../sync.tokens';
import { IncrementalSyncStrategy } from '../../domain/strategies/incremental-sync.strategy';
import type { ICreditCardRepository } from '../../../credit-card/domain/repositories/credit-card.repository.interface';
import type { ISecuritiesAccountRepository } from '../../../securities/domain/repositories/securities.repository.interface';
import { RefreshCreditCardDataUseCase } from '../../../credit-card/application/use-cases/refresh-credit-card-data.use-case';
import { FetchSecurityTransactionsUseCase } from '../../../securities/application/use-cases/fetch-security-transactions.use-case';
import { CREDIT_CARD_REPOSITORY } from '../../../credit-card/credit-card.tokens';
import { SECURITIES_ACCOUNT_REPOSITORY } from '../../../securities/securities.tokens';

/**
 * 同期実行入力
 */
export interface SyncTransactionsInput {
  /** 強制的に全データを取得するか */
  forceFullSync?: boolean;
}

/**
 * 同期実行結果
 */
export interface SyncTransactionsOutput {
  /** 同期履歴 */
  syncHistory: SyncHistory;
  /** 成功した金融機関数 */
  successCount: number;
  /** 失敗した金融機関数 */
  failureCount: number;
  /** 新規取引数 */
  newTransactionsCount: number;
}

/**
 * 取引同期ユースケース
 * クレジットカードと証券口座から取引履歴を自動的に同期する
 */
@Injectable()
export class SyncTransactionsUseCase {
  private readonly logger = new Logger(SyncTransactionsUseCase.name);

  constructor(
    @Inject(SYNC_HISTORY_REPOSITORY)
    private readonly syncHistoryRepository: ISyncHistoryRepository,
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: ICreditCardRepository,
    @Inject(SECURITIES_ACCOUNT_REPOSITORY)
    private readonly securitiesAccountRepository: ISecuritiesAccountRepository,
    private readonly incrementalSyncStrategy: IncrementalSyncStrategy,
    private readonly refreshCreditCardDataUseCase: RefreshCreditCardDataUseCase,
    private readonly fetchSecurityTransactionsUseCase: FetchSecurityTransactionsUseCase,
  ) {}

  /**
   * 同期を実行
   */
  async execute(
    _input: SyncTransactionsInput = {},
  ): Promise<SyncTransactionsOutput> {
    this.logger.log('Starting transaction sync...');

    // 接続済みの金融機関を取得
    const creditCards = await this.creditCardRepository.findAll();
    const securitiesAccounts = await this.securitiesAccountRepository.findAll();

    const connectedCreditCards = creditCards.filter((card) => card.isConnected);
    const connectedSecurities = securitiesAccounts.filter(
      (account) => account.isConnected,
    );

    const totalInstitutions =
      connectedCreditCards.length + connectedSecurities.length;

    if (totalInstitutions === 0) {
      this.logger.warn('No connected institutions found. Skipping sync.');
      // このUseCaseは非推奨であるため、エラーをスローします。
      throw new Error(
        'SyncTransactionsUseCase is deprecated and does not support this path. Please use SyncAllTransactionsUseCase.',
      );
    }

    // このUseCaseは古い実装であり、非推奨です
    // 新しいSyncAllTransactionsUseCaseの使用を推奨します
    this.logger.error(
      'sync-transactions.use-case.ts は非推奨です。SyncAllTransactionsUseCaseを使用してください。',
    );

    // このUseCaseは非推奨であるため、エラーをスローします。
    throw new Error(
      'SyncTransactionsUseCase is deprecated. Please use SyncAllTransactionsUseCase.',
    );
  }
}
