import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './presentation/controllers/transaction.controller';
import { TransactionTypeOrmRepository } from './infrastructure/repositories/transaction-typeorm.repository';
import { TransactionCategoryChangeHistoryRepository } from './infrastructure/repositories/transaction-category-change-history.repository';
import { TransactionOrmEntity } from './infrastructure/entities/transaction.orm-entity';
import { TransactionCategoryChangeHistoryOrmEntity } from './infrastructure/entities/transaction-category-change-history.orm-entity';
import { TransactionDomainService } from './domain/services/transaction-domain.service';
import { CategoryClassificationService } from './domain/services/category-classification.service';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { GetTransactionsUseCase } from './application/use-cases/get-transactions.use-case';
import { UpdateTransactionCategoryUseCase } from './application/use-cases/update-transaction-category.use-case';
import { CalculateMonthlySummaryUseCase } from './application/use-cases/calculate-monthly-summary.use-case';
import { ClassifyTransactionUseCase } from './application/use-cases/classify-transaction.use-case';
import { TRANSACTION_REPOSITORY } from './domain/repositories/transaction.repository.interface';
import { TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY } from './domain/repositories/transaction-category-change-history.repository.interface';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TransactionOrmEntity,
      TransactionCategoryChangeHistoryOrmEntity,
    ]),
    forwardRef(() => CategoryModule),
  ],
  controllers: [TransactionController],
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
    CategoryClassificationService,
    // Use Cases
    CreateTransactionUseCase,
    GetTransactionsUseCase,
    UpdateTransactionCategoryUseCase,
    CalculateMonthlySummaryUseCase,
    ClassifyTransactionUseCase,
  ],
  exports: [
    TRANSACTION_REPOSITORY,
    TRANSACTION_CATEGORY_CHANGE_HISTORY_REPOSITORY,
    TransactionDomainService,
  ],
})
export class TransactionModule {}
