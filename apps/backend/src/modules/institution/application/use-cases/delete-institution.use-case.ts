import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import type { ITransactionRepository } from '../../../transaction/domain/repositories/transaction.repository.interface';
import { INSTITUTION_REPOSITORY } from '../../institution.tokens';
import { TRANSACTION_REPOSITORY } from '../../../transaction/domain/repositories/transaction.repository.interface';

export interface DeleteInstitutionDto {
  deleteTransactions?: boolean;
}

/**
 * 金融機関削除ユースケース
 */
@Injectable()
export class DeleteInstitutionUseCase {
  constructor(
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(id: string, dto: DeleteInstitutionDto = {}): Promise<void> {
    // 既存の金融機関を取得
    const existingInstitution = await this.institutionRepository.findById(id);

    if (!existingInstitution) {
      throw new NotFoundException(`金融機関 (ID: ${id}) が見つかりません`);
    }

    // 取引履歴を削除する場合
    if (dto.deleteTransactions === true) {
      const transactions =
        await this.transactionRepository.findByInstitutionId(id);

      // 各取引を削除
      for (const transaction of transactions) {
        await this.transactionRepository.delete(transaction.id);
      }
    }

    // 金融機関を削除
    await this.institutionRepository.delete(id);
  }
}
