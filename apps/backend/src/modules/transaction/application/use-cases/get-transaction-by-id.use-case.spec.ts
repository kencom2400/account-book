import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetTransactionByIdUseCase } from './get-transaction-by-id.use-case';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';

describe('GetTransactionByIdUseCase', () => {
  let useCase: GetTransactionByIdUseCase;
  let repository: jest.Mocked<ITransactionRepository>;

  const mockTransaction = new TransactionEntity(
    'trans-001',
    new Date('2025-01-15'),
    -1500,
    {
      id: 'cat-001',
      name: '食費',
      type: CategoryType.EXPENSE,
    },
    'スターバックス',
    'inst-001',
    'acc-001',
    TransactionStatus.COMPLETED,
    false,
    null,
    new Date('2025-01-15T10:00:00Z'),
    new Date('2025-01-15T10:00:00Z'),
  );

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ITransactionRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTransactionByIdUseCase,
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get<GetTransactionByIdUseCase>(GetTransactionByIdUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return transaction when it exists', async () => {
      const id = 'trans-001';
      repository.findById.mockResolvedValue(mockTransaction);

      const result = await useCase.execute(id);

      expect(result).toEqual(mockTransaction);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when transaction does not exist', async () => {
      const id = 'non-existent-id';
      repository.findById.mockResolvedValue(null);

      await expect(useCase.execute(id)).rejects.toThrow(NotFoundException);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException with correct error message and code', async () => {
      const id = 'non-existent-id';
      repository.findById.mockResolvedValue(null);

      try {
        await useCase.execute(id);
        fail('Should have thrown NotFoundException');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        const notFoundError = error as NotFoundException;
        // NestJSのNotFoundExceptionはメッセージを文字列として扱うため、responseプロパティを確認
        expect(notFoundError.getResponse()).toMatchObject({
          message: `取引ID ${id} が見つかりません`,
          code: 'TRANSACTION_NOT_FOUND',
        });
      }
    });
  });
});
