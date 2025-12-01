import { Module } from '@nestjs/common';
import { AlertController } from './presentation/controllers/alert.controller';
import { CreateAlertUseCase } from './application/use-cases/create-alert.use-case';
import { GetAlertsUseCase } from './application/use-cases/get-alerts.use-case';
import { ResolveAlertUseCase } from './application/use-cases/resolve-alert.use-case';
import { MarkAlertAsReadUseCase } from './application/use-cases/mark-alert-as-read.use-case';
import { AlertService } from './domain/services/alert.service';
import { JsonAlertRepository } from './infrastructure/repositories/json-alert.repository';
import { ALERT_REPOSITORY } from './alert.tokens';
import { ReconciliationModule } from '../reconciliation/reconciliation.module';

/**
 * Alert Module
 *
 * 不一致時のアラート表示機能を提供
 */
@Module({
  imports: [ReconciliationModule],
  controllers: [AlertController],
  providers: [
    // UseCases
    CreateAlertUseCase,
    GetAlertsUseCase,
    ResolveAlertUseCase,
    MarkAlertAsReadUseCase,
    // Services
    AlertService,
    // Repositories
    {
      provide: ALERT_REPOSITORY,
      useClass: JsonAlertRepository,
    },
  ],
  exports: [ALERT_REPOSITORY],
})
export class AlertModule {}
