import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InitializeCategoriesUseCase } from '../../application/use-cases/initialize-categories.use-case';
import { GetCategoriesUseCase } from '../../application/use-cases/get-categories.use-case';
import { GetCategoryByIdUseCase } from '../../application/use-cases/get-category-by-id.use-case';
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '../../application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from '../../application/use-cases/delete-category.use-case';
import { CheckCategoryUsageUseCase } from '../../application/use-cases/check-category-usage.use-case';
import { CategoryEntity } from '../../domain/entities/category.entity';
import { CategoryNode } from '../../domain/services/category-domain.service';
import { CategoryType } from '@account-book/types';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import {
  CategoryResponseDto,
  DeleteCategoryResponseDto,
  CategoryUsageResponseDto,
} from '../dto/category-response.dto';

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
    private readonly getCategoryByIdUseCase: GetCategoryByIdUseCase,
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly checkCategoryUsageUseCase: CheckCategoryUsageUseCase,
  ) {}

  /**
   * カテゴリを初期化（デフォルトカテゴリを作成）
   * POST /categories/initialize
   */
  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  async initialize(): Promise<{
    success: boolean;
    data: ReturnType<CategoryEntity['toJSON']>[];
    count: number;
    message: string;
  }> {
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
  async findAll(@Query() query: GetCategoriesQueryDto): Promise<
    | {
        success: boolean;
        data: CategoryNode[];
      }
    | {
        success: boolean;
        data: (ReturnType<CategoryEntity['toJSON']> | CategoryNode)[];
        count: number;
      }
  > {
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
        data: result as CategoryNode[],
      };
    }

    // 配列の場合はtoJSONを適用
    const categories = Array.isArray(result) ? result : [];

    return {
      success: true,
      data: categories.map((c: CategoryEntity | CategoryNode) => {
        if (c instanceof CategoryEntity) {
          return c.toJSON();
        }
        return c;
      }),
      count: categories.length,
    };
  }

  /**
   * 費目を追加
   * POST /categories
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const result = await this.createCategoryUseCase.execute({
      name: dto.name,
      type: dto.type,
      parentId: dto.parentId,
      icon: dto.icon,
      color: dto.color,
    });

    return result.category.toJSON();
  }

  /**
   * 費目を単一取得
   * GET /categories/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    const result = await this.getCategoryByIdUseCase.execute(id);
    return result.category.toJSON();
  }

  /**
   * 費目を更新
   * PUT /categories/:id
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const result = await this.updateCategoryUseCase.execute(id, {
      name: dto.name,
      icon: dto.icon,
      color: dto.color,
    });

    return result.category.toJSON();
  }

  /**
   * 費目を削除
   * DELETE /categories/:id
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Query('replacementCategoryId') replacementCategoryId?: string,
  ): Promise<DeleteCategoryResponseDto> {
    return this.deleteCategoryUseCase.execute(id, replacementCategoryId);
  }

  /**
   * 費目使用状況を確認
   * GET /categories/:id/usage
   */
  @Get(':id/usage')
  async checkUsage(@Param('id') id: string): Promise<CategoryUsageResponseDto> {
    return this.checkCategoryUsageUseCase.execute(id);
  }
}
