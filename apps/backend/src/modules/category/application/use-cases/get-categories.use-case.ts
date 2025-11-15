import { Inject, Injectable } from '@nestjs/common';
import { CategoryEntity } from '../../domain/entities/category.entity';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../domain/repositories/category.repository.interface';
import {
  CategoryDomainService,
  CategoryNode,
} from '../../domain/services/category-domain.service';
import { CategoryType } from '@account-book/types';

export interface GetCategoriesQuery {
  type?: CategoryType;
  parentId?: string;
  isTopLevel?: boolean;
  asTree?: boolean;
}

/**
 * カテゴリ取得ユースケース
 */
@Injectable()
export class GetCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    private readonly categoryDomainService: CategoryDomainService,
  ) {}

  async execute(
    query?: GetCategoriesQuery,
  ): Promise<CategoryEntity[] | CategoryNode[]> {
    // タイプで絞り込み
    if (query?.type) {
      return await this.categoryRepository.findByType(query.type);
    }

    // 親IDで絞り込み
    if (query?.parentId) {
      return await this.categoryRepository.findByParentId(query.parentId);
    }

    // トップレベルのみ
    if (query?.isTopLevel) {
      return await this.categoryRepository.findTopLevel();
    }

    // すべてのカテゴリを取得
    const allCategories = await this.categoryRepository.findAll();

    // ツリー構造で返す
    if (query?.asTree) {
      return this.categoryDomainService.buildCategoryTree(allCategories);
    }

    return allCategories;
  }
}

