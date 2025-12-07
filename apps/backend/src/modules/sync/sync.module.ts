import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// ORM Entities
import { SyncHistoryOrmEntity } from './infrastructure/entities/sync-history.orm-entity';

// Controllers
import { SyncController } from './presentation/controllers/sync.controller';
import { SyncSettingsController } from './presentation/controllers/sync-settings.controller';

// Use Cases
import { SyncAllTransactionsUseCase } from './application/use-cases/sync-all-transactions.use-case';
import { GetSyncHistoryUseCase } from './application/use-cases/get-sync-history.use-case';
import { GetSyncStatusUseCase } from './application/use-cases/get-sync-status.use-case';
import { CancelSyncUseCase } from './application/use-cases/cancel-sync.use-case';
import { SyncTransactionsUseCase } from './application/use-cases/sync-transactions.use-case';
import { GetSyncSettingsUseCase } from './application/use-cases/get-sync-settings.use-case';
import { UpdateSyncSettingsUseCase } from './application/use-cases/update-sync-settings.use-case';
import { GetInstitutionSyncSettingsUseCase } from './application/use-cases/get-institution-sync-settings.use-case';
import { GetAllInstitutionSyncSettingsUseCase } from './application/use-cases/get-all-institution-sync-settings.use-case';
import { UpdateInstitutionSyncSettingsUseCase } from './application/use-cases/update-institution-sync-settings.use-case';

// Strategies
import { IncrementalSyncStrategy } from './domain/strategies/incremental-sync.strategy';

// Jobs
import { ScheduledSyncJob } from './application/jobs/scheduled-sync.job';

// Repositories
import { SyncHistoryTypeOrmRepository } from './infrastructure/repositories/sync-history-typeorm.repository';
import { JsonSyncSettingsRepository } from './infrastructure/repositories/json-sync-settings.repository';

// Tokens
import {
  SYNC_HISTORY_REPOSITORY,
  SYNC_SETTINGS_REPOSITORY,
} from './sync.tokens';

// Import other modules
import { CreditCardModule } from '../credit-card/credit-card.module';
import { SecuritiesModule } from '../securities/securities.module';
import { InstitutionModule } from '../institution/institution.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SyncHistoryOrmEntity]),
    ScheduleModule.forRoot(), // スケジューリング機能を有効化
    CreditCardModule,
    SecuritiesModule,
    InstitutionModule, // Institution リポジトリを使用するため追加
  ],
  controllers: [SyncController, SyncSettingsController],
  providers: [
    // Use Cases
    SyncAllTransactionsUseCase,
    GetSyncHistoryUseCase,
    GetSyncStatusUseCase,
    CancelSyncUseCase,
    SyncTransactionsUseCase, // 既存のUseCase（後方互換性のため保持）
    GetSyncSettingsUseCase,
    UpdateSyncSettingsUseCase,
    GetInstitutionSyncSettingsUseCase,
    GetAllInstitutionSyncSettingsUseCase,
    UpdateInstitutionSyncSettingsUseCase,

    // Strategies
    IncrementalSyncStrategy,

    // Jobs
    ScheduledSyncJob,

    // Repositories
    {
      provide: SYNC_HISTORY_REPOSITORY,
      useClass: SyncHistoryTypeOrmRepository,
    },
    {
      provide: SYNC_SETTINGS_REPOSITORY,
      useClass: JsonSyncSettingsRepository,
    },

    // Services
    {
      provide: 'ISchedulerService',
      useExisting: ScheduledSyncJob,
    },
  ],
  exports: [
    SyncAllTransactionsUseCase,
    GetSyncHistoryUseCase,
    GetSyncStatusUseCase,
    CancelSyncUseCase,
    SyncTransactionsUseCase,
    ScheduledSyncJob,
    SYNC_HISTORY_REPOSITORY,
  ],
})
export class SyncModule {}
