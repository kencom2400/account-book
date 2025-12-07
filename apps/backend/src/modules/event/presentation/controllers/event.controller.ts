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
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateEventUseCase } from '../../application/use-cases/create-event.use-case';
import { UpdateEventUseCase } from '../../application/use-cases/update-event.use-case';
import { DeleteEventUseCase } from '../../application/use-cases/delete-event.use-case';
import { GetEventByIdUseCase } from '../../application/use-cases/get-event-by-id.use-case';
import { GetEventsByDateRangeUseCase } from '../../application/use-cases/get-events-by-date-range.use-case';
import { LinkTransactionToEventUseCase } from '../../application/use-cases/link-transaction-to-event.use-case';
import { UnlinkTransactionFromEventUseCase } from '../../application/use-cases/unlink-transaction-from-event.use-case';
import { SuggestRelatedTransactionsUseCase } from '../../application/use-cases/suggest-related-transactions.use-case';
import { GetEventFinancialSummaryUseCase } from '../../application/use-cases/get-event-financial-summary.use-case';
import { CreateEventRequestDto } from '../dto/create-event.dto';
import { UpdateEventRequestDto } from '../dto/update-event.dto';
import {
  EventResponseDto,
  EventFinancialSummaryResponseDto,
  SuggestedTransactionDto,
  toEventResponseDto,
  toEventSummaryDto,
  toTransactionDto,
} from '../dto/event-response.dto';
import { GetEventsByDateRangeQueryDto } from '../dto/get-events-query.dto';
import { LinkTransactionRequestDto } from '../dto/link-transaction.dto';

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
    private readonly suggestRelatedTransactionsUseCase: SuggestRelatedTransactionsUseCase,
    private readonly getEventFinancialSummaryUseCase: GetEventFinancialSummaryUseCase,
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
  }

  /**
   * 日付範囲でイベント一覧を取得
   * GET /api/events/date-range
   * 注意: このルートは@Get(':id')より前に定義する必要がある
   */
  @Get('date-range')
  @ApiOperation({ summary: '日付範囲でイベント一覧を取得' })
  @ApiResponse({ status: 200, description: 'イベント一覧取得成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  async findByDateRange(
    @Query() query: GetEventsByDateRangeQueryDto,
  ): Promise<{ success: boolean; data: EventResponseDto[] }> {
    const events = await this.getEventsByDateRangeUseCase.execute(
      new Date(query.startDate),
      new Date(query.endDate),
    );

    return {
      success: true,
      data: events.map((event) => toEventResponseDto(event, [])),
    };
  }

  /**
   * 関連取引の推奨取得
   * GET /api/events/:id/suggest-transactions
   * 注意: このルートは@Get(':id')より前に定義する必要がある
   */
  @Get(':id/suggest-transactions')
  @ApiOperation({ summary: '関連取引の推奨取得' })
  @ApiResponse({
    status: 200,
    description: '推奨取引取得成功',
    type: [SuggestedTransactionDto],
  })
  @ApiResponse({ status: 404, description: 'イベントが見つかりません' })
  async suggestRelatedTransactions(@Param('id') id: string): Promise<{
    success: boolean;
    data: SuggestedTransactionDto[];
  }> {
    const suggestions =
      await this.suggestRelatedTransactionsUseCase.execute(id);

    return {
      success: true,
      data: suggestions.map((suggestion) => ({
        transaction: toTransactionDto(suggestion.transaction),
        score: suggestion.score,
        reasons: suggestion.reasons,
      })),
    };
  }

  /**
   * イベント別収支サマリー取得
   * GET /api/events/:id/financial-summary
   * 注意: このルートは@Get(':id')より前に定義する必要がある
   */
  @Get(':id/financial-summary')
  @ApiOperation({ summary: 'イベント別収支サマリー取得' })
  @ApiResponse({
    status: 200,
    description: '収支サマリー取得成功',
    type: EventFinancialSummaryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'イベントが見つかりません' })
  async getFinancialSummary(@Param('id') id: string): Promise<{
    success: boolean;
    data: EventFinancialSummaryResponseDto;
  }> {
    const summary = await this.getEventFinancialSummaryUseCase.execute(id);

    return {
      success: true,
      data: {
        event: toEventSummaryDto(summary.event),
        relatedTransactions: summary.relatedTransactions.map((tx) =>
          toTransactionDto(tx),
        ),
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
        netAmount: summary.netAmount,
        transactionCount: summary.transactionCount,
      },
    };
  }

  /**
   * イベント詳細を取得
   * GET /api/events/:id
   * 注意: このルートは@Get('date-range')より後に定義する必要がある
   */
  @Get(':id')
  @ApiOperation({ summary: 'イベント詳細を取得' })
  @ApiResponse({ status: 200, description: 'イベント詳細取得成功' })
  @ApiResponse({ status: 404, description: 'イベントが見つかりません' })
  async findById(
    @Param('id') id: string,
  ): Promise<{ success: boolean; data: EventResponseDto }> {
    const result = await this.getEventByIdUseCase.execute(id);

    return {
      success: true,
      data: toEventResponseDto(result.event, result.relatedTransactions),
    };
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
    await this.deleteEventUseCase.execute(id);

    return {
      success: true,
      data: { message: 'イベントを削除しました' },
    };
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
    @Body() body: LinkTransactionRequestDto,
  ): Promise<{ success: boolean; data: { message: string } }> {
    await this.linkTransactionToEventUseCase.execute(
      eventId,
      body.transactionId,
    );

    return {
      success: true,
      data: { message: '取引とイベントを紐付けました' },
    };
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
    await this.unlinkTransactionFromEventUseCase.execute(
      eventId,
      transactionId,
    );

    return {
      success: true,
      data: { message: '取引とイベントの紐付けを解除しました' },
    };
  }
}
