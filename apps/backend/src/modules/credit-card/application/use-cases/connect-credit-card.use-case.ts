import {
  Injectable,
  Logger,
  BadGatewayException,
  Inject,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { subMonths } from 'date-fns';
import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import type {
  ICreditCardRepository,
  ICreditCardTransactionRepository,
} from '../../domain/repositories/credit-card.repository.interface';
import type { ICreditCardAPIClient } from '../../infrastructure/adapters/credit-card-api.adapter.interface';
import type { ICryptoService } from '../../../institution/domain/services/crypto.service.interface';
import { EncryptedCredentials } from '../../../institution/domain/value-objects/encrypted-credentials.vo';
import {
  CREDIT_CARD_REPOSITORY,
  CREDIT_CARD_TRANSACTION_REPOSITORY,
  CREDIT_CARD_API_CLIENT,
} from '../../credit-card.tokens';
import { CRYPTO_SERVICE } from '../../../institution/institution.tokens';

export interface ConnectCreditCardInput {
  cardName: string;
  cardNumber: string; // 下4桁
  cardHolderName: string;
  expiryDate: Date;
  username: string;
  password: string;
  issuer: string;
  paymentDay: number;
  closingDay: number;
}

/**
 * ConnectCreditCardUseCase
 * クレジットカードとの接続を確立する
 */
@Injectable()
export class ConnectCreditCardUseCase {
  private readonly logger = new Logger(ConnectCreditCardUseCase.name);

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

  async execute(input: ConnectCreditCardInput): Promise<CreditCardEntity> {
    // 1. 認証情報を暗号化
    const credentials = await this.encryptCredentials(
      input.username,
      input.password,
    );

    // 2. カードAPI接続テスト
    const apiCredentials = {
      username: input.username,
      password: input.password,
      cardNumber: input.cardNumber,
    };

    const connectionResult =
      await this.creditCardAPIClient.testConnection(apiCredentials);

    if (!connectionResult.success) {
      throw new BadGatewayException(
        `Failed to connect to credit card API: ${connectionResult.error}`,
      );
    }

    // 3. カード情報を取得
    const cardInfo = await this.creditCardAPIClient.getCardInfo(apiCredentials);

    // 4. CreditCardエンティティを作成
    const creditCard = new CreditCardEntity(
      this.generateId(),
      input.cardName,
      input.cardNumber,
      input.cardHolderName,
      input.expiryDate,
      credentials,
      true, // 接続成功
      new Date(), // 最終同期日時
      input.paymentDay,
      input.closingDay,
      cardInfo.creditLimit,
      cardInfo.currentBalance,
      input.issuer,
      new Date(),
      new Date(),
    );

    // 5. リポジトリに保存
    const savedCard = await this.creditCardRepository.save(creditCard);

    // 6. 初回の取引履歴を取得して保存（過去6ヶ月）
    await this.fetchInitialTransactions(savedCard.id, apiCredentials);

    return savedCard;
  }

  private encryptCredentials(
    username: string,
    password: string,
  ): EncryptedCredentials {
    const data = JSON.stringify({ username, password });
    return this.cryptoService.encrypt(data);
  }

  private async fetchInitialTransactions(
    creditCardId: string,
    credentials: { username: string; password: string; cardNumber: string },
  ): Promise<void> {
    const endDate = new Date();
    const startDate = subMonths(endDate, 6); // 過去6ヶ月

    try {
      const transactions = await this.creditCardAPIClient.getTransactions(
        credentials,
        startDate,
        endDate,
      );

      const transactionEntities = transactions.map((tx) =>
        this.creditCardAPIClient.mapToTransactionEntity(creditCardId, tx),
      );

      if (transactionEntities.length > 0) {
        await this.transactionRepository.saveMany(transactionEntities);
      }
    } catch (error) {
      // 初回取得失敗はログだけ残して続行
      this.logger.error(
        `Failed to fetch initial transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private generateId(): string {
    return `cc_${randomUUID()}`;
  }
}
