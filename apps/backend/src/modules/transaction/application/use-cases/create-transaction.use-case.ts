import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import { CategoryType, TransactionStatus } from '@account-book/types';

export interface CreateTransactionDto {
  date: Date;
  amount: number;
  category: {
    id: string;
    name: string;
    type: CategoryType;
  };
  description: string;
  institutionId: string;
  accountId: string;
  status?: TransactionStatus;
  relatedTransactionId?: string;
}

/**
 * 取引作成ユースケース
 */
@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(dto: CreateTransactionDto): Promise<TransactionEntity> {
    const now = new Date();

    const transaction = new TransactionEntity(
      uuidv4(),
      dto.date,
      dto.amount,
      dto.category,
      dto.description,
      dto.institutionId,
      dto.accountId,
      dto.status || TransactionStatus.COMPLETED,
      false,
      dto.relatedTransactionId || null,
      now,
      now,
    );

    return await this.transactionRepository.save(transaction);
  }
}

