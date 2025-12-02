import { Inject, Injectable } from '@nestjs/common';
import { Alert } from '../../domain/entities/alert.entity';
import { AlertService } from '../../domain/services/alert.service';
import type { AlertRepository } from '../../domain/repositories/alert.repository.interface';
import type { ReconciliationRepository } from '../../../reconciliation/domain/repositories/reconciliation.repository.interface';
import { DuplicateAlertException } from '../../domain/errors/alert.errors';
import { ReconciliationNotFoundException } from '../../../reconciliation/domain/errors/reconciliation.errors';
import { ALERT_REPOSITORY } from '../../alert.tokens';
import { RECONCILIATION_REPOSITORY } from '../../../reconciliation/reconciliation.tokens';

/**
 * アラート生成 UseCase
 */
@Injectable()
export class CreateAlertUseCase {
  constructor(
    @Inject(ALERT_REPOSITORY)
    private readonly alertRepository: AlertRepository,
    @Inject(RECONCILIATION_REPOSITORY)
    private readonly reconciliationRepository: ReconciliationRepository,
    private readonly alertService: AlertService,
  ) {}

  /**
   * 照合結果からアラートを生成
   */
  async execute(reconciliationId: string): Promise<Alert> {
    // 1. 照合結果を取得
    const reconciliation =
      await this.reconciliationRepository.findById(reconciliationId);

    if (!reconciliation) {
      throw new ReconciliationNotFoundException(reconciliationId);
    }

    // 2. 重複アラートチェック
    const existingAlert =
      await this.alertRepository.findByReconciliationId(reconciliationId);

    if (existingAlert) {
      throw new DuplicateAlertException(reconciliationId);
    }

    // 3. アラート生成
    const alert =
      this.alertService.createAlertFromReconciliation(reconciliation);

    // 4. アラートを保存
    return await this.alertRepository.save(alert);
  }
}
