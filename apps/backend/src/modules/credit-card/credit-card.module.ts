import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { CreditCardController } from './presentation/controllers/credit-card.controller';

// Use Cases
import { ConnectCreditCardUseCase } from './application/use-cases/connect-credit-card.use-case';
import { FetchCreditCardTransactionsUseCase } from './application/use-cases/fetch-credit-card-transactions.use-case';
import { FetchPaymentInfoUseCase } from './application/use-cases/fetch-payment-info.use-case';
import { RefreshCreditCardDataUseCase } from './application/use-cases/refresh-credit-card-data.use-case';

// Repositories
import {
  FileSystemCreditCardRepository,
  FileSystemCreditCardTransactionRepository,
  FileSystemPaymentRepository,
} from './infrastructure/repositories/credit-card.repository';

// Adapters
import { MockCreditCardAPIAdapter } from './infrastructure/adapters/mock-credit-card-api.adapter';

// Shared Services
import { CryptoService } from '../institution/infrastructure/services/crypto.service';

// Tokens
import {
  CREDIT_CARD_REPOSITORY,
  CREDIT_CARD_TRANSACTION_REPOSITORY,
  PAYMENT_REPOSITORY,
  CREDIT_CARD_API_CLIENT,
} from './credit-card.tokens';
import { CRYPTO_SERVICE } from '../institution/institution.tokens';

@Module({
  imports: [ConfigModule],
  controllers: [CreditCardController],
  providers: [
    // Use Cases
    ConnectCreditCardUseCase,
    FetchCreditCardTransactionsUseCase,
    FetchPaymentInfoUseCase,
    RefreshCreditCardDataUseCase,

    // Repositories
    {
      provide: CREDIT_CARD_REPOSITORY,
      useClass: FileSystemCreditCardRepository,
    },
    {
      provide: CREDIT_CARD_TRANSACTION_REPOSITORY,
      useClass: FileSystemCreditCardTransactionRepository,
    },
    {
      provide: PAYMENT_REPOSITORY,
      useClass: FileSystemPaymentRepository,
    },

    // Adapters
    {
      provide: CREDIT_CARD_API_CLIENT,
      useClass: MockCreditCardAPIAdapter,
    },

    // Shared Services
    {
      provide: CRYPTO_SERVICE,
      useClass: CryptoService,
    },
  ],
  exports: [
    CREDIT_CARD_REPOSITORY,
    CREDIT_CARD_TRANSACTION_REPOSITORY,
    PAYMENT_REPOSITORY,
  ],
})
export class CreditCardModule {}
