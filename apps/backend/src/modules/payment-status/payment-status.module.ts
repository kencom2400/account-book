import { Module } from '@nestjs/common';
import { AggregationModule } from '../aggregation/aggregation.module';
import { GetPaymentStatusHistoryUseCase } from './application/use-cases/get-payment-status-history.use-case';
import { UpdatePaymentStatusUseCase } from './application/use-cases/update-payment-status.use-case';
import { JsonPaymentStatusRepository } from './infrastructure/repositories/json-payment-status.repository';
import { PaymentStatusController } from './presentation/controllers/payment-status.controller';
import { PAYMENT_STATUS_REPOSITORY } from './payment-status.tokens';

/**
 * Payment Status Module
 * 支払いステータス管理機能を提供するモジュール
 */
@Module({
  imports: [AggregationModule],
  controllers: [PaymentStatusController],
  providers: [
    // Application Layer
    UpdatePaymentStatusUseCase,
    GetPaymentStatusHistoryUseCase,
    // Infrastructure Layer
    {
      provide: PAYMENT_STATUS_REPOSITORY,
      useClass: JsonPaymentStatusRepository,
    },
  ],
  exports: [
    PAYMENT_STATUS_REPOSITORY,
    UpdatePaymentStatusUseCase,
    GetPaymentStatusHistoryUseCase,
  ],
})
export class PaymentStatusModule {}
