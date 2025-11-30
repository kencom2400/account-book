import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AggregationRepository } from '../../domain/repositories/aggregation.repository.interface';
import { AGGREGATION_REPOSITORY } from '../../aggregation.tokens';

/**
 * 月別集計削除 UseCase
 */
@Injectable()
export class DeleteSummaryUseCase {
  constructor(
    @Inject(AGGREGATION_REPOSITORY)
    private readonly aggregationRepository: AggregationRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const summary = await this.aggregationRepository.findById(id);

    if (!summary) {
      throw new NotFoundException(`Monthly card summary not found: ${id}`);
    }

    await this.aggregationRepository.delete(id);
  }
}
