import { Module } from '@nestjs/common';
import { TransactionController } from './presentation/controllers/transaction.controller';
import { TransactionRepository } from './infrastructure/repositories/transaction.repository';
import { TransactionDomainService } from './domain/services/transaction-domain.service';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { GetTransactionsUseCase } from './application/use-cases/get-transactions.use-case';
import { UpdateTransactionCategoryUseCase } from './application/use-cases/update-transaction-category.use-case';
import { CalculateMonthlySummaryUseCase } from './application/use-cases/calculate-monthly-summary.use-case';
import { TRANSACTION_REPOSITORY } from './domain/repositories/transaction.repository.interface';

@Module({
  controllers: [TransactionController],
  providers: [
    // Repository
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionRepository,
    },
    // Domain Services
    TransactionDomainService,
    // Use Cases
    CreateTransactionUseCase,
    GetTransactionsUseCase,
    UpdateTransactionCategoryUseCase,
    CalculateMonthlySummaryUseCase,
  ],
  exports: [TRANSACTION_REPOSITORY, TransactionDomainService],
})
export class TransactionModule {}

