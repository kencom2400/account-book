import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// ORM Entities
import { SyncHistoryOrmEntity } from './infrastructure/entities/sync-history.orm-entity';

// Controllers
import { SyncController } from './presentation/controllers/sync.controller';

// Use Cases
import { SyncAllTransactionsUseCase } from './application/use-cases/sync-all-transactions.use-case';
import { GetSyncHistoryUseCase } from './application/use-cases/get-sync-history.use-case';
import { GetSyncStatusUseCase } from './application/use-cases/get-sync-status.use-case';
import { CancelSyncUseCase } from './application/use-cases/cancel-sync.use-case';
import { SyncTransactionsUseCase } from './application/use-cases/sync-transactions.use-case';

// Strategies
import { IncrementalSyncStrategy } from './application/strategies/incremental-sync.strategy';

// Jobs
import { ScheduledSyncJob } from './application/jobs/scheduled-sync.job';

// Repositories
import { SyncHistoryTypeOrmRepository } from './infrastructure/repositories/sync-history-typeorm.repository';

// Tokens
import { SYNC_HISTORY_REPOSITORY } from './sync.tokens';

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
  controllers: [SyncController],
  providers: [
    // Use Cases
    SyncAllTransactionsUseCase,
    GetSyncHistoryUseCase,
    GetSyncStatusUseCase,
    CancelSyncUseCase,
    SyncTransactionsUseCase, // 既存のUseCase（後方互換性のため保持）

    // Strategies
    IncrementalSyncStrategy,

    // Jobs
    ScheduledSyncJob,

    // Repositories
    {
      provide: SYNC_HISTORY_REPOSITORY,
      useClass: SyncHistoryTypeOrmRepository,
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
