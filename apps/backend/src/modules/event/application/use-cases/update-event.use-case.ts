import { Inject, Injectable } from '@nestjs/common';
import { EventEntity } from '../../domain/entities/event.entity';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';
import { EventCategory } from '../../domain/enums/event-category.enum';
import { EventNotFoundException } from '../../domain/errors/event.errors';

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
      throw new EventNotFoundException(id);
    }

    const updatedEvent = event.update(
      dto.title,
      dto.date,
      dto.description,
      dto.category,
    );

    // タグの更新（差分のみを更新してパフォーマンスを改善）
    let eventWithTags = updatedEvent;
    if (dto.tags !== undefined) {
      const currentTags = new Set(updatedEvent.tags);
      const newTags = new Set(dto.tags);

      // 不要になったタグを削除
      for (const tag of currentTags) {
        if (!newTags.has(tag)) {
          eventWithTags = eventWithTags.removeTag(tag);
        }
      }

      // 新しく追加されたタグを追加
      for (const tag of newTags) {
        if (!currentTags.has(tag)) {
          eventWithTags = eventWithTags.addTag(tag);
        }
      }
    }

    return await this.eventRepository.save(eventWithTags);
  }
}
