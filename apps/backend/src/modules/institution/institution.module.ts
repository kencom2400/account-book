import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstitutionController } from './presentation/controllers/institution.controller';
import { InstitutionTypeOrmRepository } from './infrastructure/repositories/institution-typeorm.repository';
import { InstitutionOrmEntity } from './infrastructure/entities/institution.orm-entity';
import { AccountOrmEntity } from './infrastructure/entities/account.orm-entity';
import { CryptoService } from './infrastructure/services/crypto.service';
import { BankApiAdapterFactory } from './infrastructure/adapters/bank-api-adapter.factory';
import { CreateInstitutionUseCase } from './application/use-cases/create-institution.use-case';
import { GetInstitutionsUseCase } from './application/use-cases/get-institutions.use-case';
import { GetInstitutionUseCase } from './application/use-cases/get-institution.use-case';
import { TestBankConnectionUseCase } from './application/use-cases/test-bank-connection.use-case';
import { GetSupportedBanksUseCase } from './application/use-cases/get-supported-banks.use-case';
import { UpdateInstitutionUseCase } from './application/use-cases/update-institution.use-case';
import { DeleteInstitutionUseCase } from './application/use-cases/delete-institution.use-case';
import { TransactionModule } from '../transaction/transaction.module';
import { INSTITUTION_REPOSITORY, CRYPTO_SERVICE } from './institution.tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([InstitutionOrmEntity, AccountOrmEntity]),
    forwardRef(() => TransactionModule),
  ],
  controllers: [InstitutionController],
  providers: [
    // Repository - TypeORM版を使用
    {
      provide: INSTITUTION_REPOSITORY,
      useClass: InstitutionTypeOrmRepository,
    },
    // Services
    {
      provide: CRYPTO_SERVICE,
      useClass: CryptoService,
    },
    // Adapters
    BankApiAdapterFactory,
    // BANK_API_ADAPTERは動的に取得するため、ここでは提供しない
    // TestBankConnectionUseCaseなどでBankApiAdapterFactoryを使用してbankCodeに応じて適切なアダプターを取得
    // Use Cases
    CreateInstitutionUseCase,
    GetInstitutionsUseCase,
    GetInstitutionUseCase,
    TestBankConnectionUseCase,
    GetSupportedBanksUseCase,
    UpdateInstitutionUseCase,
    DeleteInstitutionUseCase,
  ],
  exports: [INSTITUTION_REPOSITORY, CRYPTO_SERVICE, BankApiAdapterFactory],
})
export class InstitutionModule {}
