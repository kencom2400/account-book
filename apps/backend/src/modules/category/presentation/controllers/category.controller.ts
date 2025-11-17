import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InitializeCategoriesUseCase } from '../../application/use-cases/initialize-categories.use-case';
import { GetCategoriesUseCase } from '../../application/use-cases/get-categories.use-case';
import { CategoryType } from '@account-book/types';

// DTOs
class GetCategoriesQueryDto {
  type?: CategoryType;
  parentId?: string;
  isTopLevel?: string;
  asTree?: string;
}

/**
 * カテゴリコントローラー
 */
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly initializeCategoriesUseCase: InitializeCategoriesUseCase,
    private readonly getCategoriesUseCase: GetCategoriesUseCase,
  ) {}

  /**
   * カテゴリを初期化（デフォルトカテゴリを作成）
   * POST /categories/initialize
   */
  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  async initialize() {
    const categories = await this.initializeCategoriesUseCase.execute();

    return {
      success: true,
      data: categories.map((c) => c.toJSON()),
      count: categories.length,
      message: 'Categories initialized successfully',
    };
  }

  /**
   * カテゴリ一覧を取得
   * GET /categories
   */
  @Get()
  async findAll(@Query() query: GetCategoriesQueryDto) {
    const result = await this.getCategoriesUseCase.execute({
      type: query.type,
      parentId: query.parentId,
      isTopLevel: query.isTopLevel === 'true',
      asTree: query.asTree === 'true',
    });

    // ツリー構造の場合はそのまま返す
    if (query.asTree === 'true') {
      return {
        success: true,
        data: result,
      };
    }

    // 配列の場合はtoJSONを適用
    const categories = Array.isArray(result) ? result : [];
    return {
      success: true,
      data: categories.map((c: any) => c.toJSON()),
      count: categories.length,
    };
  }
}
