import { Module } from '@nestjs/common';
import { ReconcileCreditCardUseCase } from './application/use-cases/reconcile-credit-card.use-case';
import { ReconciliationService } from './domain/services/reconciliation.service';
import { JsonReconciliationRepository } from './infrastructure/repositories/json-reconciliation.repository';
import { ReconciliationController } from './presentation/controllers/reconciliation.controller';
import { RECONCILIATION_REPOSITORY } from './reconciliation.tokens';
import { AggregationModule } from '../aggregation/aggregation.module';
import { TransactionModule } from '../transaction/transaction.module';

/**
 * Reconciliation Module
 * クレジットカード引落額照合機能を提供するモジュール
 */
@Module({
  imports: [AggregationModule, TransactionModule],
  controllers: [ReconciliationController],
  providers: [
    // Application Layer
    ReconcileCreditCardUseCase,
    // Domain Layer
    ReconciliationService,
    // Infrastructure Layer
    {
      provide: RECONCILIATION_REPOSITORY,
      useClass: JsonReconciliationRepository,
    },
  ],
  exports: [RECONCILIATION_REPOSITORY, ReconcileCreditCardUseCase],
})
export class ReconciliationModule {}
