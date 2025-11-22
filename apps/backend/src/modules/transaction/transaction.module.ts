import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './presentation/controllers/transaction.controller';
import { TransactionRepository } from './infrastructure/repositories/transaction.repository';
import { TransactionTypeOrmRepository } from './infrastructure/repositories/transaction-typeorm.repository';
import { TransactionOrmEntity } from './infrastructure/entities/transaction.orm-entity';
import { TransactionDomainService } from './domain/services/transaction-domain.service';
import { CategoryClassificationService } from './domain/services/category-classification.service';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { GetTransactionsUseCase } from './application/use-cases/get-transactions.use-case';
import { UpdateTransactionCategoryUseCase } from './application/use-cases/update-transaction-category.use-case';
import { CalculateMonthlySummaryUseCase } from './application/use-cases/calculate-monthly-summary.use-case';
import { ClassifyTransactionUseCase } from './application/use-cases/classify-transaction.use-case';
import { TRANSACTION_REPOSITORY } from './domain/repositories/transaction.repository.interface';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionOrmEntity]), CategoryModule],
  controllers: [TransactionController],
  providers: [
    // Repository - TypeORM版を使用（JSON版は予備として残す）
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionTypeOrmRepository,
    },
    TransactionTypeOrmRepository,
    TransactionRepository, // JSONリポジトリは予備として残す
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
  exports: [TRANSACTION_REPOSITORY, TransactionDomainService],
})
export class TransactionModule {}
