import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstitutionController } from './presentation/controllers/institution.controller';
import { InstitutionRepository } from './infrastructure/repositories/institution.repository';
import { InstitutionTypeOrmRepository } from './infrastructure/repositories/institution-typeorm.repository';
import { InstitutionOrmEntity } from './infrastructure/entities/institution.orm-entity';
import { CryptoService } from './infrastructure/services/crypto.service';
import { MockBankApiAdapter } from './infrastructure/adapters/mock-bank-api.adapter';
import { CreateInstitutionUseCase } from './application/use-cases/create-institution.use-case';
import { GetInstitutionsUseCase } from './application/use-cases/get-institutions.use-case';
import { TestBankConnectionUseCase } from './application/use-cases/test-bank-connection.use-case';
import { GetSupportedBanksUseCase } from './application/use-cases/get-supported-banks.use-case';
import {
  INSTITUTION_REPOSITORY,
  CRYPTO_SERVICE,
  BANK_API_ADAPTER,
} from './institution.tokens';

@Module({
  imports: [TypeOrmModule.forFeature([InstitutionOrmEntity])],
  controllers: [InstitutionController],
  providers: [
    // Repository - TypeORM版を使用（JSON版は予備として残す）
    {
      provide: INSTITUTION_REPOSITORY,
      useClass: InstitutionTypeOrmRepository,
    },
    InstitutionTypeOrmRepository,
    InstitutionRepository, // JSONリポジトリは予備として残す
    // Services
    {
      provide: CRYPTO_SERVICE,
      useClass: CryptoService,
    },
    // Adapters
    {
      provide: BANK_API_ADAPTER,
      useFactory: (): MockBankApiAdapter => new MockBankApiAdapter('0000'), // モック実装を使用
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
