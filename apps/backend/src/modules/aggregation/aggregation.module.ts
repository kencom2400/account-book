import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditCardModule } from '../credit-card/credit-card.module';
import { AggregateCardTransactionsUseCase } from './application/use-cases/aggregate-card-transactions.use-case';
import { BillingPeriodCalculator } from './application/services/billing-period-calculator.service';
import { MonthlyCardSummaryOrmEntity } from './infrastructure/entities/monthly-card-summary.orm-entity';
import { AggregationTypeOrmRepository } from './infrastructure/repositories/aggregation-typeorm.repository';
import { AggregationController } from './presentation/controllers/aggregation.controller';

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
    BillingPeriodCalculator,
    // Infrastructure Layer
    {
      provide: 'AggregationRepository',
      useClass: AggregationTypeOrmRepository,
    },
  ],
  exports: [
    'AggregationRepository',
    AggregateCardTransactionsUseCase,
    BillingPeriodCalculator,
  ],
})
export class AggregationModule {}
