import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseFilters,
} from '@nestjs/common';
import { CreateInstitutionUseCase } from '../../application/use-cases/create-institution.use-case';
import { GetInstitutionsUseCase } from '../../application/use-cases/get-institutions.use-case';
import { TestBankConnectionUseCase } from '../../application/use-cases/test-bank-connection.use-case';
import { GetSupportedBanksUseCase } from '../../application/use-cases/get-supported-banks.use-case';
import { CreateInstitutionDto } from '../dto/create-institution.dto';
import { GetInstitutionsQueryDto } from '../dto/get-institutions.dto';
import { TestBankConnectionDto } from '../dto/test-bank-connection.dto';
import { GetSupportedBanksQueryDto } from '../dto/get-supported-banks.dto';
import { BankConnectionExceptionFilter } from '../filters/bank-connection-exception.filter';

/**
 * 金融機関コントローラー
 */
@Controller('institutions')
@UseFilters(BankConnectionExceptionFilter)
export class InstitutionController {
  constructor(
    private readonly createInstitutionUseCase: CreateInstitutionUseCase,
    private readonly getInstitutionsUseCase: GetInstitutionsUseCase,
    private readonly testBankConnectionUseCase: TestBankConnectionUseCase,
    private readonly getSupportedBanksUseCase: GetSupportedBanksUseCase,
  ) {}

  /**
   * 金融機関を登録
   * POST /api/institutions
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateInstitutionDto) {
    const institution = await this.createInstitutionUseCase.execute(dto);

    return {
      success: true,
      data: institution.toJSON(),
    };
  }

  /**
   * 金融機関一覧を取得
   * GET /api/institutions
   */
  @Get()
  async findAll(@Query() query: GetInstitutionsQueryDto) {
    const institutions = await this.getInstitutionsUseCase.execute({
      type: query.type,
      isConnected: query.isConnected,
    });

    return {
      success: true,
      data: institutions.map((i) => i.toJSON()),
      count: institutions.length,
    };
  }

  /**
   * 対応銀行一覧を取得
   * GET /api/institutions/banks/supported
   */
  @Get('banks/supported')
  getSupportedBanks(@Query() query: GetSupportedBanksQueryDto) {
    const banks = this.getSupportedBanksUseCase.execute(query);

    return {
      success: true,
      data: banks,
      count: banks.length,
    };
  }

  /**
   * 銀行接続テスト
   * POST /api/institutions/banks/test-connection
   */
  @Post('banks/test-connection')
  @HttpCode(HttpStatus.OK)
  async testBankConnection(@Body() dto: TestBankConnectionDto) {
    const result = await this.testBankConnectionUseCase.execute(dto);

    // レスポンスの冗長性を解消: successはトップレベルのみ
    const { success, ...data } = result;
    return {
      success,
      data,
    };
  }
}

