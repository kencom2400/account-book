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
    // 重複チェック：同一タイプ・親IDで同名の費目が存在しないか確認
    await this.checkDuplicate(
      request.name,
      request.type,
      request.parentId || null,
    );

    // 親カテゴリの存在確認
    if (request.parentId) {
      const parent = await this.categoryRepository.findById(request.parentId);
      if (!parent) {
        throw new ConflictException(
          `親費目が見つかりません: ${request.parentId}`,
        );
      }
      // 親カテゴリのタイプと一致するか確認
      if (parent.type !== request.type) {
        throw new ConflictException('親費目とタイプが一致しません');
      }
    }

    // 表示順序を決定（同じ親IDの中で最大値+1）
    const order = await this.getNextOrder(
      request.type,
      request.parentId || null,
    );

    // 新しい費目エンティティを作成
    const now = new Date();
    const category = new CategoryEntity(
      uuidv4(),
      request.name,
      request.type,
      request.parentId || null,
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

  /**
   * 重複チェック
   * NFKC正規化を使用して、大文字小文字・ひらがなカタカナの違いを無視
   */
  private async checkDuplicate(
    name: string,
    type: CategoryType,
    parentId: string | null,
  ): Promise<void> {
    const categories = await this.categoryRepository.findByType(type);
    const normalizedName = name.normalize('NFKC').toLowerCase();

    const duplicate = categories.find((c) => {
      const existingNormalizedName = c.name.normalize('NFKC').toLowerCase();
      return (
        existingNormalizedName === normalizedName && c.parentId === parentId
      );
    });

    if (duplicate) {
      throw new ConflictException(`同名の費目が既に存在します: ${name}`);
    }
  }

  /**
   * 次の表示順序を取得
   */
  private async getNextOrder(
    type: CategoryType,
    parentId: string | null,
  ): Promise<number> {
    const categories = await this.categoryRepository.findByType(type);
    const siblings = categories.filter((c) => c.parentId === parentId);

    if (siblings.length === 0) {
      return 0;
    }

    const maxOrder = Math.max(...siblings.map((c) => c.order));
    return maxOrder + 1;
  }
}
