import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateInstitutionUseCase } from '../../application/use-cases/create-institution.use-case';
import { GetInstitutionsUseCase } from '../../application/use-cases/get-institutions.use-case';
import { InstitutionType } from '@account-book/types';

// DTOs
class CreateInstitutionRequestDto {
  name: string;
  type: InstitutionType;
  credentials: Record<string, any>; // 平文の認証情報（JSON形式）
}

class GetInstitutionsQueryDto {
  type?: InstitutionType;
  isConnected?: string;
}

/**
 * 金融機関コントローラー
 */
@Controller('institutions')
export class InstitutionController {
  constructor(
    private readonly createInstitutionUseCase: CreateInstitutionUseCase,
    private readonly getInstitutionsUseCase: GetInstitutionsUseCase,
  ) {}

  /**
   * 金融機関を登録
   * POST /institutions
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateInstitutionRequestDto) {
    const institution = await this.createInstitutionUseCase.execute({
      name: body.name,
      type: body.type,
      credentials: body.credentials,
    });

    return {
      success: true,
      data: institution.toJSON(),
    };
  }

  /**
   * 金融機関一覧を取得
   * GET /institutions
   */
  @Get()
  async findAll(@Query() query: GetInstitutionsQueryDto) {
    const institutions = await this.getInstitutionsUseCase.execute({
      type: query.type,
      isConnected: query.isConnected ? query.isConnected === 'true' : undefined,
    });

    return {
      success: true,
      data: institutions.map((i) => i.toJSON()),
      count: institutions.length,
    };
  }
}

