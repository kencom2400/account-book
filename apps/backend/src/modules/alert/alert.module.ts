import { Module } from '@nestjs/common';
import { AlertController } from './presentation/controllers/alert.controller';
import { CreateAlertUseCase } from './application/use-cases/create-alert.use-case';
import { GetAlertsUseCase } from './application/use-cases/get-alerts.use-case';
import { ResolveAlertUseCase } from './application/use-cases/resolve-alert.use-case';
import { MarkAlertAsReadUseCase } from './application/use-cases/mark-alert-as-read.use-case';
import { AlertService } from './domain/services/alert.service';
import { JsonAlertRepository } from './infrastructure/repositories/json-alert.repository';
import { ALERT_REPOSITORY, ALERT_SERVICE } from './alert.tokens';
import { ReconciliationModule } from '../reconciliation/reconciliation.module';
import { AggregationModule } from '../aggregation/aggregation.module';
import type { AggregationRepository } from '../aggregation/domain/repositories/aggregation.repository.interface';
import { AGGREGATION_REPOSITORY } from '../aggregation/aggregation.tokens';

/**
 * Alert Module
 *
 * 不一致時のアラート表示機能を提供
 */
@Module({
  imports: [ReconciliationModule, AggregationModule],
  controllers: [AlertController],
  providers: [
    // UseCases
    CreateAlertUseCase,
    GetAlertsUseCase,
    ResolveAlertUseCase,
    MarkAlertAsReadUseCase,
    // Services
    {
      provide: ALERT_SERVICE,
      useFactory: (
        aggregationRepository: AggregationRepository,
      ): AlertService => {
        return new AlertService(aggregationRepository);
      },
      inject: [AGGREGATION_REPOSITORY],
    },
    // Repositories
    {
      provide: ALERT_REPOSITORY,
      useClass: JsonAlertRepository,
    },
  ],
  exports: [ALERT_REPOSITORY],
})
export class AlertModule {}
