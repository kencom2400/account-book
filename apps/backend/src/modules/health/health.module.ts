import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { HealthController } from './presentation/controllers/health.controller';

// Use Cases
import { CheckConnectionStatusUseCase } from './application/use-cases/check-connection-status.use-case';
import { GetConnectionHistoryUseCase } from './application/use-cases/get-connection-history.use-case';
import { ScheduledConnectionCheckUseCase } from './application/use-cases/scheduled-connection-check.use-case';

// Infrastructure
import { ConnectionCheckerService } from './infrastructure/services/connection-checker.service';
import { FileSystemConnectionHistoryRepository } from './infrastructure/repositories/connection-history.repository';
import { NotificationRepository } from './infrastructure/repositories/notification.repository';

// Application Services
import { InstitutionAggregationService } from './application/services/institution-aggregation.service';
import { NotificationService } from './application/services/notification.service';
import { NotificationCleanupService } from './application/services/notification-cleanup.service';

// Event Handlers
import { ConnectionFailedHandler } from './application/handlers/connection-failed.handler';

// Tokens
import { CONNECTION_HISTORY_REPOSITORY } from './domain/repositories/connection-history.repository.interface';
import { NOTIFICATION_REPOSITORY } from './health.tokens';

// 他のモジュールのインポート
import { InstitutionModule } from '../institution/institution.module';
import { CreditCardModule } from '../credit-card/credit-card.module';
import { SecuritiesModule } from '../securities/securities.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    InstitutionModule,
    CreditCardModule,
    SecuritiesModule,
  ],
  controllers: [HealthController],
  providers: [
    // Repositories
    {
      provide: CONNECTION_HISTORY_REPOSITORY,
      useClass: FileSystemConnectionHistoryRepository,
    },
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: NotificationRepository,
    },

    // Services
    ConnectionCheckerService,
    InstitutionAggregationService,
    NotificationService,
    NotificationCleanupService,

    // Event Handlers
    ConnectionFailedHandler,

    // Use Cases
    CheckConnectionStatusUseCase,
    GetConnectionHistoryUseCase,
    ScheduledConnectionCheckUseCase,
  ],
  exports: [
    CONNECTION_HISTORY_REPOSITORY,
    NOTIFICATION_REPOSITORY,
    ConnectionCheckerService,
    CheckConnectionStatusUseCase,
    GetConnectionHistoryUseCase,
  ],
})
export class HealthModule {}
