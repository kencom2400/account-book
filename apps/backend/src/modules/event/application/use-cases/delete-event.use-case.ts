import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IEventRepository } from '../../domain/repositories/event.repository.interface';
import { EVENT_REPOSITORY } from '../../domain/repositories/event.repository.interface';

/**
 * DeleteEventUseCase
 * イベント削除のユースケース
 */
@Injectable()
export class DeleteEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: IEventRepository,
  ) {}

  /**
   * イベントを削除
   * 関連取引との紐付けはCASCADE削除により自動的に解除される
   */
  async execute(id: string): Promise<void> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    await this.eventRepository.delete(id);
  }
}
