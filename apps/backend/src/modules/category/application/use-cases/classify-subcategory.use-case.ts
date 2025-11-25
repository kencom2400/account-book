import { Injectable, Inject } from '@nestjs/common';
import { CategoryType } from '@account-book/types';
import { SubcategoryClassifierService } from '../../domain/services/subcategory-classifier.service';
import type { ISubcategoryRepository } from '../../domain/repositories/subcategory.repository.interface';
import { SUB_CATEGORY_REPOSITORY } from '../../domain/repositories/subcategory.repository.interface';
import { ClassificationReason } from '../../domain/enums/classification-reason.enum';

export interface ClassifySubcategoryDto {
  description: string;
  amount: number;
  mainCategory: CategoryType;
  transactionDate?: Date;
}

export interface ClassifySubcategoryResult {
  subcategoryId: string;
  confidence: number;
  reason: ClassificationReason;
  merchantId?: string | null;
}

/**
 * サブカテゴリ自動分類ユースケース
 * FR-009: 詳細費目分類機能
 *
 * 取引データを自動的にサブカテゴリに分類する
 */
@Injectable()
export class ClassifySubcategoryUseCase {
  constructor(
    private readonly classifierService: SubcategoryClassifierService,
    @Inject(SUB_CATEGORY_REPOSITORY)
    private readonly subcategoryRepository: ISubcategoryRepository,
  ) {}

  /**
   * 取引データを自動分類し、サブカテゴリ情報を返す
   *
   * @param dto 取引データ
   * @returns 分類結果（サブカテゴリID、信頼度、理由、店舗ID）
   */
  async execute(
    dto: ClassifySubcategoryDto,
  ): Promise<ClassifySubcategoryResult> {
    // ドメインサービスで分類を実行
    const classification = await this.classifierService.classify(
      dto.description,
      dto.amount,
      dto.mainCategory,
      dto.transactionDate,
    );

    // DTOに変換して返却
    return {
      subcategoryId: classification.getSubcategoryId(),
      confidence: classification.getConfidence().getValue(),
      reason: classification.getReason(),
      merchantId: classification.getMerchantId(),
    };
  }
}
