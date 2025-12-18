import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { ConnectCreditCardUseCase } from '../../application/use-cases/connect-credit-card.use-case';
import { FetchCreditCardTransactionsUseCase } from '../../application/use-cases/fetch-credit-card-transactions.use-case';
import { FetchPaymentInfoUseCase } from '../../application/use-cases/fetch-payment-info.use-case';
import { RefreshCreditCardDataUseCase } from '../../application/use-cases/refresh-credit-card-data.use-case';
import { GetSupportedCardCompaniesUseCase } from '../../application/use-cases/get-supported-card-companies.use-case';
import { TestCreditCardConnectionUseCase } from '../../application/use-cases/test-credit-card-connection.use-case';
import type { ICreditCardRepository } from '../../domain/repositories/credit-card.repository.interface';
import { ConnectCreditCardDto } from '../dto/connect-credit-card.dto';
import { GetTransactionsDto } from '../dto/get-transactions.dto';
import { GetPaymentInfoDto } from '../dto/get-payment-info.dto';
import { GetSupportedCardCompaniesQueryDto } from '../dto/get-supported-card-companies.dto';
import { TestCreditCardConnectionDto } from '../dto/test-credit-card-connection.dto';
import { CREDIT_CARD_REPOSITORY } from '../../credit-card.tokens';
import { CreditCardJSONResponse } from '../../domain/entities/credit-card.entity';
import { CreditCardTransactionJSONResponse } from '../../domain/entities/credit-card-transaction.entity';
import { PaymentJSONResponse } from '../../domain/value-objects/payment.vo';
import {
  CardCompany,
  CreditCardConnectionTestResult,
} from '@account-book/types';

@Controller('api/credit-cards')
export class CreditCardController {
  constructor(
    private readonly connectCreditCardUseCase: ConnectCreditCardUseCase,
    private readonly fetchTransactionsUseCase: FetchCreditCardTransactionsUseCase,
    private readonly fetchPaymentInfoUseCase: FetchPaymentInfoUseCase,
    private readonly refreshCreditCardDataUseCase: RefreshCreditCardDataUseCase,
    private readonly getSupportedCardCompaniesUseCase: GetSupportedCardCompaniesUseCase,
    private readonly testCreditCardConnectionUseCase: TestCreditCardConnectionUseCase,
    @Inject(CREDIT_CARD_REPOSITORY)
    private readonly creditCardRepository: ICreditCardRepository,
  ) {}

  /**
   * 対応カード会社一覧を取得
   * GET /api/credit-cards/companies/supported
   */
  @Get('companies/supported')
  getSupportedCardCompanies(
    @Query() query: GetSupportedCardCompaniesQueryDto,
  ): {
    success: boolean;
    data: CardCompany[];
    count: number;
  } {
    const companies = this.getSupportedCardCompaniesUseCase.execute(query);

    return {
      success: true,
      data: companies,
      count: companies.length,
    };
  }

  /**
   * クレジットカード接続テスト
   * POST /api/credit-cards/test-connection
   */
  @Post('test-connection')
  @HttpCode(HttpStatus.OK)
  async testCreditCardConnection(
    @Body() dto: TestCreditCardConnectionDto,
  ): Promise<{
    success: boolean;
    data: CreditCardConnectionTestResult;
  }> {
    const result = await this.testCreditCardConnectionUseCase.execute(dto);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * POST /api/credit-cards/connect
   * クレジットカードと連携する
   */
  @Post('connect')
  @HttpCode(HttpStatus.CREATED)
  async connect(@Body() dto: ConnectCreditCardDto): Promise<{
    success: boolean;
    data: CreditCardJSONResponse;
  }> {
    const creditCard = await this.connectCreditCardUseCase.execute({
      cardName: dto.cardName,
      cardNumber: dto.cardNumber,
      cardHolderName: dto.cardHolderName,
      expiryDate: new Date(dto.expiryDate),
      username: dto.username,
      password: dto.password,
      issuer: dto.issuer,
      paymentDay: dto.paymentDay,
      closingDay: dto.closingDay,
    });

    return {
      success: true,
      data: creditCard.toJSON(),
    };
  }

  /**
   * GET /api/credit-cards
   * 全てのクレジットカードを取得
   */
  @Get()
  async findAll(): Promise<{
    success: boolean;
    data: CreditCardJSONResponse[];
  }> {
    const creditCards = await this.creditCardRepository.findAll();

    return {
      success: true,
      data: creditCards.map((card) => card.toJSON()),
    };
  }

  /**
   * GET /api/credit-cards/:id
   * クレジットカードを取得
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{
    success: boolean;
    data: CreditCardJSONResponse;
  }> {
    const creditCard = await this.creditCardRepository.findById(id);

    if (!creditCard) {
      // HttpExceptionFilterが統一されたエラーレスポンス形式で処理
      throw new NotFoundException({
        message: 'Credit card not found',
        code: 'CREDIT_CARD_NOT_FOUND',
      });
    }

    return {
      success: true,
      data: creditCard.toJSON(),
    };
  }

  /**
   * GET /api/credit-cards/:id/transactions
   * クレジットカードの取引履歴を取得
   */
  @Get(':id/transactions')
  async getTransactions(
    @Param('id') id: string,
    @Query() query: GetTransactionsDto,
  ): Promise<{
    success: boolean;
    data: CreditCardTransactionJSONResponse[];
    count: number;
  }> {
    const transactions = await this.fetchTransactionsUseCase.execute({
      creditCardId: id,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      forceRefresh: query.forceRefresh === 'true',
    });

    return {
      success: true,
      data: transactions.map((tx) => tx.toJSON()),
      count: transactions.length,
    };
  }

  /**
   * GET /api/credit-cards/:id/payment-info
   * クレジットカードの支払い情報を取得
   */
  @Get(':id/payment-info')
  async getPaymentInfo(
    @Param('id') id: string,
    @Query() query: GetPaymentInfoDto,
  ): Promise<{
    success: boolean;
    data: PaymentJSONResponse;
  }> {
    const payment = await this.fetchPaymentInfoUseCase.execute({
      creditCardId: id,
      billingMonth: query.billingMonth,
      forceRefresh: query.forceRefresh === 'true',
    });

    return {
      success: true,
      data: payment.toJSON(),
    };
  }

  /**
   * DELETE /api/credit-cards/:id
   * クレジットカードを削除
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.creditCardRepository.delete(id);
  }

  /**
   * POST /api/credit-cards/:id/refresh
   * クレジットカード情報を再同期
   */
  @Post(':id/refresh')
  async refresh(@Param('id') id: string): Promise<{
    success: boolean;
    data: {
      creditCard: CreditCardJSONResponse;
      transactions: CreditCardTransactionJSONResponse[];
      payment: PaymentJSONResponse;
    };
    message: string;
  }> {
    const result = await this.refreshCreditCardDataUseCase.execute(id);

    return {
      success: true,
      data: {
        creditCard: result.creditCard.toJSON(),
        transactions: result.transactions.map((tx) => tx.toJSON()),
        payment: result.payment.toJSON(),
      },
      message: 'Credit card data refreshed successfully',
    };
  }
}
