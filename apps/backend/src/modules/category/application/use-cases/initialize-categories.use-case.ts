import { Inject, Injectable } from '@nestjs/common';
import { CategoryEntity } from '../../domain/entities/category.entity';
import type { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';
import { CategoryDomainService } from '../../domain/services/category-domain.service';

/**
 * カテゴリ初期化ユースケース
 * デフォルトのカテゴリを作成する
 */
@Injectable()
export class InitializeCategoriesUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    private readonly categoryDomainService: CategoryDomainService,
  ) {}

  async execute(): Promise<CategoryEntity[]> {
    // 既にカテゴリが存在する場合はスキップ
    const existingCategories = await this.categoryRepository.findAll();
    if (existingCategories.length > 0) {
      return existingCategories;
    }

    // デフォルトカテゴリを作成
    const defaultCategories =
      this.categoryDomainService.createDefaultCategories();

    // 一括保存
    const savedCategories: CategoryEntity[] = [];
    for (const category of defaultCategories) {
      const saved = await this.categoryRepository.save(category);
      savedCategories.push(saved);
    }

    return savedCategories;
  }
}

