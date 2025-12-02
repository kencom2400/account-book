import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AggregationRepository } from '../../domain/repositories/aggregation.repository.interface';
import { AGGREGATION_REPOSITORY } from '../../aggregation.tokens';
import { MonthlyCardSummary } from '../../domain/entities/monthly-card-summary.entity';

/**
 * 月別集計詳細取得 UseCase
 */
@Injectable()
export class FindSummaryByIdUseCase {
  constructor(
    @Inject(AGGREGATION_REPOSITORY)
    private readonly aggregationRepository: AggregationRepository,
  ) {}

  async execute(id: string): Promise<MonthlyCardSummary> {
    const summary = await this.aggregationRepository.findById(id);

    if (!summary) {
      throw new NotFoundException(`Monthly card summary not found: ${id}`);
    }

    return summary;
  }
}
