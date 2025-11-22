import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// ORM Entities
import { SyncHistoryOrmEntity } from './infrastructure/entities/sync-history.orm-entity';

// Controllers
import { SyncController } from './presentation/controllers/sync.controller';

// Use Cases
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

@Module({
  imports: [
    TypeOrmModule.forFeature([SyncHistoryOrmEntity]),
    ScheduleModule.forRoot(), // スケジューリング機能を有効化
    CreditCardModule,
    SecuritiesModule,
  ],
  controllers: [SyncController],
  providers: [
    // Use Cases
    SyncTransactionsUseCase,

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
  exports: [SyncTransactionsUseCase, ScheduledSyncJob, SYNC_HISTORY_REPOSITORY],
})
export class SyncModule {}
