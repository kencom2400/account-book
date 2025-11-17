import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConnectSecuritiesAccountUseCase } from '../../application/use-cases/connect-securities-account.use-case';
import { FetchHoldingsUseCase } from '../../application/use-cases/fetch-holdings.use-case';
import { FetchSecurityTransactionsUseCase } from '../../application/use-cases/fetch-security-transactions.use-case';
import { CalculatePortfolioValueUseCase } from '../../application/use-cases/calculate-portfolio-value.use-case';
import { ConnectSecuritiesAccountDto } from '../dto/connect-securities-account.dto';
import { GetHoldingsDto } from '../dto/get-holdings.dto';
import { GetSecurityTransactionsDto } from '../dto/get-transactions.dto';
import { GetPortfolioValueDto } from '../dto/get-portfolio-value.dto';

/**
 * SecuritiesController
 * 証券口座・保有銘柄・取引履歴に関するエンドポイント
 */
@Controller('api/securities')
export class SecuritiesController {
  private readonly logger = new Logger(SecuritiesController.name);

  constructor(
    private readonly connectSecuritiesAccountUseCase: ConnectSecuritiesAccountUseCase,
    private readonly fetchHoldingsUseCase: FetchHoldingsUseCase,
    private readonly fetchSecurityTransactionsUseCase: FetchSecurityTransactionsUseCase,
    private readonly calculatePortfolioValueUseCase: CalculatePortfolioValueUseCase,
  ) {}

  /**
   * POST /api/securities/connect
   * 証券口座との接続を確立する
   */
  @Post('connect')
  @HttpCode(HttpStatus.CREATED)
  async connect(@Body() dto: ConnectSecuritiesAccountDto) {
    this.logger.log(
      `Connecting to securities account: ${dto.securitiesCompanyName}`,
    );

    const account = await this.connectSecuritiesAccountUseCase.execute({
      securitiesCompanyName: dto.securitiesCompanyName,
      accountNumber: dto.accountNumber,
      accountType: dto.accountType,
      loginId: dto.loginId,
      password: dto.password,
      tradingPassword: dto.tradingPassword,
    });

    return {
      success: true,
      data: account.toJSON(),
      message: 'Securities account connected successfully',
    };
  }

  /**
   * GET /api/securities/:accountId/holdings
   * 保有銘柄を取得する
   */
  @Get(':accountId/holdings')
  @HttpCode(HttpStatus.OK)
  async getHoldings(@Query() dto: GetHoldingsDto) {
    this.logger.log(`Fetching holdings for account: ${dto.accountId}`);

    const holdings = await this.fetchHoldingsUseCase.execute({
      accountId: dto.accountId,
      forceRefresh: dto.forceRefresh || false,
    });

    return {
      success: true,
      data: holdings.map((h) => h.toJSON()),
      count: holdings.length,
    };
  }

  /**
   * GET /api/securities/:accountId/transactions
   * 証券取引履歴を取得する
   */
  @Get(':accountId/transactions')
  @HttpCode(HttpStatus.OK)
  async getTransactions(@Query() dto: GetSecurityTransactionsDto) {
    this.logger.log(`Fetching transactions for account: ${dto.accountId}`);

    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    const transactions = await this.fetchSecurityTransactionsUseCase.execute({
      accountId: dto.accountId,
      startDate,
      endDate,
      forceRefresh: dto.forceRefresh || false,
    });

    return {
      success: true,
      data: transactions.map((t) => t.toJSON()),
      count: transactions.length,
    };
  }

  /**
   * GET /api/securities/:accountId/portfolio
   * ポートフォリオ評価額を取得する
   */
  @Get(':accountId/portfolio')
  @HttpCode(HttpStatus.OK)
  async getPortfolioValue(@Query() dto: GetPortfolioValueDto) {
    this.logger.log(
      `Calculating portfolio value for account: ${dto.accountId}`,
    );

    const portfolioValue = await this.calculatePortfolioValueUseCase.execute({
      accountId: dto.accountId,
    });

    return {
      success: true,
      data: portfolioValue,
    };
  }
}
