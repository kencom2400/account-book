import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import { CreditCardTransactionEntity } from '../../domain/entities/credit-card-transaction.entity';
import { PaymentVO } from '../../domain/value-objects/payment.vo';
import type {
  ICreditCardRepository,
  ICreditCardTransactionRepository,
  IPaymentRepository,
} from '../../domain/repositories/credit-card.repository.interface';
import type { ICreditCardAPIClient } from '../../infrastructure/adapters/credit-card-api.adapter.interface';
import type { ICryptoService } from '../../../institution/domain/services/crypto.service.interface';
import {
  CREDIT_CARD_REPOSITORY,
  CREDIT_CARD_TRANSACTION_REPOSITORY,
  PAYMENT_REPOSITORY,
  CREDIT_CARD_API_CLIENT,
} from '../../credit-card.tokens';
import { CRYPTO_SERVICE } from '../../../institution/institution.tokens';

export interface RefreshCreditCardDataOutput {
  creditCard: CreditCardEntity;
  transactions: CreditCardTransactionEntity[];
  payment: PaymentVO;
}

/**
 * RefreshCreditCardDataUseCase
 * クレジットカードの全データを一括で再同期する
 */
@Injectable()
export class RefreshCreditCardDataUseCase {
  private readonly logger = new Logger(RefreshCreditCardDataUseCase.name);

  constructor(
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: ICreditCardRepository,
    @Inject(CREDIT_CARD_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ICreditCardTransactionRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(CREDIT_CARD_API_CLIENT)
    private readonly creditCardAPIClient: ICreditCardAPIClient,
    @Inject(CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) {}

  async execute(creditCardId: string): Promise<RefreshCreditCardDataOutput> {
    // 1. クレジットカードを取得
    const creditCard = await this.creditCardRepository.findById(creditCardId);
    if (!creditCard) {
      throw new NotFoundException(
        `Credit card not found with ID: ${creditCardId}`,
      );
    }

    // 2. 認証情報を復号化
    const credentials = this.decryptCredentials(creditCard);

    // 3. 並行してAPIから取引と支払い情報を取得
    const [transactions, paymentInfo] = await Promise.all([
      this.fetchTransactions(creditCard, credentials),
      this.fetchPaymentInfo(creditCard, credentials),
    ]);

    // 4. lastSyncedAtを一度だけ更新
    const now = new Date();
    const updatedCreditCard = creditCard.updateLastSyncedAt(now);
    await this.creditCardRepository.save(updatedCreditCard);

    return {
      creditCard: updatedCreditCard,
      transactions,
      payment: paymentInfo,
    };
  }

  private decryptCredentials(creditCard: CreditCardEntity): {
    username: string;
    password: string;
  } {
    const decryptedData = this.cryptoService.decrypt(creditCard.credentials);

    try {
      return JSON.parse(decryptedData) as {
        username: string;
        password: string;
      };
    } catch (error) {
      this.logger.error(
        `Failed to parse credentials for card ${creditCard.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new Error(`Failed to parse credentials for card ${creditCard.id}`);
    }
  }

  private async fetchTransactions(
    creditCard: CreditCardEntity,
    credentials: { username: string; password: string },
  ): Promise<CreditCardTransactionEntity[]> {
    try {
      // デフォルトで当月の取引を取得
      const endDate = new Date();
      const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      const apiTransactions = await this.creditCardAPIClient.getTransactions(
        credentials,
        startDate,
        endDate,
      );

      const transactionEntities = apiTransactions.map((tx) =>
        this.creditCardAPIClient.mapToTransactionEntity(creditCard.id, tx),
      );

      if (transactionEntities.length > 0) {
        await this.transactionRepository.saveMany(transactionEntities);
      }

      return transactionEntities;
    } catch (error) {
      this.logger.error(
        `Failed to fetch transactions for card ${creditCard.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // 取引取得失敗時は空配列を返す
      return [];
    }
  }

  private async fetchPaymentInfo(
    creditCard: CreditCardEntity,
    credentials: { username: string; password: string },
  ): Promise<PaymentVO> {
    try {
      const apiPaymentInfo =
        await this.creditCardAPIClient.getPaymentInfo(credentials);

      const billingMonth = this.getCurrentMonth();
      const payment = this.creditCardAPIClient.mapToPaymentVO(
        billingMonth,
        apiPaymentInfo,
      );

      await this.paymentRepository.save(creditCard.id, payment);

      return payment;
    } catch (error) {
      this.logger.error(
        `Failed to fetch payment info for card ${creditCard.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      // 支払い情報取得失敗時はローカルから取得
      const existingPayment =
        await this.paymentRepository.findByCreditCardIdAndMonth(
          creditCard.id,
          this.getCurrentMonth(),
        );

      if (existingPayment) {
        return existingPayment;
      }

      // どちらもない場合はデフォルト値を返す
      return this.createDefaultPayment(creditCard);
    }
  }

  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private createDefaultPayment(creditCard: CreditCardEntity): PaymentVO {
    const now = new Date();
    const billingMonth = this.getCurrentMonth();
    const closingDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      creditCard.closingDay,
    );
    const paymentDueDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      creditCard.paymentDay,
    );

    return new PaymentVO(
      billingMonth,
      closingDate,
      paymentDueDate,
      0,
      0,
      0,
      'unpaid' as any,
      null,
    );
  }
}
