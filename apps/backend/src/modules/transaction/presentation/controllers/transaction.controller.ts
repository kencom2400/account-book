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
} from '@nestjs/common';
import { CreateTransactionUseCase } from '../../application/use-cases/create-transaction.use-case';
import { GetTransactionsUseCase } from '../../application/use-cases/get-transactions.use-case';
import { UpdateTransactionCategoryUseCase } from '../../application/use-cases/update-transaction-category.use-case';
import { CalculateMonthlySummaryUseCase } from '../../application/use-cases/calculate-monthly-summary.use-case';
import { CategoryType, TransactionStatus } from '@account-book/types';

// DTOs
class CreateTransactionRequestDto {
  date: string;
  amount: number;
  category: {
    id: string;
    name: string;
    type: CategoryType;
  };
  description: string;
  institutionId: string;
  accountId: string;
  status?: TransactionStatus;
  relatedTransactionId?: string;
}

class GetTransactionsQueryDto {
  institutionId?: string;
  accountId?: string;
  year?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
}

class UpdateCategoryRequestDto {
  category: {
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
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionsUseCase: GetTransactionsUseCase,
    private readonly updateTransactionCategoryUseCase: UpdateTransactionCategoryUseCase,
    private readonly calculateMonthlySummaryUseCase: CalculateMonthlySummaryUseCase,
  ) {}

  /**
   * 取引を作成
   * POST /transactions
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateTransactionRequestDto) {
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
  async findAll(@Query() query: GetTransactionsQueryDto) {
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
  ) {
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
  ) {
    const transaction = await this.updateTransactionCategoryUseCase.execute({
      transactionId: id,
      category: body.category,
    });

    return {
      success: true,
      data: transaction.toJSON(),
    };
  }
}

