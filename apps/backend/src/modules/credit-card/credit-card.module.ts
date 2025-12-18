import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { CreditCardController } from './presentation/controllers/credit-card.controller';

// Use Cases
import { ConnectCreditCardUseCase } from './application/use-cases/connect-credit-card.use-case';
import { FetchCreditCardTransactionsUseCase } from './application/use-cases/fetch-credit-card-transactions.use-case';
import { FetchPaymentInfoUseCase } from './application/use-cases/fetch-payment-info.use-case';
import { RefreshCreditCardDataUseCase } from './application/use-cases/refresh-credit-card-data.use-case';
import { GetSupportedCardCompaniesUseCase } from './application/use-cases/get-supported-card-companies.use-case';
import { TestCreditCardConnectionUseCase } from './application/use-cases/test-credit-card-connection.use-case';

// Repositories
import {
  FileSystemCreditCardRepository,
  FileSystemCreditCardTransactionRepository,
  FileSystemPaymentRepository,
} from './infrastructure/repositories/credit-card.repository';
import { CreditCardTypeOrmRepository } from './infrastructure/repositories/credit-card-typeorm.repository';

// Entities
import { CreditCardOrmEntity } from './infrastructure/entities/credit-card.orm-entity';

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
  imports: [ConfigModule, TypeOrmModule.forFeature([CreditCardOrmEntity])],
  controllers: [CreditCardController],
  providers: [
    // Use Cases
    ConnectCreditCardUseCase,
    FetchCreditCardTransactionsUseCase,
    FetchPaymentInfoUseCase,
    RefreshCreditCardDataUseCase,
    GetSupportedCardCompaniesUseCase,
    TestCreditCardConnectionUseCase,

    // Repositories - TypeORM版を使用（JSON版は予備として残す）
    {
      provide: CREDIT_CARD_REPOSITORY,
      useClass: CreditCardTypeOrmRepository,
    },
    FileSystemCreditCardRepository, // JSONリポジトリは予備として残す
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
    CREDIT_CARD_API_CLIENT, // Health moduleから使用するためにexport
    FetchCreditCardTransactionsUseCase, // Sync moduleから使用するためにexport
    RefreshCreditCardDataUseCase, // Sync moduleから使用するためにexport
  ],
})
export class CreditCardModule {}
