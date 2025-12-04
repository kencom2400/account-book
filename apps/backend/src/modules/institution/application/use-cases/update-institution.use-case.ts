import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InstitutionEntity } from '../../domain/entities/institution.entity';
import type { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import type { ICryptoService } from '../../domain/services/crypto.service.interface';
import { InstitutionType } from '@account-book/types';
import {
  INSTITUTION_REPOSITORY,
  CRYPTO_SERVICE,
} from '../../institution.tokens';

export interface UpdateInstitutionDto {
  name?: string;
  type?: InstitutionType;
  credentials?: Record<string, unknown>;
}

/**
 * 金融機関更新ユースケース
 */
@Injectable()
export class UpdateInstitutionUseCase {
  constructor(
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
    @Inject(CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) {}

  async execute(
    id: string,
    dto: UpdateInstitutionDto,
  ): Promise<InstitutionEntity> {
    // 既存の金融機関を取得
    const existingInstitution = await this.institutionRepository.findById(id);

    if (!existingInstitution) {
      throw new NotFoundException(`金融機関 (ID: ${id}) が見つかりません`);
    }

    // 認証情報が更新される場合は暗号化
    const credentials =
      dto.credentials !== undefined
        ? this.cryptoService.encrypt(JSON.stringify(dto.credentials))
        : existingInstitution.credentials;

    // 新しいエンティティを作成（updatedAtを更新）
    const updatedInstitution = new InstitutionEntity(
      existingInstitution.id,
      dto.name ?? existingInstitution.name,
      dto.type ?? existingInstitution.type,
      credentials,
      existingInstitution.isConnected,
      existingInstitution.lastSyncedAt,
      existingInstitution.accounts,
      existingInstitution.createdAt,
      new Date(),
    );

    return await this.institutionRepository.update(updatedInstitution);
  }
}
