import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { CategoryEntity } from '../../domain/entities/category.entity';
import type { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';
import { CategoryType } from '@account-book/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 費目追加のリクエストデータ
 */
export interface CreateCategoryRequest {
  name: string;
  type: CategoryType;
  parentId?: string | null;
  icon?: string | null;
  color?: string | null;
}

/**
 * 費目追加のレスポンスデータ
 */
export interface CreateCategoryResponse {
  category: CategoryEntity;
}

/**
 * 費目追加ユースケース
 * 新しい費目を作成します
 */
@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  /**
   * 費目を追加する
   * @param request 追加リクエスト
   * @returns 追加された費目
   * @throws ConflictException 同名の費目が既に存在する場合
   */
  async execute(
    request: CreateCategoryRequest,
  ): Promise<CreateCategoryResponse> {
    const { name, type, parentId: rawParentId } = request;
    const parentId = rawParentId || null;

    // 親カテゴリの存在確認
    if (parentId) {
      const parent = await this.categoryRepository.findById(parentId);
      if (!parent) {
        throw new ConflictException(`親費目が見つかりません: ${parentId}`);
      }
      // 親カテゴリのタイプと一致するか確認
      if (parent.type !== type) {
        throw new ConflictException('親費目とタイプが一致しません');
      }
    }

    // 関連カテゴリを一度だけ取得し、重複チェックと順序計算を行う
    const categories = await this.categoryRepository.findByType(type);
    const siblings = categories.filter((c) => c.parentId === parentId);

    // 重複チェック：NFKC正規化を使用
    const normalizedName = name.normalize('NFKC').toLowerCase();
    const duplicate = siblings.find(
      (c) => c.name.normalize('NFKC').toLowerCase() === normalizedName,
    );

    if (duplicate) {
      throw new ConflictException(`同名の費目が既に存在します: ${name}`);
    }

    // 表示順序を決定
    const order =
      siblings.length > 0 ? Math.max(...siblings.map((c) => c.order)) + 1 : 0;

    // 新しい費目エンティティを作成
    const now = new Date();
    const category = new CategoryEntity(
      uuidv4(),
      name,
      type,
      parentId,
      request.icon || null,
      request.color || null,
      false, // ユーザー定義カテゴリ
      order,
      now,
      now,
    );

    // 保存
    const savedCategory = await this.categoryRepository.save(category);

    return { category: savedCategory };
  }
}
