import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InstitutionEntity } from '../../domain/entities/institution.entity';
import { EncryptedCredentials } from '../../domain/value-objects/encrypted-credentials.vo';
import {
  IInstitutionRepository,
  INSTITUTION_REPOSITORY,
} from '../../domain/repositories/institution.repository.interface';
import { InstitutionType } from '@account-book/types';

export interface CreateInstitutionDto {
  name: string;
  type: InstitutionType;
  credentials: {
    encrypted: string;
    iv: string;
    authTag: string;
    algorithm?: string;
    version?: string;
  };
}

/**
 * 金融機関登録ユースケース
 */
@Injectable()
export class CreateInstitutionUseCase {
  constructor(
    @Inject(INSTITUTION_REPOSITORY)
    private readonly institutionRepository: IInstitutionRepository,
  ) {}

  async execute(dto: CreateInstitutionDto): Promise<InstitutionEntity> {
    const now = new Date();

    const credentials = new EncryptedCredentials(
      dto.credentials.encrypted,
      dto.credentials.iv,
      dto.credentials.authTag,
      dto.credentials.algorithm || 'aes-256-gcm',
      dto.credentials.version || '1.0',
    );

    const institution = new InstitutionEntity(
      uuidv4(),
      dto.name,
      dto.type,
      credentials,
      false, // 初期状態は未接続
      null,
      [],
      now,
      now,
    );

    return await this.institutionRepository.save(institution);
  }
}

