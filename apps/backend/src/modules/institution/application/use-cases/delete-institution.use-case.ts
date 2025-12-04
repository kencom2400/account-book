import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
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
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(id: string, dto: DeleteInstitutionDto = {}): Promise<void> {
    // 既存の金融機関を取得（トランザクション外で検証）
    const existingInstitution = await this.institutionRepository.findById(id);

    if (!existingInstitution) {
      throw new NotFoundException(`金融機関 (ID: ${id}) が見つかりません`);
    }

    // データベーストランザクションを使用して、
    // 取引履歴の削除と金融機関の削除をアトミックに実行
    await this.dataSource.transaction(async (entityManager) => {
      // 取引履歴を削除する場合
      if (dto.deleteTransactions === true) {
        await this.transactionRepository.deleteByInstitutionId(
          id,
          entityManager,
        );
      }

      // 金融機関を削除
      await this.institutionRepository.delete(id, entityManager);
    });
  }
}
