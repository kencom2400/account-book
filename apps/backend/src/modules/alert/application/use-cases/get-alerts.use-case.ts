import { Inject, Injectable } from '@nestjs/common';
import { Alert } from '../../domain/entities/alert.entity';
import type { AlertRepository } from '../../domain/repositories/alert.repository.interface';
import { ALERT_REPOSITORY } from '../../alert.tokens';

/**
 * アラート一覧取得 UseCase
 */
@Injectable()
export class GetAlertsUseCase {
  constructor(
    @Inject(ALERT_REPOSITORY)
    private readonly alertRepository: AlertRepository,
  ) {}

  /**
   * アラート一覧を取得
   */
  async execute(query: {
    level?: string;
    status?: string;
    type?: string;
    cardId?: string;
    billingMonth?: string;
    page?: number;
    limit?: number;
  }): Promise<Alert[]> {
    return await this.alertRepository.findAll(query);
  }
}
