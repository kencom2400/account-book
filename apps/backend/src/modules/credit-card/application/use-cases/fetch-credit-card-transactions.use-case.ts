import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import { CreditCardTransactionEntity } from '../../domain/entities/credit-card-transaction.entity';
import type {
  ICreditCardRepository,
  ICreditCardTransactionRepository,
} from '../../domain/repositories/credit-card.repository.interface';
import type { ICreditCardAPIClient } from '../../infrastructure/adapters/credit-card-api.adapter.interface';
import type { ICryptoService } from '../../../institution/domain/services/crypto.service.interface';
import {
  CREDIT_CARD_REPOSITORY,
  CREDIT_CARD_TRANSACTION_REPOSITORY,
  CREDIT_CARD_API_CLIENT,
} from '../../credit-card.tokens';
import { CRYPTO_SERVICE } from '../../../institution/institution.tokens';

export interface FetchCreditCardTransactionsInput {
  creditCardId: string;
  startDate?: Date;
  endDate?: Date;
  forceRefresh?: boolean; // APIから強制的に再取得
}

/**
 * FetchCreditCardTransactionsUseCase
 * クレジットカードの取引履歴を取得する
 */
@Injectable()
export class FetchCreditCardTransactionsUseCase {
  private readonly logger = new Logger(FetchCreditCardTransactionsUseCase.name);

  constructor(
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: ICreditCardRepository,
    @Inject(CREDIT_CARD_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ICreditCardTransactionRepository,
    @Inject(CREDIT_CARD_API_CLIENT)
    private readonly creditCardAPIClient: ICreditCardAPIClient,
    @Inject(CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) {}

  async execute(
    input: FetchCreditCardTransactionsInput,
  ): Promise<CreditCardTransactionEntity[]> {
    // 1. クレジットカードが存在するか確認
    const creditCard = await this.creditCardRepository.findById(
      input.creditCardId,
    );

    if (!creditCard) {
      throw new NotFoundException(
        `Credit card not found with ID: ${input.creditCardId}`,
      );
    }

    // 2. 日付範囲の設定（デフォルトは当月）
    const endDate = input.endDate || new Date();
    const startDate =
      input.startDate || new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    // 3. 強制リフレッシュまたは接続済みの場合はAPIから取得
    if (input.forceRefresh || creditCard.isConnected) {
      try {
        await this.refreshTransactionsFromAPI(creditCard, startDate, endDate);

        // 最終同期日時を更新
        const updatedCard = creditCard.updateLastSyncedAt(new Date());
        await this.creditCardRepository.save(updatedCard);
      } catch (error) {
        this.logger.error(
          `Failed to refresh transactions from API: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined,
        );
        // API取得失敗時はローカルのデータを返す
      }
    }

    // 4. ローカルストレージから取引を取得
    const transactions =
      await this.transactionRepository.findByCreditCardIdAndDateRange(
        input.creditCardId,
        startDate,
        endDate,
      );

    return transactions;
  }

  private async refreshTransactionsFromAPI(
    creditCard: CreditCardEntity,
    startDate: Date,
    endDate: Date,
  ): Promise<void> {
    // 認証情報を復号化
    const decryptedData = this.cryptoService.decrypt(creditCard.credentials);

    let credentials;
    try {
      credentials = JSON.parse(decryptedData);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to parse credentials for card ${creditCard.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    // APIから取引を取得
    const apiTransactions = await this.creditCardAPIClient.getTransactions(
      credentials,
      startDate,
      endDate,
    );

    // エンティティに変換して保存
    const transactionEntities = apiTransactions.map((tx) =>
      this.creditCardAPIClient.mapToTransactionEntity(creditCard.id, tx),
    );

    if (transactionEntities.length > 0) {
      await this.transactionRepository.saveMany(transactionEntities);
    }
  }
}
