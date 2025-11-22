/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ISyncHistoryRepository } from '../../domain/repositories/sync-history.repository.interface';
import { SyncHistoryEntity } from '../../domain/entities/sync-history.entity';
import { SYNC_HISTORY_REPOSITORY } from '../../sync.tokens';
import { IncrementalSyncStrategy } from '../strategies/incremental-sync.strategy';
import type { ICreditCardRepository } from '../../../credit-card/domain/repositories/credit-card.repository.interface';
import type { ISecuritiesAccountRepository } from '../../../securities/domain/repositories/securities-account.repository.interface';
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
  syncHistory: SyncHistoryEntity;
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
    input: SyncTransactionsInput = {},
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
      const emptySyncHistory = SyncHistoryEntity.create(0)
        .start()
        .complete(0, 0, 0);
      await this.syncHistoryRepository.create(emptySyncHistory);
      return {
        syncHistory: emptySyncHistory,
        successCount: 0,
        failureCount: 0,
        newTransactionsCount: 0,
      };
    }

    // 同期履歴を作成
    let syncHistory = SyncHistoryEntity.create(totalInstitutions);
    syncHistory = await this.syncHistoryRepository.create(syncHistory);

    // 同期開始
    syncHistory = syncHistory.start();
    syncHistory = await this.syncHistoryRepository.update(syncHistory);

    let successCount = 0;
    let failureCount = 0;
    let totalNewTransactions = 0;

    // クレジットカードの同期
    for (const creditCard of connectedCreditCards) {
      try {
        this.logger.log(`Syncing credit card: ${creditCard.id}`);

        const result = await this.refreshCreditCardDataUseCase.execute({
          creditCardId: creditCard.id,
        });

        if (result.transactions && result.transactions.length > 0) {
          // 前回同期日時以降の新規取引をカウント
          const lastSyncedAt = creditCard.lastSyncedAt;
          const newTransactions = lastSyncedAt
            ? result.transactions.filter(
                (tx) => new Date(tx.date) > lastSyncedAt,
              )
            : result.transactions;

          totalNewTransactions += newTransactions.length;
        }

        successCount++;
        this.logger.log(`Credit card sync completed: ${creditCard.id}`);
      } catch (error) {
        failureCount++;
        this.logger.error(
          `Credit card sync failed: ${creditCard.id} - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    // 証券口座の同期
    for (const account of connectedSecurities) {
      try {
        this.logger.log(`Syncing securities account: ${account.id}`);

        const startDate = input.forceFullSync
          ? undefined
          : account.lastSyncedAt || undefined;

        const transactions =
          await this.fetchSecurityTransactionsUseCase.execute({
            accountId: account.id,
            forceRefresh: true,
            startDate,
          });

        // 前回同期日時以降の新規取引をカウント
        const lastSyncedAt = account.lastSyncedAt;
        const newTransactions = lastSyncedAt
          ? transactions.filter((tx) => new Date(tx.date) > lastSyncedAt)
          : transactions;

        totalNewTransactions += newTransactions.length;

        successCount++;
        this.logger.log(`Securities account sync completed: ${account.id}`);
      } catch (error) {
        failureCount++;
        this.logger.error(
          `Securities account sync failed: ${account.id} - ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    // 同期完了
    syncHistory = syncHistory.complete(
      successCount,
      failureCount,
      totalNewTransactions,
    );
    syncHistory = await this.syncHistoryRepository.update(syncHistory);

    this.logger.log(
      `Transaction sync completed: ${successCount} success, ${failureCount} failed, ${totalNewTransactions} new transactions`,
    );

    return {
      syncHistory,
      successCount,
      failureCount,
      newTransactionsCount: totalNewTransactions,
    };
  }
}
