import {
  Injectable,
  Logger,
  BadGatewayException,
  Inject,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { subMonths } from 'date-fns';
import { SecuritiesAccountEntity } from '../../domain/entities/securities-account.entity';
import type {
  ISecuritiesAccountRepository,
  IHoldingRepository,
  ISecurityTransactionRepository,
} from '../../domain/repositories/securities.repository.interface';
import type { ISecuritiesAPIClient } from '../../infrastructure/adapters/securities-api.adapter.interface';
import type { ICryptoService } from '../../../institution/domain/services/crypto.service.interface';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';
import {
  SECURITIES_ACCOUNT_REPOSITORY,
  HOLDING_REPOSITORY,
  SECURITY_TRANSACTION_REPOSITORY,
  SECURITIES_API_CLIENT,
} from '../../securities.tokens';
import { CRYPTO_SERVICE } from '../../../institution/institution.tokens';

export interface ConnectSecuritiesAccountInput {
  securitiesCompanyName: string;
  accountNumber: string;
  accountType: 'general' | 'specific' | 'nisa' | 'tsumitate-nisa' | 'isa';
  loginId: string;
  password: string;
  tradingPassword?: string; // 取引暗証番号（オプション）
}

/**
 * ConnectSecuritiesAccountUseCase
 * 証券口座との接続を確立する
 */
@Injectable()
export class ConnectSecuritiesAccountUseCase {
  private readonly logger = new Logger(ConnectSecuritiesAccountUseCase.name);

  constructor(
    @Inject(SECURITIES_ACCOUNT_REPOSITORY)
    private readonly accountRepository: ISecuritiesAccountRepository,
    @Inject(HOLDING_REPOSITORY)
    private readonly holdingRepository: IHoldingRepository,
    @Inject(SECURITY_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ISecurityTransactionRepository,
    @Inject(SECURITIES_API_CLIENT)
    private readonly securitiesAPIClient: ISecuritiesAPIClient,
    @Inject(CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) {}

  async execute(
    input: ConnectSecuritiesAccountInput,
  ): Promise<SecuritiesAccountEntity> {
    // 1. 認証情報を暗号化
    const credentials = this.encryptCredentials(
      input.loginId,
      input.password,
      input.tradingPassword,
    );

    // 2. 証券会社API接続テスト
    const apiCredentials = {
      loginId: input.loginId,
      password: input.password,
      tradingPassword: input.tradingPassword,
      accountNumber: input.accountNumber,
    };

    const connectionResult =
      await this.securitiesAPIClient.testConnection(apiCredentials);

    if (!connectionResult.success) {
      throw new BadGatewayException(
        `Failed to connect to securities API: ${connectionResult.error}`,
      );
    }

    // 3. 口座情報を取得
    const accountInfo =
      await this.securitiesAPIClient.getAccountInfo(apiCredentials);

    // 4. SecuritiesAccountエンティティを作成
    const account = new SecuritiesAccountEntity(
      this.generateId(),
      input.securitiesCompanyName,
      input.accountNumber,
      input.accountType,
      credentials,
      true, // 接続成功
      new Date(), // 最終同期日時
      accountInfo.totalEvaluationAmount,
      accountInfo.cashBalance,
      new Date(),
      new Date(),
    );

    // 5. 初回の保有銘柄を取得して保存（必須）
    await this.fetchInitialHoldings(account.id, apiCredentials);

    // 6. リポジトリに保存（保有銘柄取得成功後）
    await this.accountRepository.create(account);

    // 7. 初回の取引履歴を取得して保存（過去3ヶ月、失敗しても続行）
    await this.fetchInitialTransactions(account.id, apiCredentials);

    return account;
  }

  private encryptCredentials(
    loginId: string,
    password: string,
    tradingPassword?: string,
  ): EncryptedCredentials {
    const data = JSON.stringify({
      loginId,
      password,
      tradingPassword: tradingPassword || null,
    });
    return this.cryptoService.encrypt(data);
  }

  private async fetchInitialHoldings(
    accountId: string,
    credentials: {
      loginId: string;
      password: string;
      tradingPassword?: string;
      accountNumber: string;
    },
  ): Promise<void> {
    const holdings = await this.securitiesAPIClient.getHoldings(credentials);

    const holdingEntities = holdings.map((holding) =>
      this.securitiesAPIClient.mapToHoldingEntity(accountId, holding),
    );

    for (const holding of holdingEntities) {
      await this.holdingRepository.create(holding);
    }

    this.logger.log(`Fetched ${holdingEntities.length} initial holdings`);
  }

  private async fetchInitialTransactions(
    accountId: string,
    credentials: {
      loginId: string;
      password: string;
      tradingPassword?: string;
      accountNumber: string;
    },
  ): Promise<void> {
    const endDate = new Date();
    const startDate = subMonths(endDate, 3); // 過去3ヶ月

    try {
      const transactions = await this.securitiesAPIClient.getTransactions(
        credentials,
        startDate,
        endDate,
      );

      const transactionEntities = transactions.map((tx) =>
        this.securitiesAPIClient.mapToTransactionEntity(accountId, tx),
      );

      for (const transaction of transactionEntities) {
        await this.transactionRepository.create(transaction);
      }

      this.logger.log(
        `Fetched ${transactionEntities.length} initial transactions`,
      );
    } catch (error) {
      // 初回取得失敗はログに記録して続行
      // 注意: アカウントは接続済みとして作成されるが、取引履歴は不完全な状態になる
      this.logger.warn(
        `Failed to fetch initial transactions for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}. Account will be created but transaction history may be incomplete.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private generateId(): string {
    return `sec_${randomUUID()}`;
  }
}
