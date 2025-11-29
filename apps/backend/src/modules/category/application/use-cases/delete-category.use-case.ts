import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';

/**
 * 費目削除のレスポンスデータ
 */
export interface DeleteCategoryResponse {
  success: boolean;
  replacedCount: number;
  message: string;
}

/**
 * 費目削除ユースケース
 * 費目を削除します（使用中の場合は代替費目に置き換え）
 */
@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  /**
   * 費目を削除する
   * @param id 削除する費目のID
   * @param replacementCategoryId 代替費目のID（使用中の場合に指定）
   * @returns 削除結果
   * @throws NotFoundException 費目が見つからない場合
   * @throws BadRequestException システム定義費目を削除しようとした場合
   */
  async execute(
    id: string,
    replacementCategoryId?: string,
  ): Promise<DeleteCategoryResponse> {
    // 既存の費目を取得
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`費目が見つかりません: ${id}`);
    }

    // システム定義費目は削除不可
    if (category.isSystemDefined) {
      throw new BadRequestException('システム定義費目は削除できません');
    }

    // 代替費目が指定されている場合、その存在を確認
    if (replacementCategoryId) {
      const replacementCategory = await this.categoryRepository.findById(
        replacementCategoryId,
      );
      if (!replacementCategory) {
        throw new NotFoundException(
          `代替費目が見つかりません: ${replacementCategoryId}`,
        );
      }
      // 代替費目のタイプが一致するか確認
      if (replacementCategory.type !== category.type) {
        throw new BadRequestException('代替費目のタイプが一致しません');
      }
    }

    // TODO: 取引データへの影響チェックと置き換え処理
    // 現時点では取引モジュールが未実装のため、replacedCount = 0 で実装
    const replacedCount = 0;

    // 費目を削除
    await this.categoryRepository.delete(id);

    return {
      success: true,
      replacedCount,
      message:
        replacedCount > 0
          ? `${replacedCount}件の取引を移行して費目を削除しました`
          : '費目を削除しました',
    };
  }
}
