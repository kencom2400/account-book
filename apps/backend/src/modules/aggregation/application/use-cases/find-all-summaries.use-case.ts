import { Inject, Injectable } from '@nestjs/common';
import type { AggregationRepository } from '../../domain/repositories/aggregation.repository.interface';
import { AGGREGATION_REPOSITORY } from '../../aggregation.tokens';
import { MonthlyCardSummary } from '../../domain/entities/monthly-card-summary.entity';

/**
 * 月別集計一覧取得 UseCase
 */
@Injectable()
export class FindAllSummariesUseCase {
  constructor(
    @Inject(AGGREGATION_REPOSITORY)
    private readonly aggregationRepository: AggregationRepository,
  ) {}

  async execute(): Promise<MonthlyCardSummary[]> {
    return this.aggregationRepository.findAll();
  }
}
