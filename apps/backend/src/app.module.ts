import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import cryptoConfig from './config/crypto.config';
import { getDatabaseConfig } from './config/database.config';
import { TransactionModule } from './modules/transaction/transaction.module';
import { InstitutionModule } from './modules/institution/institution.module';
import { CategoryModule } from './modules/category/category.module';
import { CreditCardModule } from './modules/credit-card/credit-card.module';
import { SecuritiesModule } from './modules/securities/securities.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, cryptoConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
    }),
    ScheduleModule.forRoot(),
    // Feature modules
    TransactionModule,
    InstitutionModule,
    CategoryModule,
    CreditCardModule,
    SecuritiesModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
