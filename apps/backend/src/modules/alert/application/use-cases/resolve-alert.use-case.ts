import { Inject, Injectable } from '@nestjs/common';
import { Alert } from '../../domain/entities/alert.entity';
import { AlertStatus } from '../../domain/enums/alert-status.enum';
import type { AlertRepository } from '../../domain/repositories/alert.repository.interface';
import {
  AlertNotFoundException,
  AlertAlreadyResolvedException,
} from '../../domain/errors/alert.errors';
import { ALERT_REPOSITORY } from '../../alert.tokens';

/**
 * アラート解決 UseCase
 */
@Injectable()
export class ResolveAlertUseCase {
  constructor(
    @Inject(ALERT_REPOSITORY)
    private readonly alertRepository: AlertRepository,
  ) {}

  /**
   * アラートを解決済みにする
   */
  async execute(
    id: string,
    resolvedBy: string,
    resolutionNote?: string,
  ): Promise<Alert> {
    // 1. アラートを取得
    const alert = await this.alertRepository.findById(id);

    if (!alert) {
      throw new AlertNotFoundException(id);
    }

    // 2. 既に解決済みかチェック
    if (alert.status === AlertStatus.RESOLVED) {
      throw new AlertAlreadyResolvedException(id);
    }

    // 3. アラートを解決済みに更新
    const resolvedAlert = alert.markAsResolved(resolvedBy, resolutionNote);

    // 4. アラートを保存
    return await this.alertRepository.save(resolvedAlert);
  }
}
