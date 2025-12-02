import { Inject, Injectable } from '@nestjs/common';
import type { AggregationRepository } from '../../domain/repositories/aggregation.repository.interface';
import { AGGREGATION_REPOSITORY } from '../../aggregation.tokens';
import { MonthlyCardSummary } from '../../domain/entities/monthly-card-summary.entity';

/**
 * カードIDで月別集計一覧取得 UseCase
 * N+1問題を回避するため、特定のカードIDに関連するすべての詳細サマリーを一度に取得
 */
@Injectable()
export class FindSummariesByCardIdUseCase {
  constructor(
    @Inject(AGGREGATION_REPOSITORY)
    private readonly aggregationRepository: AggregationRepository,
  ) {}

  /**
   * カードIDで月別集計一覧を取得
   *
   * @param cardId クレジットカードID
   * @returns 月別集計データの配列
   */
  async execute(cardId: string): Promise<MonthlyCardSummary[]> {
    return this.aggregationRepository.findAllByCardId(cardId);
  }
}
