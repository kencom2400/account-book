import { Module } from '@nestjs/common';
import { InstitutionController } from './presentation/controllers/institution.controller';
import { InstitutionRepository } from './infrastructure/repositories/institution.repository';
import { CreateInstitutionUseCase } from './application/use-cases/create-institution.use-case';
import { GetInstitutionsUseCase } from './application/use-cases/get-institutions.use-case';
import { INSTITUTION_REPOSITORY } from './domain/repositories/institution.repository.interface';

@Module({
  controllers: [InstitutionController],
  providers: [
    // Repository
    {
      provide: INSTITUTION_REPOSITORY,
      useClass: InstitutionRepository,
    },
    // Use Cases
    CreateInstitutionUseCase,
    GetInstitutionsUseCase,
  ],
  exports: [INSTITUTION_REPOSITORY],
})
export class InstitutionModule {}

