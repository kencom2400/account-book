import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditCardModule } from '../credit-card/credit-card.module';
import { AggregateCardTransactionsUseCase } from './application/use-cases/aggregate-card-transactions.use-case';
import { FindAllSummariesUseCase } from './application/use-cases/find-all-summaries.use-case';
import { FindSummaryByIdUseCase } from './application/use-cases/find-summary-by-id.use-case';
import { FindSummariesByCardIdUseCase } from './application/use-cases/find-summaries-by-card-id.use-case';
import { DeleteSummaryUseCase } from './application/use-cases/delete-summary.use-case';
import { BillingPeriodCalculator } from './application/services/billing-period-calculator.service';
import { MonthlyCardSummaryOrmEntity } from './infrastructure/entities/monthly-card-summary.orm-entity';
import { AggregationTypeOrmRepository } from './infrastructure/repositories/aggregation-typeorm.repository';
import { AggregationController } from './presentation/controllers/aggregation.controller';
import { AGGREGATION_REPOSITORY } from './aggregation.tokens';

/**
 * Aggregation Module
 * クレジットカード月別集計機能を提供するモジュール
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([MonthlyCardSummaryOrmEntity]),
    CreditCardModule,
  ],
  controllers: [AggregationController],
  providers: [
    // Application Layer
    AggregateCardTransactionsUseCase,
    FindAllSummariesUseCase,
    FindSummaryByIdUseCase,
    FindSummariesByCardIdUseCase,
    DeleteSummaryUseCase,
    BillingPeriodCalculator,
    // Infrastructure Layer
    {
      provide: AGGREGATION_REPOSITORY,
      useClass: AggregationTypeOrmRepository,
    },
  ],
  exports: [
    AGGREGATION_REPOSITORY,
    AggregateCardTransactionsUseCase,
    BillingPeriodCalculator,
  ],
})
export class AggregationModule {}
