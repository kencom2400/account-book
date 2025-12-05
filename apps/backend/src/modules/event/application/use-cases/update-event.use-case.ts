import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEntity } from '../../domain/entities/event.entity';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import { EventCategory } from '../../domain/enums/event-category.enum';

/**
 * UpdateEventDto
 * イベント更新のリクエストDTO
 */
export interface UpdateEventDto {
  date?: Date;
  title?: string;
  description?: string | null;
  category?: EventCategory;
  tags?: string[];
}

/**
 * UpdateEventUseCase
 * イベント更新のユースケース
 */
@Injectable()
export class UpdateEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  /**
   * イベントを更新
   */
  async execute(id: string, dto: UpdateEventDto): Promise<EventEntity> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    const updatedEvent = event.update(
      dto.title,
      dto.date,
      dto.description,
      dto.category,
    );

    // タグの更新
    let eventWithTags = updatedEvent;
    if (dto.tags !== undefined) {
      // 既存のタグをすべて削除してから新しいタグを追加
      eventWithTags = updatedEvent;
      for (const tag of updatedEvent.tags) {
        eventWithTags = eventWithTags.removeTag(tag);
      }
      for (const tag of dto.tags) {
        eventWithTags = eventWithTags.addTag(tag);
      }
    }

    return await this.eventRepository.save(eventWithTags);
  }
}
