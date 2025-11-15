import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import cryptoConfig from './config/crypto.config';
import { TransactionModule } from './modules/transaction/transaction.module';
import { InstitutionModule } from './modules/institution/institution.module';
import { CategoryModule } from './modules/category/category.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, cryptoConfig],
    }),
    ScheduleModule.forRoot(),
    // Feature modules
    TransactionModule,
    InstitutionModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
