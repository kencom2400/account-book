import { TestingModuleBuilder } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';

/**
 * テストアプリケーションのセットアップオプション
 */
export interface TestAppOptions {
  /**
   * APIのグローバルプレフィックス（例: 'api'）
   * 設定すると app.setGlobalPrefix() が適用される
   */
  setPrefix?: string;

  /**
   * ValidationPipeを有効にするかどうか
   * @default true
   */
  enableValidationPipe?: boolean;

  /**
   * ValidationPipeのオプション
   */
  validationPipeOptions?: {
    whitelist?: boolean;
    forbidNonWhitelisted?: boolean;
    transform?: boolean;
  };

  /**
   * HttpExceptionFilterを有効にするかどうか
   * @default true
   */
  enableHttpExceptionFilter?: boolean;
}

/**
 * E2Eテスト用のNestアプリケーションを作成する共通ヘルパー関数
 *
 * このヘルパーは以下のグローバル設定を適用します：
 * - HttpExceptionFilter（デフォルトで有効）
 * - ValidationPipe（デフォルトで有効、カスタマイズ可能）
 * - APIプレフィックス（オプション）
 *
 * @param moduleBuilder - TestingModuleBuilder インスタンス
 * @param options - セットアップオプション
 * @returns 初期化されたINestApplicationインスタンス
 *
 * @example
 * ```typescript
 * // 基本的な使用例（ValidationPipeとHttpExceptionFilter有効）
 * const moduleBuilder = Test.createTestingModule({
 *   imports: [AppModule],
 * });
 * app = await createTestApp(moduleBuilder);
 * ```
 *
 * @example
 * ```typescript
 * // APIプレフィックス付き
 * app = await createTestApp(moduleBuilder, {
 *   setPrefix: 'api',
 * });
 * ```
 *
 * @example
 * ```typescript
 * // ValidationPipeのみ（HttpExceptionFilterなし）
 * app = await createTestApp(moduleBuilder, {
 *   enableHttpExceptionFilter: false,
 * });
 * ```
 *
 * @example
 * ```typescript
 * // 最小構成（フィルターとパイプなし）
 * app = await createTestApp(moduleBuilder, {
 *   enableValidationPipe: false,
 *   enableHttpExceptionFilter: false,
 * });
 * ```
 */
export async function createTestApp(
  moduleBuilder: TestingModuleBuilder,
  options: TestAppOptions = {},
): Promise<INestApplication> {
  const {
    setPrefix,
    enableValidationPipe = true,
    validationPipeOptions = {},
    enableHttpExceptionFilter = true,
  } = options;

  // モジュールをコンパイル
  const moduleFixture = await moduleBuilder.compile();
  const app = moduleFixture.createNestApplication();

  // HttpExceptionFilterを適用（main.tsと同じ設定）
  if (enableHttpExceptionFilter) {
    app.useGlobalFilters(new HttpExceptionFilter());
  }

  // ValidationPipeを適用（main.tsと同じ設定）
  if (enableValidationPipe) {
    // main.tsと同じexceptionFactoryを使用
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: validationPipeOptions?.whitelist ?? true,
        forbidNonWhitelisted:
          validationPipeOptions?.forbidNonWhitelisted ?? true,
        transform: validationPipeOptions?.transform ?? true,
        exceptionFactory: (errors: ValidationError[]): BadRequestException => {
          const messages = errors.map((error) => {
            const field = error.property;
            const constraints = error.constraints
              ? Object.values(error.constraints).join(', ')
              : 'Validation failed';

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
  }

  // APIプレフィックスを設定（main.tsと同じ設定）
  if (setPrefix) {
    app.setGlobalPrefix(setPrefix);
  }

  // シャットダウンフックを有効化
  // ScheduleModuleなどのリソースを適切にクリーンアップするために必要
  app.enableShutdownHooks();

  await app.init();
  return app;
}
