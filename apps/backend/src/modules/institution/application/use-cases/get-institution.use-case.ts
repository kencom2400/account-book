import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InstitutionEntity } from '../../domain/entities/institution.entity';
import type { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import { INSTITUTION_REPOSITORY } from '../../institution.tokens';

/**
 * 金融機関取得ユースケース（ID指定）
 */
@Injectable()
export class GetInstitutionUseCase {
  constructor(
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
  ) {}

  async execute(id: string): Promise<InstitutionEntity> {
    const institution = await this.institutionRepository.findById(id);

    if (!institution) {
      throw new NotFoundException(`金融機関 (ID: ${id}) が見つかりません`);
    }

    return institution;
  }
}
