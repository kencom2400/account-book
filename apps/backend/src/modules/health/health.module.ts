import { Module } from '@nestjs/common';

// Controllers
import { HealthController } from './presentation/controllers/health.controller';

// Use Cases
import { CheckConnectionStatusUseCase } from './application/use-cases/check-connection-status.use-case';
import { GetConnectionHistoryUseCase } from './application/use-cases/get-connection-history.use-case';
import { ScheduledConnectionCheckUseCase } from './application/use-cases/scheduled-connection-check.use-case';

// Infrastructure
import { ConnectionCheckerService } from './infrastructure/services/connection-checker.service';
import { FileSystemConnectionHistoryRepository } from './infrastructure/repositories/connection-history.repository';

// Tokens
import { CONNECTION_HISTORY_REPOSITORY } from './domain/repositories/connection-history.repository.interface';

// 他のモジュールのインポート
import { InstitutionModule } from '../institution/institution.module';
import { CreditCardModule } from '../credit-card/credit-card.module';
import { SecuritiesModule } from '../securities/securities.module';

@Module({
  imports: [InstitutionModule, CreditCardModule, SecuritiesModule],
  controllers: [HealthController],
  providers: [
    // Repository
    {
      provide: CONNECTION_HISTORY_REPOSITORY,
      useClass: FileSystemConnectionHistoryRepository,
    },

    // Services
    ConnectionCheckerService,

    // Use Cases
    CheckConnectionStatusUseCase,
    GetConnectionHistoryUseCase,
    ScheduledConnectionCheckUseCase,
  ],
  exports: [
    CONNECTION_HISTORY_REPOSITORY,
    ConnectionCheckerService,
    CheckConnectionStatusUseCase,
    GetConnectionHistoryUseCase,
  ],
})
export class HealthModule {}
