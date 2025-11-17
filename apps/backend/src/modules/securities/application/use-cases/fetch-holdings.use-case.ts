import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { HoldingEntity } from '../../domain/entities/holding.entity';
import type {
  ISecuritiesAccountRepository,
  IHoldingRepository,
} from '../../domain/repositories/securities.repository.interface';
import type { ISecuritiesAPIClient } from '../../infrastructure/adapters/securities-api.adapter.interface';
import type { ICryptoService } from '../../../institution/domain/services/crypto.service.interface';
import {
  SECURITIES_ACCOUNT_REPOSITORY,
  HOLDING_REPOSITORY,
  SECURITIES_API_CLIENT,
} from '../../securities.tokens';
import { CRYPTO_SERVICE } from '../../../institution/institution.tokens';

export interface FetchHoldingsInput {
  accountId: string;
  forceRefresh?: boolean; // 強制的にAPIから最新データを取得
}

interface DecryptedCredentials {
  loginId: string;
  password: string;
  tradingPassword?: string;
}

/**
 * FetchHoldingsUseCase
 * 保有銘柄情報を取得する
 */
@Injectable()
export class FetchHoldingsUseCase {
  private readonly logger = new Logger(FetchHoldingsUseCase.name);

  constructor(
    @Inject(SECURITIES_ACCOUNT_REPOSITORY)
    private readonly accountRepository: ISecuritiesAccountRepository,
    @Inject(HOLDING_REPOSITORY)
    private readonly holdingRepository: IHoldingRepository,
    @Inject(SECURITIES_API_CLIENT)
    private readonly securitiesAPIClient: ISecuritiesAPIClient,
    @Inject(CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) {}

  async execute(input: FetchHoldingsInput): Promise<HoldingEntity[]> {
    // 1. 証券口座の存在確認
    const account = await this.accountRepository.findById(input.accountId);
    if (!account) {
      throw new NotFoundException(
        `Securities account not found: ${input.accountId}`,
      );
    }

    // 2. 強制リフレッシュの場合はAPIから取得
    if (input.forceRefresh) {
      await this.refreshHoldingsFromAPI(account.id, account.credentials);
    }

    // 3. リポジトリから保有銘柄を取得
    const holdings = await this.holdingRepository.findByAccountId(
      input.accountId,
    );

    this.logger.log(
      `Fetched ${holdings.length} holdings for account ${input.accountId}`,
    );
    return holdings;
  }

  private async refreshHoldingsFromAPI(
    accountId: string,
    credentials: ReturnType<typeof this.cryptoService.encrypt>,
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

      // APIから最新の保有銘柄を取得
      const apiHoldings = await this.securitiesAPIClient.getHoldings({
        loginId,
        password,
        tradingPassword,
        accountNumber: account.accountNumber,
      });

      // 既存の保有銘柄を取得
      const existingHoldings =
        await this.holdingRepository.findByAccountId(accountId);

      // APIの保有銘柄で更新・新規作成
      for (const apiHolding of apiHoldings) {
        const holdingEntity = this.securitiesAPIClient.mapToHoldingEntity(
          accountId,
          apiHolding,
        );

        const existing = existingHoldings.find(
          (h) => h.securityCode === holdingEntity.securityCode,
        );

        if (existing) {
          await this.holdingRepository.update(holdingEntity);
        } else {
          await this.holdingRepository.create(holdingEntity);
        }
      }

      // APIに存在しない保有銘柄（売却済み）を削除
      const apiSecurityCodes = new Set(
        apiHoldings.map(
          (h) =>
            this.securitiesAPIClient.mapToHoldingEntity(accountId, h)
              .securityCode,
        ),
      );
      for (const existing of existingHoldings) {
        if (!apiSecurityCodes.has(existing.securityCode)) {
          await this.holdingRepository.delete(existing.id);
        }
      }

      // 口座の最終同期日時を更新
      const updatedAccount = account.updateLastSyncedAt(new Date());
      await this.accountRepository.update(updatedAccount);

      this.logger.log(`Refreshed holdings from API for account ${accountId}`);
    } catch (error) {
      this.logger.error(
        `Failed to refresh holdings from API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
