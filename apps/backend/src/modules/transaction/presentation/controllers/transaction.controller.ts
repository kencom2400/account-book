import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  Res,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  IsString,
  IsNumber,
  IsObject,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { GetTransactionsUseCase } from '../../application/use-cases/get-transactions.use-case';
import { GetTransactionByIdUseCase } from '../../application/use-cases/get-transaction-by-id.use-case';
import { UpdateTransactionCategoryUseCase } from '../../application/use-cases/update-transaction-category.use-case';
import { CalculateMonthlySummaryUseCase } from '../../application/use-cases/calculate-monthly-summary.use-case';
import { ClassifyTransactionUseCase } from '../../application/use-cases/classify-transaction.use-case';
import { ExportTransactionsUseCase } from '../../application/use-cases/export-transactions.use-case';
import { ExportFormat } from '../../application/services/export.service';
import { CategoryType, TransactionStatus } from '@account-book/types';
import { TransactionJSONResponse } from '../../domain/entities/transaction.entity';
import type { MonthlySummary } from '../../application/use-cases/calculate-monthly-summary.use-case';

// DTOs
class ClassifyTransactionDto {
  @IsNumber()
  amount!: number;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsString()
  institutionType?: string;
}

class CreateTransactionRequestDto {
  @IsString()
  date!: string;

  @IsNumber()
  amount!: number;

  @IsObject()
  category!: {
    id: string;
    name: string;
    type: CategoryType;
  };

  @IsString()
  description!: string;

  @IsString()
  institutionId!: string;

  @IsString()
  accountId!: string;

  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsString()
  relatedTransactionId?: string;
}

class GetTransactionsQueryDto {
  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  month?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

class ExportTransactionsQueryDto extends GetTransactionsQueryDto {
  @IsEnum(ExportFormat)
  format!: ExportFormat;
}

class UpdateCategoryRequestDto {
  @IsObject()
  category!: {
    id: string;
    name: string;
    type: CategoryType;
  };
}

/**
 * 取引コントローラー
 */
@Controller('transactions')
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionsUseCase: GetTransactionsUseCase,
    private readonly getTransactionByIdUseCase: GetTransactionByIdUseCase,
    private readonly updateTransactionCategoryUseCase: UpdateTransactionCategoryUseCase,
    private readonly calculateMonthlySummaryUseCase: CalculateMonthlySummaryUseCase,
    private readonly classifyTransactionUseCase: ClassifyTransactionUseCase,
    private readonly exportTransactionsUseCase: ExportTransactionsUseCase,
  ) {}

  /**
   * 取引データのカテゴリを自動分類
   * POST /transactions/classify
   *
   * FR-008: 5種類のカテゴリ自動分類機能
   */
  @Post('classify')
  @HttpCode(HttpStatus.OK)
  async classify(@Body() body: ClassifyTransactionDto): Promise<{
    success: boolean;
    data: {
      category: {
        id: string;
        name: string;
        type: CategoryType;
      };
      confidence: number;
      confidenceLevel: 'high' | 'medium' | 'low';
      reason: string;
    };
  }> {
    const result = await this.classifyTransactionUseCase.execute(body);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 取引を作成
   * POST /transactions
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateTransactionRequestDto): Promise<{
    success: boolean;
    data: TransactionJSONResponse;
  }> {
    const transaction = await this.createTransactionUseCase.execute({
      date: new Date(body.date),
      amount: body.amount,
      category: body.category,
      description: body.description,
      institutionId: body.institutionId,
      accountId: body.accountId,
      status: body.status,
      relatedTransactionId: body.relatedTransactionId,
    });

    return {
      success: true,
      data: transaction.toJSON(),
    };
  }

  /**
   * 取引一覧を取得
   * GET /transactions
   */
  @Get()
  async findAll(@Query() query: GetTransactionsQueryDto): Promise<{
    success: boolean;
    data: TransactionJSONResponse[];
    count: number;
  }> {
    const transactions = await this.getTransactionsUseCase.execute({
      institutionId: query.institutionId,
      accountId: query.accountId,
      year: query.year ? parseInt(query.year) : undefined,
      month: query.month ? parseInt(query.month) : undefined,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });

    return {
      success: true,
      data: transactions.map((t) => t.toJSON()),
      count: transactions.length,
    };
  }

  /**
   * 月次集計を取得
   * GET /transactions/summary/monthly/:year/:month
   */
  @Get('summary/monthly/:year/:month')
  async getMonthlySummary(
    @Param('year') year: string,
    @Param('month') month: string,
  ): Promise<{
    success: boolean;
    data: MonthlySummary;
  }> {
    const summary = await this.calculateMonthlySummaryUseCase.execute(
      parseInt(year),
      parseInt(month),
    );

    return {
      success: true,
      data: summary,
    };
  }

  /**
   * 取引のカテゴリを更新
   * PATCH /transactions/:id/category
   */
  @Patch(':id/category')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: UpdateCategoryRequestDto,
  ): Promise<{
    success: boolean;
    data: TransactionJSONResponse;
  }> {
    this.logger.log(
      `PATCH /api/transactions/${id}/category - カテゴリ更新リクエスト受信`,
    );
    const transaction = await this.updateTransactionCategoryUseCase.execute({
      transactionId: id,
      category: body.category,
    });

    const response = {
      success: true,
      data: transaction.toJSON(),
    };
    this.logger.log(
      `PATCH /api/transactions/${id}/category - レスポンス送信開始: ${JSON.stringify(response).substring(0, 100)}...`,
    );
    const result = response;
    this.logger.log(
      `PATCH /api/transactions/${id}/category - レスポンス送信完了`,
    );
    return result;
  }

  /**
   * 取引データをエクスポート
   * GET /transactions/export
   *
   * FR-031: データエクスポート機能
   */
  @Get('export')
  async export(
    @Query() query: ExportTransactionsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const { year, month, startDate, endDate, ...rest } = query;
    const result = await this.exportTransactionsUseCase.execute({
      ...rest,
      year: year ? parseInt(year) : undefined,
      month: month ? parseInt(month) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.content);
  }

  /**
   * 取引をIDで取得
   * GET /transactions/:id
   * Issue #109: [TASK] E-3: 取引詳細画面の実装
   * 注意: このルートは他の具体的なルート（export, summary/monthlyなど）より後に定義する必要がある
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<{
    success: boolean;
    data: TransactionJSONResponse;
  }> {
    const transaction = await this.getTransactionByIdUseCase.execute(id);

    return {
      success: true,
      data: transaction.toJSON(),
    };
  }
}
