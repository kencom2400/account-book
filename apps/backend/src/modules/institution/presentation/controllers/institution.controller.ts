import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseFilters,
} from '@nestjs/common';
import { CreateInstitutionUseCase } from '../../application/use-cases/create-institution.use-case';
import { GetInstitutionsUseCase } from '../../application/use-cases/get-institutions.use-case';
import { TestBankConnectionUseCase } from '../../application/use-cases/test-bank-connection.use-case';
import { GetSupportedBanksUseCase } from '../../application/use-cases/get-supported-banks.use-case';
import { UpdateInstitutionUseCase } from '../../application/use-cases/update-institution.use-case';
import { CreateInstitutionDto } from '../dto/create-institution.dto';
import { UpdateInstitutionDto } from '../dto/update-institution.dto';
import { GetInstitutionsQueryDto } from '../dto/get-institutions.dto';
import { TestBankConnectionDto } from '../dto/test-bank-connection.dto';
import { GetSupportedBanksQueryDto } from '../dto/get-supported-banks.dto';
import { BankConnectionExceptionFilter } from '../filters/bank-connection-exception.filter';
import { InstitutionJSONResponse } from '../../domain/entities/institution.entity';

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
    private readonly updateInstitutionUseCase: UpdateInstitutionUseCase,
  ) {}

  /**
   * 金融機関を登録
   * POST /api/institutions
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateInstitutionDto): Promise<{
    success: boolean;
    data: InstitutionJSONResponse;
  }> {
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
  async findAll(@Query() query: GetInstitutionsQueryDto): Promise<{
    success: boolean;
    data: InstitutionJSONResponse[];
    count: number;
  }> {
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
  getSupportedBanks(@Query() query: GetSupportedBanksQueryDto): {
    success: boolean;
    data: unknown[];
    count: number;
  } {
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
  async testBankConnection(@Body() dto: TestBankConnectionDto): Promise<{
    success: boolean;
    data: Record<string, unknown>;
  }> {
    const result = await this.testBankConnectionUseCase.execute(dto);

    // レスポンスの冗長性を解消: successはトップレベルのみ
    const { success, ...data } = result;
    return {
      success,
      data,
    };
  }

  /**
   * 金融機関を更新
   * PATCH /api/institutions/:id
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInstitutionDto,
  ): Promise<{
    success: boolean;
    data: InstitutionJSONResponse;
  }> {
    const institution = await this.updateInstitutionUseCase.execute(id, dto);

    return {
      success: true,
      data: institution.toJSON(),
    };
  }
}
