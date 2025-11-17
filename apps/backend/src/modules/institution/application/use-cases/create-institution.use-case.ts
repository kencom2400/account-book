import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InstitutionEntity } from '../../domain/entities/institution.entity';
import type { IInstitutionRepository } from '../../domain/repositories/institution.repository.interface';
import type { ICryptoService } from '../../domain/services/crypto.service.interface';
import { InstitutionType } from '@account-book/types';
import {
  INSTITUTION_REPOSITORY,
  CRYPTO_SERVICE,
} from '../../institution.tokens';

export interface CreateInstitutionDto {
  name: string;
  type: InstitutionType;
  credentials: Record<string, unknown>; // 平文の認証情報（JSON形式）
}

/**
 * 金融機関登録ユースケース
 */
@Injectable()
export class CreateInstitutionUseCase {
  constructor(
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
    @Inject(CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) {}

  async execute(dto: CreateInstitutionDto): Promise<InstitutionEntity> {
    const now = new Date();

    // 認証情報を暗号化
    const credentialsJson = JSON.stringify(dto.credentials);
    const encryptedCredentials = this.cryptoService.encrypt(credentialsJson);

    const institution = new InstitutionEntity(
      uuidv4(),
      dto.name,
      dto.type,
      encryptedCredentials,
      false, // 初期状態は未接続
      null,
      [],
      now,
      now,
    );

    return await this.institutionRepository.save(institution);
  }
}
