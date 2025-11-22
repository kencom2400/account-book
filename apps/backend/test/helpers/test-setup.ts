import { TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: validationPipeOptions?.whitelist ?? true,
        forbidNonWhitelisted:
          validationPipeOptions?.forbidNonWhitelisted ?? true,
        transform: validationPipeOptions?.transform ?? true,
      }),
    );
  }

  // APIプレフィックスを設定（main.tsと同じ設定）
  if (setPrefix) {
    app.setGlobalPrefix(setPrefix);
  }

  await app.init();
  return app;
}
