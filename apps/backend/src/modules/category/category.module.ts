import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from './presentation/controllers/category.controller';
import { SubcategoryController } from './presentation/controllers/subcategory.controller';
import { CategoryRepository } from './infrastructure/repositories/category.repository';
import { CategoryTypeOrmRepository } from './infrastructure/repositories/category-typeorm.repository';
import { CategoryOrmEntity } from './infrastructure/entities/category.orm-entity';
import { SubcategoryOrmEntity } from './infrastructure/entities/subcategory.orm-entity';
import { MerchantOrmEntity } from './infrastructure/entities/merchant.orm-entity';
import { SubcategoryTypeOrmRepository } from './infrastructure/repositories/subcategory-typeorm.repository';
import { MerchantTypeOrmRepository } from './infrastructure/repositories/merchant-typeorm.repository';
import { CategoryDomainService } from './domain/services/category-domain.service';
import { SubcategoryClassifierService } from './domain/services/subcategory-classifier.service';
import { SubcategoryTreeBuilderService } from './domain/services/subcategory-tree-builder.service';
import { MerchantMatcherService } from './domain/services/merchant-matcher.service';
import { KeywordMatcherService } from './domain/services/keyword-matcher.service';
import { InitializeCategoriesUseCase } from './application/use-cases/initialize-categories.use-case';
import { GetCategoriesUseCase } from './application/use-cases/get-categories.use-case';
import { GetCategoryByIdUseCase } from './application/use-cases/get-category-by-id.use-case';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';
import { CheckCategoryUsageUseCase } from './application/use-cases/check-category-usage.use-case';
import { ClassifySubcategoryUseCase } from './application/use-cases/classify-subcategory.use-case';
import { GetSubcategoriesUseCase } from './application/use-cases/get-subcategories.use-case';
import { GetSubcategoriesByCategoryUseCase } from './application/use-cases/get-subcategories-by-category.use-case';
import { UpdateTransactionSubcategoryUseCase } from './application/use-cases/update-transaction-subcategory.use-case';
import { CATEGORY_REPOSITORY } from './domain/repositories/category.repository.interface';
import { SUB_CATEGORY_REPOSITORY } from './domain/repositories/subcategory.repository.interface';
import { MERCHANT_REPOSITORY } from './domain/repositories/merchant.repository.interface';
import { TransactionModule } from '../transaction/transaction.module';
import { TransactionOrmEntity } from '../transaction/infrastructure/entities/transaction.orm-entity';
import { TransactionCategoryChangeHistoryOrmEntity } from '../transaction/infrastructure/entities/transaction-category-change-history.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CategoryOrmEntity,
      SubcategoryOrmEntity,
      MerchantOrmEntity,
      TransactionOrmEntity,
      TransactionCategoryChangeHistoryOrmEntity,
    ]),
    forwardRef(() => TransactionModule),
  ],
  controllers: [CategoryController, SubcategoryController],
  providers: [
    // Repository - TypeORM版を使用（JSON版は予備として残す）
    {
      provide: CATEGORY_REPOSITORY,
      useClass: CategoryTypeOrmRepository,
    },
    {
      provide: SUB_CATEGORY_REPOSITORY,
      useClass: SubcategoryTypeOrmRepository,
    },
    {
      provide: MERCHANT_REPOSITORY,
      useClass: MerchantTypeOrmRepository,
    },
    CategoryRepository, // JSONリポジトリは予備として残す
    // Domain Services
    CategoryDomainService,
    SubcategoryClassifierService,
    SubcategoryTreeBuilderService,
    MerchantMatcherService,
    KeywordMatcherService,
    // Use Cases
    InitializeCategoriesUseCase,
    GetCategoriesUseCase,
    GetCategoryByIdUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    CheckCategoryUsageUseCase,
    ClassifySubcategoryUseCase,
    GetSubcategoriesUseCase,
    GetSubcategoriesByCategoryUseCase,
    UpdateTransactionSubcategoryUseCase,
  ],
  exports: [
    CATEGORY_REPOSITORY,
    SUB_CATEGORY_REPOSITORY,
    MERCHANT_REPOSITORY,
    CategoryDomainService,
    SubcategoryClassifierService,
  ],
})
export class CategoryModule {}
