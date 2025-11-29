import {
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CategoryEntity } from '../../domain/entities/category.entity';
import type { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';

/**
 * 費目更新のリクエストデータ
 */
export interface UpdateCategoryRequest {
  name: string;
  icon?: string | null;
  color?: string | null;
}

/**
 * 費目更新のレスポンスデータ
 */
export interface UpdateCategoryResponse {
  category: CategoryEntity;
}

/**
 * 費目更新ユースケース
 * 既存の費目を更新します
 */
@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  /**
   * 費目を更新する
   * @param id 費目ID
   * @param request 更新リクエスト
   * @returns 更新された費目
   * @throws NotFoundException 費目が見つからない場合
   * @throws BadRequestException システム定義費目を更新しようとした場合
   * @throws ConflictException 同名の費目が既に存在する場合
   */
  async execute(
    id: string,
    request: UpdateCategoryRequest,
  ): Promise<UpdateCategoryResponse> {
    // 既存の費目を取得
    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundException(`費目が見つかりません: ${id}`);
    }

    // システム定義費目は編集不可
    if (existingCategory.isSystemDefined) {
      throw new BadRequestException('システム定義費目は編集できません');
    }

    // 名前が変更される場合は重複チェック
    if (request.name !== existingCategory.name) {
      await this.checkDuplicate(
        request.name,
        existingCategory.type,
        existingCategory.parentId,
        id,
      );
    }

    // 更新されたエンティティを作成
    const now = new Date();
    const updatedCategory = new CategoryEntity(
      existingCategory.id,
      request.name,
      existingCategory.type,
      existingCategory.parentId,
      request.icon !== undefined ? request.icon : existingCategory.icon,
      request.color !== undefined ? request.color : existingCategory.color,
      existingCategory.isSystemDefined,
      existingCategory.order,
      existingCategory.createdAt,
      now,
    );

    // 保存
    const savedCategory = await this.categoryRepository.update(updatedCategory);

    return { category: savedCategory };
  }

  /**
   * 重複チェック（自身を除く）
   * NFKC正規化を使用して、大文字小文字・ひらがなカタカナの違いを無視
   */
  private async checkDuplicate(
    name: string,
    type: string,
    parentId: string | null,
    excludeId: string,
  ): Promise<void> {
    const categories = await this.categoryRepository.findAll();
    const normalizedName = name.normalize('NFKC').toLowerCase();

    const duplicate = categories.find((c) => {
      if (c.id === excludeId) return false; // 自身を除外
      const existingNormalizedName = c.name.normalize('NFKC').toLowerCase();
      return (
        existingNormalizedName === normalizedName &&
        String(c.type) === String(type) &&
        c.parentId === parentId
      );
    });

    if (duplicate) {
      throw new ConflictException(`同名の費目が既に存在します: ${name}`);
    }
  }
}
