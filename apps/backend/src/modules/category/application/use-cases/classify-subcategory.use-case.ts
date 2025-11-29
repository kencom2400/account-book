import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CategoryType } from '@account-book/types';
import { SubcategoryClassifierService } from '../../domain/services/subcategory-classifier.service';
import { ClassificationReason } from '../../domain/enums/classification-reason.enum';
import type { ISubcategoryRepository } from '../../domain/repositories/subcategory.repository.interface';
import { SUB_CATEGORY_REPOSITORY } from '../../domain/repositories/subcategory.repository.interface';
import type { IMerchantRepository } from '../../domain/repositories/merchant.repository.interface';
import { MERCHANT_REPOSITORY } from '../../domain/repositories/merchant.repository.interface';

export interface ClassifySubcategoryDto {
  description: string;
  amount: number;
  mainCategory: CategoryType;
  transactionDate?: Date;
}

export interface ClassifySubcategoryResult {
  subcategoryId: string;
  subcategoryName: string;
  categoryType: CategoryType;
  parentId: string | null;
  displayOrder: number;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  isActive: boolean;
  confidence: number;
  reason: ClassificationReason;
  merchantId: string | null;
  merchantName: string | null;
}

/**
 * サブカテゴリ自動分類ユースケース
 * FR-009: 詳細費目分類機能
 *
 * 取引データを自動的にサブカテゴリに分類する
 */
@Injectable()
export class ClassifySubcategoryUseCase {
  private readonly logger = new Logger(ClassifySubcategoryUseCase.name);

  constructor(
    private readonly classifierService: SubcategoryClassifierService,
    @Inject(SUB_CATEGORY_REPOSITORY)
    private readonly subcategoryRepository: ISubcategoryRepository,
    @Inject(MERCHANT_REPOSITORY)
    private readonly merchantRepository: IMerchantRepository,
  ) {}

  /**
   * 取引データを自動分類し、サブカテゴリ詳細情報を返す
   *
   * @param dto 取引データ
   * @returns 分類結果（サブカテゴリ詳細、信頼度、理由、店舗情報）
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

    // サブカテゴリ詳細を取得
    const subcategory = await this.subcategoryRepository.findById(
      classification.getSubcategoryId(),
    );

    if (!subcategory) {
      throw new NotFoundException(
        `Subcategory not found with ID: ${classification.getSubcategoryId()}`,
      );
    }

    // 店舗情報を取得（店舗IDがある場合）
    let merchantName: string | null = null;
    const merchantId = classification.getMerchantId();
    if (merchantId) {
      const merchant = await this.merchantRepository.findById(merchantId);
      if (merchant) {
        merchantName = merchant.name;
      } else {
        this.logger.warn(
          `Merchant with ID ${merchantId} not found, but was returned by classifier.`,
        );
      }
    }

    // 完全なデータを返す（スプレッド構文で簡潔に）
    const {
      id,
      name,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...rest
    } = subcategory;
    return {
      subcategoryId: id,
      subcategoryName: name,
      ...rest,
      confidence: classification.getConfidence().getValue(),
      reason: classification.getReason(),
      merchantId: merchantId || null,
      merchantName,
    };
  }
}
