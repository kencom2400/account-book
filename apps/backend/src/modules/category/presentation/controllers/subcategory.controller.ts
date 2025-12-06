import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CategoryType } from '@account-book/types';
import { GetSubcategoriesUseCase } from '../../application/use-cases/get-subcategories.use-case';
import { GetSubcategoriesByCategoryUseCase } from '../../application/use-cases/get-subcategories-by-category.use-case';
import { ClassifySubcategoryUseCase } from '../../application/use-cases/classify-subcategory.use-case';
import { UpdateTransactionSubcategoryUseCase } from '../../application/use-cases/update-transaction-subcategory.use-case';
import { ClassificationRequestDto } from '../dto/classification-request.dto';
import { ClassificationResponseDto } from '../dto/classification-response.dto';
import {
  SubcategoryListResponseDto,
  SubcategoryResponseDto,
} from '../dto/subcategory-response.dto';
import { UpdateSubcategoryRequestDto } from '../dto/update-subcategory-request.dto';
import { UpdateSubcategoryResponseDto } from '../dto/update-subcategory-response.dto';

/**
 * サブカテゴリコントローラー
 * FR-009: 詳細費目分類機能
 */
@ApiTags('subcategories')
@Controller('subcategories')
export class SubcategoryController {
  private readonly logger = new Logger(SubcategoryController.name);

  constructor(
    private readonly getSubcategoriesUseCase: GetSubcategoriesUseCase,
    private readonly getSubcategoriesByCategoryUseCase: GetSubcategoriesByCategoryUseCase,
    private readonly classifySubcategoryUseCase: ClassifySubcategoryUseCase,
    private readonly updateTransactionSubcategoryUseCase: UpdateTransactionSubcategoryUseCase,
  ) {}

  /**
   * 全サブカテゴリ一覧を取得
   * GET /api/subcategories
   */
  @Get()
  @ApiOperation({
    summary: '全サブカテゴリ一覧を取得',
    description: '全サブカテゴリを階層構造で取得します',
  })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: SubcategoryListResponseDto,
  })
  async getAll(): Promise<SubcategoryListResponseDto> {
    this.logger.log('全サブカテゴリ一覧を取得中...');

    const result = await this.getSubcategoriesUseCase.execute();

    // SubcategoryTreeItemをSubcategoryResponseDtoに変換
    const data: SubcategoryResponseDto[] = result.subcategories.map((item) => ({
      id: item.id,
      categoryType: item.categoryType as CategoryType,
      name: item.name,
      parentId: item.parentId,
      displayOrder: item.displayOrder,
      icon: item.icon,
      color: item.color,
      isDefault: item.isDefault,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      children: item.children?.map((child) => ({
        id: child.id,
        categoryType: child.categoryType as CategoryType,
        name: child.name,
        parentId: child.parentId,
        displayOrder: child.displayOrder,
        icon: child.icon,
        color: child.color,
        isDefault: child.isDefault,
        isActive: child.isActive,
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
      })),
    }));

    return {
      success: true,
      data,
      total: result.total,
    };
  }

  /**
   * カテゴリタイプ別にサブカテゴリを取得
   * GET /api/subcategories/category/:categoryType
   */
  @Get('category/:categoryType')
  @ApiOperation({
    summary: 'カテゴリタイプ別にサブカテゴリを取得',
    description: '指定されたカテゴリタイプのサブカテゴリを階層構造で取得します',
  })
  @ApiParam({
    name: 'categoryType',
    description: 'カテゴリタイプ',
    enum: CategoryType,
  })
  @ApiResponse({
    status: 200,
    description: '取得成功',
    type: SubcategoryListResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '無効なカテゴリタイプ',
  })
  async getByCategory(
    @Param('categoryType') categoryType: string,
  ): Promise<SubcategoryListResponseDto> {
    this.logger.log(`カテゴリタイプ ${categoryType} のサブカテゴリを取得中...`);

    // カテゴリタイプのバリデーション
    if (!Object.values(CategoryType).includes(categoryType as CategoryType)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_CATEGORY_TYPE',
          message: '無効なカテゴリタイプです',
          details: {
            field: 'categoryType',
            value: categoryType,
            allowedValues: Object.values(CategoryType),
          },
        },
      });
    }

    const result = await this.getSubcategoriesByCategoryUseCase.execute(
      categoryType as CategoryType,
    );

    // SubcategoryTreeItemをSubcategoryResponseDtoに変換
    const data: SubcategoryResponseDto[] = result.subcategories.map((item) => ({
      id: item.id,
      categoryType: item.categoryType as CategoryType,
      name: item.name,
      parentId: item.parentId,
      displayOrder: item.displayOrder,
      icon: item.icon,
      color: item.color,
      isDefault: item.isDefault,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      children: item.children?.map((child) => ({
        id: child.id,
        categoryType: child.categoryType as CategoryType,
        name: child.name,
        parentId: child.parentId,
        displayOrder: child.displayOrder,
        icon: child.icon,
        color: child.color,
        isDefault: child.isDefault,
        isActive: child.isActive,
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
      })),
    }));

    return {
      success: true,
      data,
      total: result.total,
    };
  }

  /**
   * 取引の詳細費目を自動分類
   * POST /api/subcategories/classify
   */
  @Post('classify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '取引の詳細費目を自動分類',
    description:
      '取引データから詳細費目を自動的に分類します。店舗マスタやキーワードマッチングを使用します。',
  })
  @ApiResponse({
    status: 200,
    description: '分類成功',
    type: ClassificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストボディが不正',
  })
  @ApiResponse({
    status: 500,
    description: '分類処理に失敗',
  })
  async classify(
    @Body() dto: ClassificationRequestDto,
  ): Promise<ClassificationResponseDto> {
    this.logger.log(
      `取引を自動分類中: ${dto.description} (${dto.mainCategory})`,
    );

    // ユースケースで分類を実行（サブカテゴリ詳細と店舗情報を含む）
    // エラーハンドリングはHttpExceptionFilterが一元管理
    const result = await this.classifySubcategoryUseCase.execute({
      description: dto.description,
      amount: dto.amount,
      mainCategory: dto.mainCategory,
      transactionDate: dto.transactionDate
        ? new Date(dto.transactionDate)
        : undefined,
    });

    return {
      success: true,
      data: {
        subcategory: {
          id: result.subcategoryId,
          categoryType: result.categoryType,
          name: result.subcategoryName,
          parentId: result.parentId,
          displayOrder: result.displayOrder,
          icon: result.icon,
          color: result.color,
          isDefault: result.isDefault,
          isActive: result.isActive,
        },
        confidence: result.confidence,
        reason: result.reason,
        merchantId: result.merchantId,
        merchantName: result.merchantName,
      },
    };
  }

  /**
   * 取引のサブカテゴリを手動更新
   * PATCH /api/transactions/:id/subcategory
   */
  @Patch('/transactions/:id/subcategory')
  @ApiOperation({
    summary: '取引のサブカテゴリを手動更新',
    description:
      '取引のサブカテゴリを手動で更新します。信頼度は自動的に1.0になります。',
  })
  @ApiParam({
    name: 'id',
    description: '取引ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: UpdateSubcategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'リクエストボディが不正',
  })
  @ApiResponse({
    status: 404,
    description: '取引またはサブカテゴリが見つからない',
  })
  async updateTransactionSubcategory(
    @Param('id') transactionId: string,
    @Body() dto: UpdateSubcategoryRequestDto,
  ): Promise<UpdateSubcategoryResponseDto> {
    this.logger.log(
      `取引 ${transactionId} のサブカテゴリを ${dto.subcategoryId} に更新中...`,
    );

    // エラーハンドリングはHttpExceptionFilterが一元管理
    const result = await this.updateTransactionSubcategoryUseCase.execute({
      transactionId,
      subcategoryId: dto.subcategoryId,
    });

    return {
      success: true,
      transaction: {
        id: result.transactionId,
        subcategoryId: result.subcategoryId,
        subcategoryName: result.subcategoryName,
        classificationConfidence: result.confidence,
        classificationReason: result.reason,
        confirmedAt: result.confirmedAt.toISOString(),
      },
    };
  }
}
