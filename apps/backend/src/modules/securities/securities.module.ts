import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// ORM Entities
import { SecuritiesAccountOrmEntity } from './infrastructure/entities/securities-account.orm-entity';
import { HoldingOrmEntity } from './infrastructure/entities/holding.orm-entity';
import { SecurityTransactionOrmEntity } from './infrastructure/entities/security-transaction.orm-entity';

// Controllers
import { SecuritiesController } from './presentation/controllers/securities.controller';

// Use Cases
import { ConnectSecuritiesAccountUseCase } from './application/use-cases/connect-securities-account.use-case';
import { FetchHoldingsUseCase } from './application/use-cases/fetch-holdings.use-case';
import { FetchSecurityTransactionsUseCase } from './application/use-cases/fetch-security-transactions.use-case';
import { CalculatePortfolioValueUseCase } from './application/use-cases/calculate-portfolio-value.use-case';

// Repositories - TypeORM版
import { SecuritiesAccountTypeOrmRepository } from './infrastructure/repositories/securities-account-typeorm.repository';
import { HoldingTypeOrmRepository } from './infrastructure/repositories/holding-typeorm.repository';
import { SecurityTransactionTypeOrmRepository } from './infrastructure/repositories/security-transaction-typeorm.repository';

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
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      SecuritiesAccountOrmEntity,
      HoldingOrmEntity,
      SecurityTransactionOrmEntity,
    ]),
  ],
  controllers: [SecuritiesController],
  providers: [
    // Use Cases
    ConnectSecuritiesAccountUseCase,
    FetchHoldingsUseCase,
    FetchSecurityTransactionsUseCase,
    CalculatePortfolioValueUseCase,

    // Repositories - TypeORM版を使用
    {
      provide: SECURITIES_ACCOUNT_REPOSITORY,
      useClass: SecuritiesAccountTypeOrmRepository,
    },
    {
      provide: HOLDING_REPOSITORY,
      useClass: HoldingTypeOrmRepository,
    },
    {
      provide: SECURITY_TRANSACTION_REPOSITORY,
      useClass: SecurityTransactionTypeOrmRepository,
    },
    SecuritiesAccountTypeOrmRepository,
    HoldingTypeOrmRepository,
    SecurityTransactionTypeOrmRepository,

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
