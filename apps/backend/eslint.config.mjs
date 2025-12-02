// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // 型安全性を強化: any型の使用を禁止
      '@typescript-eslint/no-explicit-any': 'error',
      // 関数の戻り値型を明示的に指定
      '@typescript-eslint/explicit-function-return-type': 'error',
      // モジュール境界（exportされた関数）の型を明示
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      // 推論可能でも明示的に型を付与（変数、引数、戻り値）
      '@typescript-eslint/no-inferrable-types': 'off',
      // 未使用変数のチェック（_プレフィックスは許可）
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // 型安全性チェックをエラーに
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
  {
    files: ['**/*.spec.ts', '**/test/**/*.ts', '**/*.e2e-spec.ts', '**/*.perf.spec.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off', // テストファイルでは型安全性チェックを緩和
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // テストファイルではany型の使用を許可
      '@typescript-eslint/explicit-function-return-type': 'off', // テストファイルでは戻り値型の明示を不要とする
    },
  },
  {
    // TypeORM関連ファイルの設定
    // 理由: TypeORMはデコレータベースのライブラリで、型推論が難しい
    // デコレータ（@Entity, @Column等）や TypeORM API（Repository.find等）が error 型として認識されるため
    // これらのファイルに限定してno-unsafe-*ルールを緩和
    files: [
      '**/*.orm-entity.ts',
      '**/repositories/*-typeorm.repository.ts',
      '**/migrations/*.ts',
      '**/typeorm*.config.ts',
      '**/app.module.ts', // TypeOrmModule.forRootAsync の使用
      '**/*.module.ts', // TypeOrmModule.forFeature の使用
    ],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    // NestJS EventEmitter関連ファイルの設定
    // 理由: @nestjs/event-emitterのデコレータ（@OnEvent）やEventEmitter2のAPIが error 型として認識される
    // これらのファイルに限定してno-unsafe-*ルールを緩和
    files: [
      '**/handlers/*.handler.ts',
      '**/use-cases/check-connection-status.use-case.ts',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  {
    // NestJS Swagger関連ファイルの設定
    // 理由: @nestjs/swaggerのデコレータ（@ApiOperation, @ApiProperty等）が error 型として認識される
    // これらのファイルに限定してno-unsafe-*ルールを緩和
    files: [
      '**/presentation/controllers/*.controller.ts',
      '**/presentation/dto/*.dto.ts',
    ],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
);
