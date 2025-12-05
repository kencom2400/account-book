import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateEventUseCase } from '../../application/use-cases/create-event.use-case';
import { UpdateEventUseCase } from '../../application/use-cases/update-event.use-case';
import { DeleteEventUseCase } from '../../application/use-cases/delete-event.use-case';
import { GetEventByIdUseCase } from '../../application/use-cases/get-event-by-id.use-case';
import { GetEventsByDateRangeUseCase } from '../../application/use-cases/get-events-by-date-range.use-case';
import { LinkTransactionToEventUseCase } from '../../application/use-cases/link-transaction-to-event.use-case';
import { UnlinkTransactionFromEventUseCase } from '../../application/use-cases/unlink-transaction-from-event.use-case';
import { CreateEventRequestDto } from '../dto/create-event.dto';
import { UpdateEventRequestDto } from '../dto/update-event.dto';
import {
  EventResponseDto,
  toEventResponseDto,
} from '../dto/event-response.dto';
import {
  GetEventsQueryDto,
  GetEventsByDateRangeQueryDto,
} from '../dto/get-events-query.dto';
import { EventCategory } from '../../domain/enums/event-category.enum';

/**
 * EventController
 * イベントメモ機能のAPIエンドポイント
 */
@ApiTags('events')
@Controller('events')
export class EventController {
  constructor(
    private readonly createEventUseCase: CreateEventUseCase,
    private readonly updateEventUseCase: UpdateEventUseCase,
    private readonly deleteEventUseCase: DeleteEventUseCase,
    private readonly getEventByIdUseCase: GetEventByIdUseCase,
    private readonly getEventsByDateRangeUseCase: GetEventsByDateRangeUseCase,
    private readonly linkTransactionToEventUseCase: LinkTransactionToEventUseCase,
    private readonly unlinkTransactionFromEventUseCase: UnlinkTransactionFromEventUseCase,
  ) {}

  /**
   * イベントを作成
   * POST /api/events
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'イベントを作成' })
  @ApiResponse({ status: 201, description: 'イベント作成成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  async create(
    @Body() dto: CreateEventRequestDto,
  ): Promise<{ success: boolean; data: EventResponseDto }> {
    try {
      const event = await this.createEventUseCase.execute({
        date: new Date(dto.date),
        title: dto.title,
        description: dto.description ?? null,
        category: dto.category,
        tags: dto.tags ?? [],
      });

      return {
        success: true,
        data: toEventResponseDto(event, []),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * イベント一覧を取得
   * GET /api/events
   * 注意: 現在は日付範囲での取得のみ実装（将来、全件取得を追加予定）
   */
  @Get()
  @ApiOperation({ summary: 'イベント一覧を取得' })
  @ApiResponse({ status: 200, description: 'イベント一覧取得成功' })
  findAll(
    @Query() _query: GetEventsQueryDto,
  ): Promise<{ success: boolean; data: EventResponseDto[]; total: number }> {
    // 現在は日付範囲での取得のみ実装
    // 将来、全件取得を追加する場合はここに実装
    throw new BadRequestException({
      success: false,
      statusCode: 400,
      message:
        '現在は日付範囲での取得のみサポートしています。GET /api/events/date-range を使用してください。',
    });
  }

  /**
   * イベント詳細を取得
   * GET /api/events/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'イベント詳細を取得' })
  @ApiResponse({ status: 200, description: 'イベント詳細取得成功' })
  @ApiResponse({ status: 404, description: 'イベントが見つかりません' })
  async findById(
    @Param('id') id: string,
  ): Promise<{ success: boolean; data: EventResponseDto }> {
    try {
      const result = await this.getEventByIdUseCase.execute(id);

      return {
        success: true,
        data: toEventResponseDto(
          {
            id: result.id,
            date: result.date,
            title: result.title,
            description: result.description,
            category: result.category as EventCategory,
            tags: result.tags,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
          },
          result.relatedTransactions,
        ),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 日付範囲でイベント一覧を取得
   * GET /api/events/date-range
   */
  @Get('date-range')
  @ApiOperation({ summary: '日付範囲でイベント一覧を取得' })
  @ApiResponse({ status: 200, description: 'イベント一覧取得成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  async findByDateRange(
    @Query() query: GetEventsByDateRangeQueryDto,
  ): Promise<{ success: boolean; data: EventResponseDto[] }> {
    if (!query.startDate || !query.endDate) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: 'startDateとendDateは必須です',
      });
    }

    try {
      const events = await this.getEventsByDateRangeUseCase.execute(
        new Date(query.startDate),
        new Date(query.endDate),
      );

      return {
        success: true,
        data: events.map((event) => toEventResponseDto(event, [])),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * イベントを更新
   * PUT /api/events/:id
   */
  @Put(':id')
  @ApiOperation({ summary: 'イベントを更新' })
  @ApiResponse({ status: 200, description: 'イベント更新成功' })
  @ApiResponse({ status: 404, description: 'イベントが見つかりません' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEventRequestDto,
  ): Promise<{ success: boolean; data: EventResponseDto }> {
    try {
      const event = await this.updateEventUseCase.execute(id, {
        date: dto.date ? new Date(dto.date) : undefined,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        tags: dto.tags,
      });

      return {
        success: true,
        data: toEventResponseDto(event, []),
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * イベントを削除
   * DELETE /api/events/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'イベントを削除' })
  @ApiResponse({ status: 200, description: 'イベント削除成功' })
  @ApiResponse({ status: 404, description: 'イベントが見つかりません' })
  async delete(
    @Param('id') id: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    try {
      await this.deleteEventUseCase.execute(id);

      return {
        success: true,
        data: { message: 'イベントを削除しました' },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 取引とイベントを紐付け
   * POST /api/events/:id/transactions
   */
  @Post(':id/transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取引とイベントを紐付け' })
  @ApiResponse({ status: 200, description: '紐付け成功' })
  @ApiResponse({
    status: 404,
    description: 'イベントまたは取引が見つかりません',
  })
  async linkTransaction(
    @Param('id') eventId: string,
    @Body() body: { transactionId: string },
  ): Promise<{ success: boolean; data: { message: string } }> {
    try {
      await this.linkTransactionToEventUseCase.execute(
        eventId,
        body.transactionId,
      );

      return {
        success: true,
        data: { message: '取引とイベントを紐付けました' },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * 取引とイベントの紐付けを解除
   * DELETE /api/events/:id/transactions/:transactionId
   */
  @Delete(':id/transactions/:transactionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '取引とイベントの紐付けを解除' })
  @ApiResponse({ status: 200, description: '紐付け解除成功' })
  @ApiResponse({ status: 404, description: 'イベントが見つかりません' })
  async unlinkTransaction(
    @Param('id') eventId: string,
    @Param('transactionId') transactionId: string,
  ): Promise<{ success: boolean; data: { message: string } }> {
    try {
      await this.unlinkTransactionFromEventUseCase.execute(
        eventId,
        transactionId,
      );

      return {
        success: true,
        data: { message: '取引とイベントの紐付けを解除しました' },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * エラーハンドリング
   */
  private handleError(error: unknown): never {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException({
          success: false,
          statusCode: 404,
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }

      if (
        error.message.includes('required') ||
        error.message.includes('must be') ||
        error.message.includes('validation')
      ) {
        throw new BadRequestException({
          success: false,
          statusCode: 400,
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // その他のエラー
    throw error;
  }
}
