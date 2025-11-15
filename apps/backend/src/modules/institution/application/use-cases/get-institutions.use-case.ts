import { Inject, Injectable } from '@nestjs/common';
import { InstitutionEntity } from '../../domain/entities/institution.entity';
import type { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import { INSTITUTION_REPOSITORY } from '../../domain/repositories/institution.repository.interface';
import { InstitutionType } from '@account-book/types';

export interface GetInstitutionsQuery {
  type?: InstitutionType;
  isConnected?: boolean;
}

/**
 * 金融機関取得ユースケース
 */
@Injectable()
export class GetInstitutionsUseCase {
  constructor(
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
  ) {}

  async execute(query?: GetInstitutionsQuery): Promise<InstitutionEntity[]> {
    // タイプで絞り込み
    if (query?.type) {
      return await this.institutionRepository.findByType(query.type);
    }

    // 接続状態で絞り込み
    if (query?.isConnected !== undefined) {
      return await this.institutionRepository.findByConnectionStatus(
        query.isConnected,
      );
    }

    // すべての金融機関を取得
    return await this.institutionRepository.findAll();
  }
}

