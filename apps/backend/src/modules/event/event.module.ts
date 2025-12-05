import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventController } from './presentation/controllers/event.controller';
import { EventTypeOrmRepository } from './infrastructure/repositories/event-typeorm.repository';
import { EventOrmEntity } from './infrastructure/entities/event.orm-entity';
import { EventTransactionRelationOrmEntity } from './infrastructure/entities/event-transaction-relation.orm-entity';
import { CreateEventUseCase } from './application/use-cases/create-event.use-case';
import { UpdateEventUseCase } from './application/use-cases/update-event.use-case';
import { DeleteEventUseCase } from './application/use-cases/delete-event.use-case';
import { GetEventByIdUseCase } from './application/use-cases/get-event-by-id.use-case';
import { GetEventsByDateRangeUseCase } from './application/use-cases/get-events-by-date-range.use-case';
import { LinkTransactionToEventUseCase } from './application/use-cases/link-transaction-to-event.use-case';
import { UnlinkTransactionFromEventUseCase } from './application/use-cases/unlink-transaction-from-event.use-case';
import { EVENT_REPOSITORY } from './domain/repositories/event.repository.interface';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventOrmEntity,
      EventTransactionRelationOrmEntity,
    ]),
    TransactionModule,
  ],
  controllers: [EventController],
  providers: [
    // Repository
    {
      provide: EVENT_REPOSITORY,
      useClass: EventTypeOrmRepository,
    },
    // Use Cases
    CreateEventUseCase,
    UpdateEventUseCase,
    DeleteEventUseCase,
    GetEventByIdUseCase,
    GetEventsByDateRangeUseCase,
    LinkTransactionToEventUseCase,
    UnlinkTransactionFromEventUseCase,
  ],
  exports: [EVENT_REPOSITORY],
})
export class EventModule {}
