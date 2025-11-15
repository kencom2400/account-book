import { Module } from '@nestjs/common';
import { InstitutionController } from './presentation/controllers/institution.controller';
import { InstitutionRepository } from './infrastructure/repositories/institution.repository';
import { CryptoService } from './infrastructure/services/crypto.service';
import { MockBankApiAdapter } from './infrastructure/adapters/mock-bank-api.adapter';
import { CreateInstitutionUseCase } from './application/use-cases/create-institution.use-case';
import { GetInstitutionsUseCase } from './application/use-cases/get-institutions.use-case';
import { TestBankConnectionUseCase } from './application/use-cases/test-bank-connection.use-case';
import { GetSupportedBanksUseCase } from './application/use-cases/get-supported-banks.use-case';
import { INSTITUTION_REPOSITORY } from './domain/repositories/institution.repository.interface';
import { CRYPTO_SERVICE } from './domain/services/crypto.service.interface';
import { BANK_API_ADAPTER } from './domain/adapters/bank-api.adapter.interface';

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
    // Adapters
    {
      provide: BANK_API_ADAPTER,
      useFactory: () => new MockBankApiAdapter('0000'), // モック実装を使用
    },
    // Use Cases
    CreateInstitutionUseCase,
    GetInstitutionsUseCase,
    TestBankConnectionUseCase,
    GetSupportedBanksUseCase,
  ],
  exports: [INSTITUTION_REPOSITORY, CRYPTO_SERVICE, BANK_API_ADAPTER],
})
export class InstitutionModule {}

