import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CategoryEntity } from '../../domain/entities/category.entity';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '../../domain/repositories/category.repository.interface';

/**
 * 費目単一取得のレスポンスデータ
 */
export interface GetCategoryByIdResponse {
  category: CategoryEntity;
}

/**
 * 費目単一取得ユースケース
 * IDで指定された費目を取得します
 */
@Injectable()
export class GetCategoryByIdUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  /**
   * IDで費目を取得する
   * @param id 費目ID
   * @returns 費目エンティティ
   * @throws NotFoundException 費目が見つからない場合
   */
  async execute(id: string): Promise<GetCategoryByIdResponse> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException(`費目が見つかりません: ${id}`);
    }

    return { category };
  }
}
