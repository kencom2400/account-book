import { Inject, Injectable } from '@nestjs/common';
import { EventEntity } from '../../domain/entities/event.entity';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import { EventCategory } from '../../domain/enums/event-category.enum';

/**
 * CreateEventDto
 * イベント作成のリクエストDTO
 */
export interface CreateEventDto {
  date: Date;
  title: string;
  description?: string | null;
  category: EventCategory;
  tags?: string[];
}

/**
 * CreateEventUseCase
 * イベント作成のユースケース
 */
@Injectable()
export class CreateEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  /**
   * イベントを作成
   */
  async execute(dto: CreateEventDto): Promise<EventEntity> {
    const event = EventEntity.create(
      dto.date,
      dto.title,
      dto.description ?? null,
      dto.category,
      dto.tags ?? [],
    );

    return await this.eventRepository.save(event);
  }
}
