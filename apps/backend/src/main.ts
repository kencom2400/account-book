import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationError } from 'class-validator';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // ValidationErrorオブジェクトを直接扱い、より信頼性の高いエラー情報を提供
      // Gemini Code Assistレビュー指摘: 文字列パースへの依存をなくすため
      exceptionFactory: (errors: ValidationError[]): BadRequestException => {
        const messages = errors.map((error) => {
          // ネストされたオブジェクトのバリデーションにも対応（例: user.name）
          const field = error.property;
          const constraints = error.constraints
            ? Object.values(error.constraints).join(', ')
            : 'Validation failed';

          // ネストされたプロパティのエラーも処理
          if (error.children && error.children.length > 0) {
            const nestedMessages = error.children
              .map((child) => {
                const childConstraints = child.constraints
                  ? Object.values(child.constraints).join(', ')
                  : '';
                return childConstraints
                  ? `${child.property}: ${childConstraints}`
                  : '';
              })
              .filter((msg) => msg.length > 0);

            if (nestedMessages.length > 0) {
              return {
                field,
                message: `${constraints} (${nestedMessages.join('; ')})`,
              };
            }
          }

          return {
            field,
            message: constraints,
          };
        });

        return new BadRequestException({ message: messages });
      },
    }),
  );

  // CORS
  app.enableCors();

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
}
void bootstrap();
