import { Module } from '@nestjs/common';
import { InstitutionController } from './presentation/controllers/institution.controller';
import { InstitutionRepository } from './infrastructure/repositories/institution.repository';
import { CryptoService } from './infrastructure/services/crypto.service';
import { CreateInstitutionUseCase } from './application/use-cases/create-institution.use-case';
import { GetInstitutionsUseCase } from './application/use-cases/get-institutions.use-case';
import { INSTITUTION_REPOSITORY } from './domain/repositories/institution.repository.interface';
import { CRYPTO_SERVICE } from './domain/services/crypto.service.interface';

@Module({
  controllers: [InstitutionController],
  providers: [
    // Repository
    {
      provide: INSTITUTION_REPOSITORY,
      useClass: InstitutionRepository,
    },
    // Services
    {
      provide: CRYPTO_SERVICE,
      useClass: CryptoService,
    },
    // Use Cases
    CreateInstitutionUseCase,
    GetInstitutionsUseCase,
  ],
  exports: [INSTITUTION_REPOSITORY, CRYPTO_SERVICE],
})
export class InstitutionModule {}

