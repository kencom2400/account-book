import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditCardModule } from '../credit-card/credit-card.module';
import type {
  ICreditCardRepository,
  ICreditCardTransactionRepository,
} from '../credit-card/domain/repositories/credit-card.repository.interface';
import {
  CREDIT_CARD_REPOSITORY,
  CREDIT_CARD_TRANSACTION_REPOSITORY,
} from '../credit-card/credit-card.tokens';
import { AggregateCardTransactionsUseCase } from './application/use-cases/aggregate-card-transactions.use-case';
import { BillingPeriodCalculator } from './application/services/billing-period-calculator.service';
import type { AggregationRepository } from './domain/repositories/aggregation.repository.interface';
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
    {
      provide: AggregateCardTransactionsUseCase,
      useFactory: (
        creditCardRepository: ICreditCardRepository,
        transactionRepository: ICreditCardTransactionRepository,
        aggregationRepository: AggregationRepository,
        billingPeriodCalculator: BillingPeriodCalculator,
      ): AggregateCardTransactionsUseCase => {
        return new AggregateCardTransactionsUseCase(
          creditCardRepository,
          transactionRepository,
          aggregationRepository,
          billingPeriodCalculator,
        );
      },
      inject: [
        CREDIT_CARD_REPOSITORY,
        CREDIT_CARD_TRANSACTION_REPOSITORY,
        'AggregationRepository',
        BillingPeriodCalculator,
      ],
    },
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
