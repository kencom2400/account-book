import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './presentation/controllers/transaction.controller';
import { AggregationController } from './presentation/controllers/aggregation.controller';
import { TransactionTypeOrmRepository } from './infrastructure/repositories/transaction-typeorm.repository';
import { TransactionCategoryChangeHistoryRepository } from './infrastructure/repositories/transaction-category-change-history.repository';
import { TransactionOrmEntity } from './infrastructure/entities/transaction.orm-entity';
import { TransactionCategoryChangeHistoryOrmEntity } from './infrastructure/entities/transaction-category-change-history.orm-entity';
import { TransactionDomainService } from './domain/services/transaction-domain.service';
import { MonthlyBalanceDomainService } from './domain/services/monthly-balance-domain.service';
import { YearlyBalanceDomainService } from './domain/services/yearly-balance-domain.service';
import { TrendAnalysisDomainService } from './domain/services/trend-analysis-domain.service';
import { CategoryAggregationDomainService } from './domain/services/category-aggregation-domain.service';
import { SubcategoryAggregationDomainService } from './domain/services/subcategory-aggregation-domain.service';
import { InstitutionAggregationDomainService } from './domain/services/institution-aggregation-domain.service';
import { AssetBalanceDomainService } from './domain/services/asset-balance-domain.service';
import { CategoryClassificationService } from './domain/services/category-classification.service';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { GetTransactionsUseCase } from './application/use-cases/get-transactions.use-case';
import { UpdateTransactionCategoryUseCase } from './application/use-cases/update-transaction-category.use-case';
import { CalculateMonthlySummaryUseCase } from './application/use-cases/calculate-monthly-summary.use-case';
import { CalculateMonthlyBalanceUseCase } from './application/use-cases/calculate-monthly-balance.use-case';
import { CalculateYearlyBalanceUseCase } from './application/use-cases/calculate-yearly-balance.use-case';
import { CalculateCategoryAggregationUseCase } from './application/use-cases/calculate-category-aggregation.use-case';
import { CalculateSubcategoryAggregationUseCase } from './application/use-cases/calculate-subcategory-aggregation.use-case';
import { CalculateInstitutionSummaryUseCase } from './application/use-cases/calculate-institution-summary.use-case';
import { CalculateAssetBalanceUseCase } from './application/use-cases/calculate-asset-balance.use-case';
import { CalculateTrendAnalysisUseCase } from './application/use-cases/calculate-trend-analysis.use-case';
import { ClassifyTransactionUseCase } from './application/use-cases/classify-transaction.use-case';
import { ExportTransactionsUseCase } from './application/use-cases/export-transactions.use-case';
import { ExportService } from './application/services/export.service';
import { TRANSACTION_REPOSITORY } from './domain/repositories/transaction.repository.interface';
import { TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY } from './domain/repositories/transaction-category-change-history.repository.interface';
import { CategoryModule } from '../category/category.module';
import { InstitutionModule } from '../institution/institution.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionOrmEntity,
      TransactionCategoryChangeHistoryOrmEntity,
    ]),
    forwardRef(() => CategoryModule),
    InstitutionModule,
  ],
  controllers: [TransactionController, AggregationController],
  providers: [
    // Repository - TypeORM版を使用
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionTypeOrmRepository,
    },
    {
      provide: TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY,
      useClass: TransactionCategoryChangeHistoryRepository,
    },
    // Domain Services
    TransactionDomainService,
    MonthlyBalanceDomainService,
    YearlyBalanceDomainService,
    TrendAnalysisDomainService,
    CategoryAggregationDomainService,
    SubcategoryAggregationDomainService,
    InstitutionAggregationDomainService,
    AssetBalanceDomainService,
    CategoryClassificationService,
    // Use Cases
    CreateTransactionUseCase,
    GetTransactionsUseCase,
    UpdateTransactionCategoryUseCase,
    CalculateMonthlySummaryUseCase,
    CalculateMonthlyBalanceUseCase,
    CalculateYearlyBalanceUseCase,
    CalculateCategoryAggregationUseCase,
    CalculateSubcategoryAggregationUseCase,
    CalculateInstitutionSummaryUseCase,
    CalculateAssetBalanceUseCase,
    CalculateTrendAnalysisUseCase,
    ClassifyTransactionUseCase,
    // Export
    ExportService,
    ExportTransactionsUseCase,
  ],
  exports: [
    TRANSACTION_REPOSITORY,
    TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY,
    TransactionDomainService,
  ],
})
export class TransactionModule {}
