import { Inject, Injectable } from '@nestjs/common';
import { EventEntity } from '../../domain/entities/event.entity';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';

/**
 * GetEventsByDateRangeUseCase
 * 日付範囲でのイベント一覧取得のユースケース
 */
@Injectable()
export class GetEventsByDateRangeUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  /**
   * 日付範囲でイベント一覧を取得
   */
  async execute(startDate: Date, endDate: Date): Promise<EventEntity[]> {
    return await this.eventRepository.findByDateRange(startDate, endDate);
  }
}
