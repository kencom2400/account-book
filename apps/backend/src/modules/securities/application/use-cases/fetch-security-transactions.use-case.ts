import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SecurityTransactionEntity } from '../../domain/entities/security-transaction.entity';
import type {
  ISecuritiesAccountRepository,
  ISecurityTransactionRepository,
} from '../../domain/repositories/securities.repository.interface';
import type { ISecuritiesAPIClient } from '../../infrastructure/adapters/securities-api.adapter.interface';
import type { ICryptoService } from '../../../institution/domain/services/crypto.service.interface';
import {
  SECURITIES_ACCOUNT_REPOSITORY,
  SECURITY_TRANSACTION_REPOSITORY,
  SECURITIES_API_CLIENT,
} from '../../securities.tokens';
import { CRYPTO_SERVICE } from '../../../institution/institution.tokens';

export interface FetchSecurityTransactionsInput {
  accountId: string;
  startDate?: Date;
  endDate?: Date;
  forceRefresh?: boolean; // 強制的にAPIから最新データを取得
  abortSignal?: AbortSignal; // キャンセル用シグナル
}

interface DecryptedCredentials {
  loginId: string;
  password: string;
  tradingPassword?: string;
}

/**
 * FetchSecurityTransactionsUseCase
 * 証券取引履歴を取得する
 */
@Injectable()
export class FetchSecurityTransactionsUseCase {
  private readonly logger = new Logger(FetchSecurityTransactionsUseCase.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(SECURITIES_ACCOUNT_REPOSITORY)
    private readonly accountRepository: ISecuritiesAccountRepository,
    @Inject(SECURITY_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ISecurityTransactionRepository,
    @Inject(SECURITIES_API_CLIENT)
    private readonly securitiesAPIClient: ISecuritiesAPIClient,
    @Inject(CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) {}

  async execute(
    input: FetchSecurityTransactionsInput,
  ): Promise<SecurityTransactionEntity[]> {
    // キャンセルチェック
    if (input.abortSignal?.aborted) {
      throw new Error('Transaction fetch was cancelled');
    }

    // 1. 証券口座の存在確認
    const account = await this.accountRepository.findById(input.accountId);
    if (!account) {
      throw new NotFoundException(
        `Securities account not found: ${input.accountId}`,
      );
    }

    // キャンセルチェック
    if (input.abortSignal?.aborted) {
      throw new Error('Transaction fetch was cancelled');
    }

    // 2. 強制リフレッシュの場合はAPIから取得
    if (input.forceRefresh) {
      await this.refreshTransactionsFromAPI(
        account.id,
        account.credentials,
        input.startDate,
        input.endDate,
      );
    }

    // 3. リポジトリから取引履歴を取得
    let transactions: SecurityTransactionEntity[];
    if (input.startDate && input.endDate) {
      transactions =
        await this.transactionRepository.findByAccountIdAndDateRange(
          input.accountId,
          input.startDate,
          input.endDate,
        );
    } else {
      transactions = await this.transactionRepository.findByAccountId(
        input.accountId,
      );
    }

    this.logger.log(
      `Fetched ${transactions.length} transactions for account ${input.accountId}`,
    );
    return transactions;
  }

  private async refreshTransactionsFromAPI(
    accountId: string,
    credentials: ReturnType<typeof this.cryptoService.encrypt>,
    startDate?: Date,
    endDate?: Date,
  ): Promise<void> {
    try {
      // 認証情報を復号化
      const decryptedData = this.cryptoService.decrypt(credentials);
      const { loginId, password, tradingPassword } = JSON.parse(
        decryptedData,
      ) as DecryptedCredentials;

      const account = await this.accountRepository.findById(accountId);
      if (!account) {
        throw new NotFoundException(`Account not found: ${accountId}`);
      }

      // デフォルトの期間設定（指定がない場合は過去3ヶ月）
      const end = endDate || new Date();
      const start =
        startDate || new Date(end.getFullYear(), end.getMonth() - 3, 1);

      // APIから取引履歴を取得
      const apiTransactions = await this.securitiesAPIClient.getTransactions(
        {
          loginId,
          password,
          tradingPassword,
          accountNumber: account.accountNumber,
        },
        start,
        end,
      );

      // データベーストランザクションを使用して、
      // 複数の取引保存と口座更新をアトミックに実行
      await this.dataSource.transaction(async (entityManager) => {
        // トランザクション内で口座を再取得して競合状態を防止
        const accountToUpdate = await this.accountRepository.findById(
          accountId,
          entityManager,
        );
        if (!accountToUpdate) {
          throw new NotFoundException(
            `Account not found within transaction: ${accountId}`,
          );
        }

        // 取引履歴を保存（重複チェック）
        // Promise.allで並列処理化してパフォーマンスを向上
        await Promise.all(
          apiTransactions.map(async (apiTx) => {
            const transactionEntity =
              this.securitiesAPIClient.mapToTransactionEntity(accountId, apiTx);

            // 既存の取引をIDで確認（APIから返されるIDを使用）
            const existing = await this.transactionRepository.findById(
              transactionEntity.id,
              entityManager,
            );

            if (!existing) {
              await this.transactionRepository.create(
                transactionEntity,
                entityManager,
              );
            }
          }),
        );

        // 口座の最終同期日時を更新
        const updatedAccount = accountToUpdate.updateLastSyncedAt(new Date());
        await this.accountRepository.update(updatedAccount, entityManager);
      });

      this.logger.log(
        `Refreshed transactions from API for account ${accountId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to refresh transactions from API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
