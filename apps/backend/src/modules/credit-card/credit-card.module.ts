import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { CreditCardController } from './presentation/controllers/credit-card.controller';

// Use Cases
import { ConnectCreditCardUseCase } from './application/use-cases/connect-credit-card.use-case';
import { FetchCreditCardTransactionsUseCase } from './application/use-cases/fetch-credit-card-transactions.use-case';
import { FetchPaymentInfoUseCase } from './application/use-cases/fetch-payment-info.use-case';

// Repositories
import {
  FileSystemCreditCardRepository,
  FileSystemCreditCardTransactionRepository,
  FileSystemPaymentRepository,
} from './infrastructure/repositories/credit-card.repository';
import {
  ICreditCardRepository,
  ICreditCardTransactionRepository,
  IPaymentRepository,
} from './domain/repositories/credit-card.repository.interface';

// Adapters
import { MockCreditCardAPIAdapter } from './infrastructure/adapters/mock-credit-card-api.adapter';
import { ICreditCardAPIClient } from './infrastructure/adapters/credit-card-api.adapter.interface';

// Shared Services
import { CryptoService } from '../institution/infrastructure/services/crypto.service';
import { ICryptoService } from '../institution/domain/services/crypto.service.interface';

@Module({
  imports: [ConfigModule],
  controllers: [CreditCardController],
  providers: [
    // Use Cases
    ConnectCreditCardUseCase,
    FetchCreditCardTransactionsUseCase,
    FetchPaymentInfoUseCase,

    // Repositories
    {
      provide: ICreditCardRepository,
      useClass: FileSystemCreditCardRepository,
    },
    {
      provide: ICreditCardTransactionRepository,
      useClass: FileSystemCreditCardTransactionRepository,
    },
    {
      provide: IPaymentRepository,
      useClass: FileSystemPaymentRepository,
    },

    // Adapters
    {
      provide: ICreditCardAPIClient,
      useClass: MockCreditCardAPIAdapter,
    },

    // Shared Services
    {
      provide: ICryptoService,
      useClass: CryptoService,
    },
  ],
  exports: [
    ICreditCardRepository,
    ICreditCardTransactionRepository,
    IPaymentRepository,
  ],
})
export class CreditCardModule {}
