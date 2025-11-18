import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { SecuritiesController } from './presentation/controllers/securities.controller';

// Use Cases
import { ConnectSecuritiesAccountUseCase } from './application/use-cases/connect-securities-account.use-case';
import { FetchHoldingsUseCase } from './application/use-cases/fetch-holdings.use-case';
import { FetchSecurityTransactionsUseCase } from './application/use-cases/fetch-security-transactions.use-case';
import { CalculatePortfolioValueUseCase } from './application/use-cases/calculate-portfolio-value.use-case';

// Repositories
import {
  FileSystemSecuritiesAccountRepository,
  FileSystemHoldingRepository,
  FileSystemSecurityTransactionRepository,
} from './infrastructure/repositories/securities.repository';

// Adapters
import { MockSecuritiesAPIAdapter } from './infrastructure/adapters/mock-securities-api.adapter';

// Shared Services
import { CryptoService } from '../institution/infrastructure/services/crypto.service';

// Tokens
import {
  SECURITIES_ACCOUNT_REPOSITORY,
  HOLDING_REPOSITORY,
  SECURITY_TRANSACTION_REPOSITORY,
  SECURITIES_API_CLIENT,
} from './securities.tokens';
import { CRYPTO_SERVICE } from '../institution/institution.tokens';

@Module({
  imports: [ConfigModule],
  controllers: [SecuritiesController],
  providers: [
    // Use Cases
    ConnectSecuritiesAccountUseCase,
    FetchHoldingsUseCase,
    FetchSecurityTransactionsUseCase,
    CalculatePortfolioValueUseCase,

    // Repositories
    {
      provide: SECURITIES_ACCOUNT_REPOSITORY,
      useClass: FileSystemSecuritiesAccountRepository,
    },
    {
      provide: HOLDING_REPOSITORY,
      useClass: FileSystemHoldingRepository,
    },
    {
      provide: SECURITY_TRANSACTION_REPOSITORY,
      useClass: FileSystemSecurityTransactionRepository,
    },

    // Adapters
    {
      provide: SECURITIES_API_CLIENT,
      useClass: MockSecuritiesAPIAdapter,
    },

    // Shared Services
    {
      provide: CRYPTO_SERVICE,
      useClass: CryptoService,
    },
  ],
  exports: [
    SECURITIES_ACCOUNT_REPOSITORY,
    HOLDING_REPOSITORY,
    SECURITY_TRANSACTION_REPOSITORY,
    SECURITIES_API_CLIENT, // Health moduleから使用するためにexport
  ],
})
export class SecuritiesModule {}
