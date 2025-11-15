import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import cryptoConfig from './config/crypto.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, cryptoConfig],
    }),
    ScheduleModule.forRoot(),
    // Feature modules will be added here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
