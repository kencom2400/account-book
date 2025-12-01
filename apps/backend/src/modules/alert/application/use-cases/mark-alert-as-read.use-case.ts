import { Inject, Injectable } from '@nestjs/common';
import { Alert } from '../../domain/entities/alert.entity';
import type { AlertRepository } from '../../domain/repositories/alert.repository.interface';
import { AlertNotFoundException } from '../../domain/errors/alert.errors';
import { ALERT_REPOSITORY } from '../../alert.tokens';

/**
 * アラート既読 UseCase
 */
@Injectable()
export class MarkAlertAsReadUseCase {
  constructor(
    @Inject(ALERT_REPOSITORY)
    private readonly alertRepository: AlertRepository,
  ) {}

  /**
   * アラートを既読にする
   */
  async execute(id: string): Promise<Alert> {
    // 1. アラートを取得
    const alert = await this.alertRepository.findById(id);

    if (!alert) {
      throw new AlertNotFoundException(id);
    }

    // 2. アラートを既読に更新
    alert.markAsRead();

    // 3. アラートを保存
    return await this.alertRepository.save(alert);
  }
}
