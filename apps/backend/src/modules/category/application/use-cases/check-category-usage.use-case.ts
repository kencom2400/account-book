import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CATEGORY_REPOSITORY } from '../../domain/repositories/category.repository.interface';

/**
 * 取引サンプルの型定義
 */
export interface TransactionSample {
  id: string;
  date: string;
  name: string;
  amount: number;
}

/**
 * 費目使用状況確認のレスポンスデータ
 */
export interface CheckCategoryUsageResponse {
  isUsed: boolean;
  usageCount: number;
  transactionSamples: TransactionSample[];
}

/**
 * 費目使用状況確認ユースケース
 * 費目が取引で使用されているかどうかを確認します
 */
@Injectable()
export class CheckCategoryUsageUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  /**
   * 費目の使用状況を確認する
   * @param id 費目ID
   * @returns 使用状況情報
   * @throws NotFoundException 費目が見つからない場合
   */
  async execute(id: string): Promise<CheckCategoryUsageResponse> {
    // 費目の存在確認
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`費目が見つかりません: ${id}`);
    }

    // TODO: 取引データとの連携
    // 現時点では取引モジュールが未実装のため、使用なしとして返す
    // 実装時には、TransactionRepositoryを注入して取引データを取得する
    return {
      isUsed: false,
      usageCount: 0,
      transactionSamples: [],
    };
  }
}
