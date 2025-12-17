import { Test, TestingModule } from '@nestjs/testing';
import { CreateTransactionUseCase } from './create-transaction.use-case';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { CategoryType, TransactionStatus } from '@account-book/types';

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;
  let repository: jest.Mocked<ITransactionRepository>;

  const mockDto = {
    date: new Date('2025-01-15'),
    amount: -1500,
    category: {
      id: 'cat-001',
      name: '食費',
      type: CategoryType.EXPENSE,
    },
    description: 'スターバックス',
    institutionId: 'inst-001',
    accountId: 'acc-001',
    status: TransactionStatus.COMPLETED,
  };

  beforeEach(async () => {
    repository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<ITransactionRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTransactionUseCase,
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    useCase = module.get<CreateTransactionUseCase>(CreateTransactionUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create and save transaction with default status', async () => {
      const savedTransaction = new TransactionEntity(
        'trans-001',
        mockDto.date,
        mockDto.amount,
        mockDto.category,
        mockDto.description,
        mockDto.institutionId,
        mockDto.accountId,
        TransactionStatus.COMPLETED,
        false,
        null,
        new Date(),
        new Date(),
      );
      repository.save.mockResolvedValue(savedTransaction);

      const dtoWithoutStatus = {
        ...mockDto,
        status: undefined,
      };
      const result = await useCase.execute(dtoWithoutStatus);

      expect(result).toBe(savedTransaction);
      expect(repository.save).toHaveBeenCalled();
      const savedCall = repository.save.mock.calls[0][0];
      expect(savedCall).toBeInstanceOf(TransactionEntity);
      expect(savedCall.amount).toBe(mockDto.amount);
      expect(savedCall.status).toBe(TransactionStatus.COMPLETED);
    });

    it('should create and save transaction with specified status', async () => {
      const savedTransaction = new TransactionEntity(
        'trans-001',
        mockDto.date,
        mockDto.amount,
        mockDto.category,
        mockDto.description,
        mockDto.institutionId,
        mockDto.accountId,
        TransactionStatus.PENDING,
        false,
        null,
        new Date(),
        new Date(),
      );
      repository.save.mockResolvedValue(savedTransaction);

      const dtoWithStatus = {
        ...mockDto,
        status: TransactionStatus.PENDING,
      };
      const result = await useCase.execute(dtoWithStatus);

      expect(result).toBe(savedTransaction);
      expect(repository.save).toHaveBeenCalled();
      const savedCall = repository.save.mock.calls[0][0];
      expect(savedCall.status).toBe(TransactionStatus.PENDING);
    });

    it('should create transaction with relatedTransactionId', async () => {
      const savedTransaction = new TransactionEntity(
        'trans-001',
        mockDto.date,
        mockDto.amount,
        mockDto.category,
        mockDto.description,
        mockDto.institutionId,
        mockDto.accountId,
        TransactionStatus.COMPLETED,
        false,
        'related-trans-001',
        new Date(),
        new Date(),
      );
      repository.save.mockResolvedValue(savedTransaction);

      const dtoWithRelated = {
        ...mockDto,
        relatedTransactionId: 'related-trans-001',
      };
      const result = await useCase.execute(dtoWithRelated);

      expect(result).toBe(savedTransaction);
      expect(repository.save).toHaveBeenCalled();
      const savedCall = repository.save.mock.calls[0][0];
      expect(savedCall.relatedTransactionId).toBe('related-trans-001');
    });
  });
});
