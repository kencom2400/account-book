# 開発環境構築タスク一覧

**文書バージョン**: 1.0  
**作成日**: 2025-11-15  
**最終更新日**: 2025-11-15

## 目次

1. [Phase 1: プロジェクト基盤構築](#phase-1-プロジェクト基盤構築)
2. [Phase 2: 開発環境セットアップ](#phase-2-開発環境セットアップ)
3. [Phase 3: 共通ライブラリ構築](#phase-3-共通ライブラリ構築)
4. [Phase 4: バックエンド基盤構築](#phase-4-バックエンド基盤構築)
5. [Phase 5: フロントエンド基盤構築](#phase-5-フロントエンド基盤構築)
6. [Phase 6: テスト環境構築](#phase-6-テスト環境構築)
7. [Phase 7: CI/CD環境構築](#phase-7-cicd環境構築)
8. [Phase 8: 開発ツール・ユーティリティ](#phase-8-開発ツールユーティリティ)
9. [進捗管理](#進捗管理)

---

## Phase 1: プロジェクト基盤構築

### 1.1 リポジトリとパッケージ管理

- [ ] **1.1.1** ルートディレクトリの初期化
  ```bash
  cd /Users/kencom/github/account-book
  pnpm init
  ```

- [ ] **1.1.2** pnpm workspaceの設定
  - `pnpm-workspace.yaml`を作成
  - `packages: ['apps/*', 'libs/*']`の設定

- [ ] **1.1.3** Turbo設定
  - `turbo.json`を作成
  - ビルドパイプラインの定義
  - キャッシュ設定

- [ ] **1.1.4** ルートpackage.jsonのスクリプト設定
  ```json
  {
    "scripts": {
      "dev": "turbo run dev",
      "build": "turbo run build",
      "lint": "turbo run lint",
      "test": "turbo run test",
      "clean": "turbo run clean && rm -rf node_modules"
    }
  }
  ```

- [ ] **1.1.5** 必要なディレクトリ構造の作成
  ```bash
  mkdir -p apps/{frontend,backend}
  mkdir -p libs/{types,utils}
  mkdir -p data/{transactions,institutions,categories,settings}
  mkdir -p docs
  mkdir -p scripts
  mkdir -p .github/workflows
  ```

### 1.2 Git設定

- [ ] **1.2.1** `.gitignore`の作成
  ```gitignore
  # Dependencies
  node_modules/
  .pnp.*
  
  # Build outputs
  dist/
  .next/
  build/
  
  # Environment variables
  .env
  .env.local
  .env.*.local
  
  # Data files
  data/
  
  # IDE
  .vscode/
  .idea/
  
  # Logs
  logs/
  *.log
  
  # Test coverage
  coverage/
  .nyc_output/
  
  # Temporary files
  *.tmp
  .DS_Store
  ```

- [ ] **1.2.2** `.gitattributes`の作成
  ```
  * text=auto eol=lf
  *.{js,ts,tsx,json,md} text eol=lf
  ```

### 1.3 エディタ設定

- [ ] **1.3.1** `.vscode/settings.json`の作成
  ```json
  {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    },
    "typescript.tsdk": "node_modules/typescript/lib",
    "typescript.enablePromptUseWorkspaceTsdk": true
  }
  ```

- [ ] **1.3.2** `.vscode/extensions.json`の作成
  ```json
  {
    "recommendations": [
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "bradlc.vscode-tailwindcss",
      "ms-playwright.playwright",
      "orta.vscode-jest"
    ]
  }
  ```

- [ ] **1.3.3** `.editorconfig`の作成
  ```ini
  root = true
  
  [*]
  charset = utf-8
  end_of_line = lf
  insert_final_newline = true
  trim_trailing_whitespace = true
  indent_style = space
  indent_size = 2
  ```

---

## Phase 2: 開発環境セットアップ

### 2.1 TypeScript設定

- [ ] **2.1.1** ルート`tsconfig.json`の作成
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "commonjs",
      "lib": ["ES2022"],
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "moduleResolution": "node",
      "baseUrl": ".",
      "paths": {
        "@account-book/types": ["libs/types/src"],
        "@account-book/utils": ["libs/utils/src"]
      }
    }
  }
  ```

- [ ] **2.1.2** TypeScriptの依存関係インストール
  ```bash
  pnpm add -D typescript @types/node -w
  ```

### 2.2 Linter/Formatter設定

- [ ] **2.2.1** ESLint設定ファイル作成（`.eslintrc.js`）
  ```javascript
  module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'prettier'
    ],
    env: {
      node: true,
      es2022: true
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  };
  ```

- [ ] **2.2.2** Prettier設定ファイル作成（`.prettierrc`）
  ```json
  {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 100,
    "tabWidth": 2,
    "endOfLine": "lf"
  }
  ```

- [ ] **2.2.3** `.prettierignore`の作成
  ```
  node_modules
  dist
  build
  .next
  coverage
  ```

- [ ] **2.2.4** ESLint/Prettierの依存関係インストール
  ```bash
  pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
    eslint-config-prettier prettier -w
  ```

### 2.3 Git Hooks設定

- [ ] **2.3.1** Huskyのインストールと初期化
  ```bash
  pnpm add -D husky lint-staged -w
  pnpm exec husky install
  ```

- [ ] **2.3.2** pre-commitフックの作成
  ```bash
  pnpm exec husky add .husky/pre-commit "pnpm lint-staged"
  ```

- [ ] **2.3.3** `package.json`にlint-staged設定を追加
  ```json
  {
    "lint-staged": {
      "*.{ts,tsx,js,jsx}": [
        "eslint --fix",
        "prettier --write"
      ],
      "*.{json,md}": [
        "prettier --write"
      ]
    }
  }
  ```

### 2.4 環境変数設定

- [ ] **2.4.1** `.env.example`の作成（ルート）
  ```env
  # Backend
  NODE_ENV=development
  PORT=3001
  
  # Encryption
  ENCRYPTION_KEY=your-encryption-key-here
  
  # External APIs
  BANK_API_KEY=your-bank-api-key
  CARD_API_KEY=your-card-api-key
  ```

- [ ] **2.4.2** 環境変数の説明ドキュメント作成

---

## Phase 3: 共通ライブラリ構築

### 3.1 共通型定義ライブラリ（libs/types）

- [ ] **3.1.1** `libs/types`ディレクトリ初期化
  ```bash
  cd libs/types
  pnpm init
  ```

- [ ] **3.1.2** `package.json`の設定
  ```json
  {
    "name": "@account-book/types",
    "version": "1.0.0",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "scripts": {
      "build": "tsc",
      "dev": "tsc --watch"
    }
  }
  ```

- [ ] **3.1.3** `tsconfig.json`の作成
  ```json
  {
    "extends": "../../tsconfig.json",
    "compilerOptions": {
      "outDir": "dist",
      "rootDir": "src",
      "declaration": true
    },
    "include": ["src/**/*"]
  }
  ```

- [ ] **3.1.4** TypeScriptインストール
  ```bash
  pnpm add -D typescript
  ```

- [ ] **3.1.5** 型定義ファイルの作成
  - [ ] `src/transaction.types.ts`
    ```typescript
    export enum CategoryType {
      INCOME = 'income',
      EXPENSE = 'expense',
      TRANSFER = 'transfer',
      REPAYMENT = 'repayment',
      INVESTMENT = 'investment',
    }

    export interface Transaction {
      id: string;
      date: Date;
      amount: number;
      category: Category;
      description: string;
      institutionId: string;
      accountId: string;
      status: TransactionStatus;
      isReconciled: boolean;
      relatedTransactionId?: string;
      createdAt: Date;
      updatedAt: Date;
    }

    export interface Category {
      id: string;
      name: string;
      type: CategoryType;
      parentId?: string;
      icon?: string;
      color?: string;
    }

    export enum TransactionStatus {
      PENDING = 'pending',
      COMPLETED = 'completed',
      FAILED = 'failed',
      CANCELLED = 'cancelled',
    }
    ```

  - [ ] `src/institution.types.ts`
    ```typescript
    export enum InstitutionType {
      BANK = 'bank',
      CREDIT_CARD = 'credit_card',
      SECURITIES = 'securities',
    }

    export interface Institution {
      id: string;
      name: string;
      type: InstitutionType;
      credentials: EncryptedCredentials;
      isConnected: boolean;
      lastSyncedAt?: Date;
      accounts: Account[];
      createdAt: Date;
      updatedAt: Date;
    }

    export interface Account {
      id: string;
      institutionId: string;
      accountNumber: string;
      accountName: string;
      balance: number;
      currency: string;
    }

    export interface EncryptedCredentials {
      encrypted: string;
      iv: string;
      authTag: string;
      algorithm: string;
      version: string;
    }
    ```

  - [ ] `src/api.types.ts`
    ```typescript
    export interface ApiResponse<T> {
      success: boolean;
      data?: T;
      error?: ApiError;
      metadata: {
        timestamp: string;
        version: string;
      };
    }

    export interface ApiError {
      code: string;
      message: string;
      details?: Record<string, any>;
    }

    export interface PaginatedResponse<T> {
      items: T[];
      pagination: Pagination;
    }

    export interface Pagination {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    }
    ```

  - [ ] `src/user.types.ts`
  - [ ] `src/report.types.ts`
  - [ ] `src/sync.types.ts`

- [ ] **3.1.6** `src/index.ts`でエクスポート
  ```typescript
  export * from './transaction.types';
  export * from './institution.types';
  export * from './category.types';
  export * from './user.types';
  export * from './api.types';
  export * from './report.types';
  export * from './sync.types';
  ```

- [ ] **3.1.7** ビルド実行
  ```bash
  pnpm build
  ```

### 3.2 共通ユーティリティライブラリ（libs/utils）

- [ ] **3.2.1** `libs/utils`ディレクトリ初期化
  ```bash
  cd libs/utils
  pnpm init
  ```

- [ ] **3.2.2** `package.json`の設定

- [ ] **3.2.3** `tsconfig.json`の作成

- [ ] **3.2.4** 依存関係のインストール
  ```bash
  pnpm add date-fns
  pnpm add -D typescript @types/node
  ```

- [ ] **3.2.5** ユーティリティ関数の作成
  - [ ] `src/date.utils.ts`
    ```typescript
    import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
    import { ja } from 'date-fns/locale';

    export class DateUtils {
      static formatDate(date: Date, formatStr = 'yyyy-MM-dd'): string {
        return format(date, formatStr, { locale: ja });
      }

      static getMonthRange(year: number, month: number): [Date, Date] {
        const date = new Date(year, month - 1);
        return [startOfMonth(date), endOfMonth(date)];
      }

      static getNextMonth(year: number, month: number): { year: number; month: number } {
        const date = addMonths(new Date(year, month - 1), 1);
        return {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
        };
      }
    }
    ```

  - [ ] `src/currency.utils.ts`
    ```typescript
    export class CurrencyUtils {
      static formatJPY(amount: number): string {
        return new Intl.NumberFormat('ja-JP', {
          style: 'currency',
          currency: 'JPY',
        }).format(amount);
      }

      static parseAmount(value: string): number {
        return parseFloat(value.replace(/[^0-9.-]/g, ''));
      }
    }
    ```

  - [ ] `src/validation.utils.ts`
    ```typescript
    export class ValidationUtils {
      static isBankCode(code: string): boolean {
        return /^\d{4}$/.test(code);
      }

      static isBranchCode(code: string): boolean {
        return /^\d{3}$/.test(code);
      }

      static isAccountNumber(number: string): boolean {
        return /^\d{7}$/.test(number);
      }

      static isCardNumber(number: string): boolean {
        // Luhnアルゴリズムチェック
        const digits = number.replace(/\D/g, '');
        if (digits.length !== 16) return false;
        
        let sum = 0;
        let isEven = false;
        
        for (let i = digits.length - 1; i >= 0; i--) {
          let digit = parseInt(digits[i]);
          
          if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
          }
          
          sum += digit;
          isEven = !isEven;
        }
        
        return sum % 10 === 0;
      }
    }
    ```

- [ ] **3.2.6** `src/index.ts`でエクスポート

- [ ] **3.2.7** ビルド実行

---

## Phase 4: バックエンド基盤構築

### 4.1 NestJSプロジェクト初期化

- [ ] **4.1.1** NestJS CLIのインストール
  ```bash
  pnpm add -g @nestjs/cli
  ```

- [ ] **4.1.2** プロジェクト作成
  ```bash
  cd apps
  nest new backend
  # パッケージマネージャーでpnpmを選択
  ```

- [ ] **4.1.3** 不要なファイルの削除
  ```bash
  cd backend
  rm -rf src/*.spec.ts
  ```

### 4.2 基本設定

- [ ] **4.2.1** `package.json`の修正
  ```json
  {
    "name": "@account-book/backend",
    "scripts": {
      "dev": "nest start --watch",
      "build": "nest build",
      "start": "node dist/main",
      "lint": "eslint \"{src,test}/**/*.ts\"",
      "test": "jest",
      "test:watch": "jest --watch",
      "test:cov": "jest --coverage"
    }
  }
  ```

- [ ] **4.2.2** 必要な依存関係のインストール
  ```bash
  # Core dependencies
  pnpm add @nestjs/common @nestjs/core @nestjs/platform-express
  pnpm add reflect-metadata rxjs
  
  # Configuration
  pnpm add @nestjs/config
  
  # Validation
  pnpm add class-validator class-transformer
  
  # Scheduling
  pnpm add @nestjs/schedule
  
  # HTTP Client
  pnpm add @nestjs/axios axios
  
  # Logging
  pnpm add winston nest-winston
  
  # File System
  pnpm add fs-extra
  pnpm add -D @types/fs-extra
  
  # Crypto
  pnpm add bcrypt
  pnpm add -D @types/bcrypt
  
  # Dev dependencies
  pnpm add -D @nestjs/cli @nestjs/schematics
  pnpm add -D @nestjs/testing
  pnpm add -D jest @types/jest ts-jest
  pnpm add -D supertest @types/supertest
  ```

- [ ] **4.2.3** 共通ライブラリのリンク
  ```bash
  pnpm add @account-book/types@workspace:* @account-book/utils@workspace:*
  ```

### 4.3 ディレクトリ構造構築

- [ ] **4.3.1** モジュールディレクトリの作成
  ```bash
  mkdir -p src/modules/{transaction,institution,category,credit-card,sync,report}
  mkdir -p src/common/{decorators,filters,guards,interceptors,pipes,utils}
  mkdir -p src/config
  ```

- [ ] **4.3.2** 各モジュールのOnion Architecture構造作成
  ```bash
  # Transactionモジュール例
  cd src/modules/transaction
  mkdir -p {application/{use-cases,services},domain/{entities,value-objects,repositories},infrastructure/{repositories,adapters},presentation/{controllers,dtos}}
  touch transaction.module.ts
  ```

### 4.4 基本設定ファイル

- [ ] **4.4.1** `src/config/app.config.ts`の作成
  ```typescript
  import { registerAs } from '@nestjs/config';

  export default registerAs('app', () => ({
    port: parseInt(process.env.PORT, 10) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
  }));
  ```

- [ ] **4.4.2** `src/config/crypto.config.ts`の作成
  ```typescript
  import { registerAs } from '@nestjs/config';

  export default registerAs('crypto', () => ({
    encryptionKey: process.env.ENCRYPTION_KEY,
    algorithm: 'aes-256-gcm',
  }));
  ```

- [ ] **4.4.3** `src/main.ts`の設定
  ```typescript
  import { NestFactory } from '@nestjs/core';
  import { ValidationPipe } from '@nestjs/common';
  import { AppModule } from './app.module';

  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    
    // CORS
    app.enableCors();
    
    // API prefix
    app.setGlobalPrefix('api');
    
    const port = process.env.PORT || 3001;
    await app.listen(port);
    
    console.log(`Application is running on: http://localhost:${port}`);
  }
  bootstrap();
  ```

- [ ] **4.4.4** `src/app.module.ts`の設定
  ```typescript
  import { Module } from '@nestjs/common';
  import { ConfigModule } from '@nestjs/config';
  import { ScheduleModule } from '@nestjs/schedule';
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
  })
  export class AppModule {}
  ```

### 4.5 共通機能の実装

- [ ] **4.5.1** グローバル例外フィルター
  ```typescript
  // src/common/filters/http-exception.filter.ts
  import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';

  @Catch(HttpException)
  export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const status = exception.getStatus();

      response.status(status).json({
        success: false,
        error: {
          code: exception.name,
          message: exception.message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      });
    }
  }
  ```

- [ ] **4.5.2** レスポンス変換インターセプター
  ```typescript
  // src/common/interceptors/transform.interceptor.ts
  import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';

  @Injectable()
  export class TransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
        map(data => ({
          success: true,
          data,
          metadata: {
            timestamp: new Date().toISOString(),
            version: '1.0',
          },
        }))
      );
    }
  }
  ```

- [ ] **4.5.3** ロギング設定
  ```typescript
  // src/common/logger/logger.config.ts
  import * as winston from 'winston';
  import { WinstonModule } from 'nest-winston';

  export const loggerConfig = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context }) => {
            return `[${timestamp}] [${level}] [${context}] ${message}`;
          })
        ),
      }),
    ],
  });
  ```

### 4.6 環境変数設定

- [ ] **4.6.1** `apps/backend/.env.example`の作成
  ```env
  # Server
  NODE_ENV=development
  PORT=3001
  
  # Encryption
  ENCRYPTION_KEY=base64_encoded_32_byte_key_here
  
  # External APIs
  BANK_API_URL=https://api.bank.example.com
  BANK_API_KEY=your_bank_api_key
  CARD_API_URL=https://api.card.example.com
  CARD_API_KEY=your_card_api_key
  
  # Data Storage
  DATA_PATH=../../data
  ```

- [ ] **4.6.2** `.env`ファイルのコピー
  ```bash
  cp .env.example .env
  # 実際の値を設定
  ```

---

## Phase 5: フロントエンド基盤構築

### 5.1 Next.jsプロジェクト初期化

- [ ] **5.1.1** プロジェクト作成
  ```bash
  cd apps
  pnpm create next-app@latest frontend
  # TypeScript: Yes
  # ESLint: Yes
  # Tailwind CSS: Yes
  # src/ directory: Yes
  # App Router: Yes
  # import alias: Yes (@/*)
  ```

### 5.2 基本設定

- [ ] **5.2.1** `package.json`の修正
  ```json
  {
    "name": "@account-book/frontend",
    "scripts": {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint",
      "test": "jest",
      "test:watch": "jest --watch"
    }
  }
  ```

- [ ] **5.2.2** 必要な依存関係のインストール
  ```bash
  # UI Library
  pnpm add @chakra-ui/react @emotion/react @emotion/styled framer-motion
  
  # State Management
  pnpm add zustand
  
  # Form Management
  pnpm add react-hook-form zod @hookform/resolvers
  
  # Charts
  pnpm add recharts
  
  # Date handling
  pnpm add date-fns
  
  # HTTP Client
  pnpm add axios swr
  
  # Icons
  pnpm add react-icons
  
  # Dev dependencies
  pnpm add -D @testing-library/react @testing-library/jest-dom
  ```

- [ ] **5.2.3** 共通ライブラリのリンク
  ```bash
  pnpm add @account-book/types@workspace:* @account-book/utils@workspace:*
  ```

### 5.3 ディレクトリ構造構築

- [ ] **5.3.1** 基本ディレクトリの作成
  ```bash
  cd src
  mkdir -p components/{ui,layout,charts,forms}
  mkdir -p hooks
  mkdir -p lib/{api,utils,constants}
  mkdir -p stores
  mkdir -p styles
  mkdir -p types
  ```

- [ ] **5.3.2** App Routerのページ構成
  ```bash
  cd app
  mkdir -p (auth)/{login,register}
  mkdir -p dashboard
  mkdir -p transactions/{new,[id]}
  mkdir -p reports/{monthly,yearly}
  mkdir -p settings/{institutions,categories,sync}
  ```

### 5.4 基本設定ファイル

- [ ] **5.4.1** `next.config.js`の設定
  ```javascript
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@account-book/types', '@account-book/utils'],
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    },
  };

  module.exports = nextConfig;
  ```

- [ ] **5.4.2** `tailwind.config.ts`の設定
  ```typescript
  import type { Config } from 'tailwindcss';

  const config: Config = {
    content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        colors: {
          income: '#10b981',
          expense: '#ef4444',
          transfer: '#3b82f6',
        },
      },
    },
    plugins: [],
  };
  export default config;
  ```

- [ ] **5.4.3** Chakra UIのプロバイダー設定
  ```typescript
  // src/app/providers.tsx
  'use client';

  import { ChakraProvider } from '@chakra-ui/react';

  export function Providers({ children }: { children: React.ReactNode }) {
    return <ChakraProvider>{children}</ChakraProvider>;
  }
  ```

- [ ] **5.4.4** ルートレイアウトの更新
  ```typescript
  // src/app/layout.tsx
  import { Providers } from './providers';
  import './globals.css';

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <html lang="ja">
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    );
  }
  ```

### 5.5 APIクライアントの実装

- [ ] **5.5.1** APIクライアントの基本実装
  ```typescript
  // src/lib/api/client.ts
  import axios from 'axios';
  import type { ApiResponse } from '@account-book/types';

  const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
      console.error('API Error:', error);
      return Promise.reject(error);
    }
  );

  export { apiClient };
  ```

- [ ] **5.5.2** APIエンドポイントの定義
  ```typescript
  // src/lib/api/transactions.ts
  import { apiClient } from './client';
  import type { Transaction, ApiResponse, PaginatedResponse } from '@account-book/types';

  export const transactionsApi = {
    getAll: (params: { page: number; limit: number }) =>
      apiClient.get<ApiResponse<PaginatedResponse<Transaction>>>('/api/transactions', { params }),

    getById: (id: string) =>
      apiClient.get<ApiResponse<Transaction>>(`/api/transactions/${id}`),

    create: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiClient.post<ApiResponse<Transaction>>('/api/transactions', data),

    update: (id: string, data: Partial<Transaction>) =>
      apiClient.put<ApiResponse<Transaction>>(`/api/transactions/${id}`, data),

    delete: (id: string) =>
      apiClient.delete<ApiResponse<void>>(`/api/transactions/${id}`),
  };
  ```

### 5.6 状態管理の実装

- [ ] **5.6.1** Zustandストアの作成
  ```typescript
  // src/stores/transactionStore.ts
  import { create } from 'zustand';
  import type { Transaction } from '@account-book/types';

  interface TransactionState {
    transactions: Transaction[];
    loading: boolean;
    error: string | null;
    setTransactions: (transactions: Transaction[]) => void;
    addTransaction: (transaction: Transaction) => void;
    updateTransaction: (id: string, data: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
  }

  export const useTransactionStore = create<TransactionState>((set) => ({
    transactions: [],
    loading: false,
    error: null,
    setTransactions: (transactions) => set({ transactions }),
    addTransaction: (transaction) =>
      set((state) => ({ transactions: [...state.transactions, transaction] })),
    updateTransaction: (id, data) =>
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === id ? { ...t, ...data } : t
        ),
      })),
    deleteTransaction: (id) =>
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      })),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  }));
  ```

### 5.7 環境変数設定

- [ ] **5.7.1** `.env.local.example`の作成
  ```env
  # API
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```

- [ ] **5.7.2** `.env.local`ファイルのコピー
  ```bash
  cp .env.local.example .env.local
  ```

---

## Phase 6: テスト環境構築

### 6.1 バックエンドテスト環境

- [ ] **6.1.1** Jest設定ファイル作成
  ```javascript
  // apps/backend/jest.config.js
  module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
      '**/*.(t|j)s',
      '!**/*.spec.ts',
      '!**/main.ts',
    ],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/$1',
    },
  };
  ```

- [ ] **6.1.2** テストユーティリティの作成
  ```bash
  mkdir -p test/{factories,fixtures,utils}
  ```

- [ ] **6.1.3** テストファクトリーの実装
  ```typescript
  // test/factories/transaction.factory.ts
  import type { Transaction } from '@account-book/types';

  export class TransactionFactory {
    static create(overrides?: Partial<Transaction>): Transaction {
      return {
        id: 'tx_' + Math.random().toString(36).substr(2, 9),
        date: new Date(),
        amount: -3000,
        // ... other fields
        ...overrides,
      };
    }
  }
  ```

### 6.2 フロントエンドテスト環境

- [ ] **6.2.1** Jest設定ファイル作成
  ```javascript
  // apps/frontend/jest.config.js
  const nextJest = require('next/jest');

  const createJestConfig = nextJest({
    dir: './',
  });

  const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
  };

  module.exports = createJestConfig(customJestConfig);
  ```

- [ ] **6.2.2** Jest setup作成
  ```javascript
  // apps/frontend/jest.setup.js
  import '@testing-library/jest-dom';
  ```

### 6.3 E2Eテスト環境

- [ ] **6.3.1** Playwrightのインストール
  ```bash
  cd apps/frontend
  pnpm add -D @playwright/test
  pnpm exec playwright install
  ```

- [ ] **6.3.2** Playwright設定ファイル作成
  ```typescript
  // apps/frontend/playwright.config.ts
  import { defineConfig, devices } from '@playwright/test';

  export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    use: {
      baseURL: 'http://localhost:3000',
      trace: 'on-first-retry',
    },
    projects: [
      { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
      command: 'pnpm dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
  });
  ```

- [ ] **6.3.3** E2Eテストディレクトリ作成
  ```bash
  mkdir -p e2e/user-flows
  ```

---

## Phase 7: CI/CD環境構築

### 7.1 GitHub Actions設定

- [ ] **7.1.1** `.github/workflows/ci.yml`の作成
  ```yaml
  name: CI

  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main, develop]

  jobs:
    lint:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: pnpm/action-setup@v2
          with:
            version: 8
        - uses: actions/setup-node@v3
          with:
            node-version: '20'
            cache: 'pnpm'
        - run: pnpm install
        - run: pnpm lint

    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: pnpm/action-setup@v2
          with:
            version: 8
        - uses: actions/setup-node@v3
          with:
            node-version: '20'
            cache: 'pnpm'
        - run: pnpm install
        - run: pnpm test:unit
        - uses: codecov/codecov-action@v3

    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: pnpm/action-setup@v2
          with:
            version: 8
        - uses: actions/setup-node@v3
          with:
            node-version: '20'
            cache: 'pnpm'
        - run: pnpm install
        - run: pnpm build
  ```

- [ ] **7.1.2** `.github/workflows/e2e.yml`の作成
  ```yaml
  name: E2E Tests

  on:
    pull_request:
      branches: [main]

  jobs:
    e2e:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: pnpm/action-setup@v2
          with:
            version: 8
        - uses: actions/setup-node@v3
          with:
            node-version: '20'
            cache: 'pnpm'
        - run: pnpm install
        - run: pnpm exec playwright install
        - run: pnpm test:e2e
        - uses: actions/upload-artifact@v3
          if: failure()
          with:
            name: playwright-report
            path: playwright-report/
  ```

### 7.2 コードカバレッジ設定

- [ ] **7.2.1** Codecovの設定
  ```yaml
  # .codecov.yml
  coverage:
    status:
      project:
        default:
          target: 85%
      patch:
        default:
          target: 75%
  ```

---

## Phase 8: 開発ツール・ユーティリティ

### 8.1 開発スクリプト

- [ ] **8.1.1** セットアップスクリプト作成
  ```bash
  # scripts/setup.sh
  #!/bin/bash
  
  echo "Setting up development environment..."
  
  # Install dependencies
  pnpm install
  
  # Build shared libraries
  pnpm --filter @account-book/types build
  pnpm --filter @account-book/utils build
  
  # Create data directories
  mkdir -p data/{transactions,institutions,categories,settings}
  
  # Copy environment files
  cp apps/backend/.env.example apps/backend/.env
  cp apps/frontend/.env.local.example apps/frontend/.env.local
  
  echo "Setup complete!"
  ```

- [ ] **8.1.2** 開発サーバー起動スクリプト
  ```bash
  # scripts/dev.sh
  #!/bin/bash
  
  echo "Starting development servers..."
  pnpm dev
  ```

- [ ] **8.1.3** ビルドスクリプト
  ```bash
  # scripts/build.sh
  #!/bin/bash
  
  echo "Building all packages..."
  pnpm build
  ```

- [ ] **8.1.4** スクリプトに実行権限を付与
  ```bash
  chmod +x scripts/*.sh
  ```

### 8.2 データシーディング

- [ ] **8.2.1** シードデータの作成
  ```typescript
  // scripts/seed-data.ts
  import * as fs from 'fs-extra';
  import * as path from 'path';

  const DATA_DIR = path.join(__dirname, '../data');

  async function seedCategories() {
    const categories = [
      { id: 'cat_food', name: '食費', type: 'expense' },
      { id: 'cat_housing', name: '住居費', type: 'expense' },
      // ...
    ];

    await fs.writeJSON(
      path.join(DATA_DIR, 'categories/categories.json'),
      { categories },
      { spaces: 2 }
    );
  }

  async function seed() {
    console.log('Seeding data...');
    await seedCategories();
    console.log('Seeding complete!');
  }

  seed().catch(console.error);
  ```

- [ ] **8.2.2** シードスクリプトの追加
  ```json
  {
    "scripts": {
      "seed": "ts-node scripts/seed-data.ts"
    }
  }
  ```

### 8.3 READMEの更新

- [ ] **8.3.1** ルートREADME.mdの更新
  ```markdown
  # Account Book

  個人資産管理アプリケーション

  ## セットアップ

  ### 前提条件
  - Node.js 20.x
  - pnpm 8.x

  ### インストール
  \`\`\`bash
  # 依存関係のインストールと初期セットアップ
  ./scripts/setup.sh
  
  # または手動で
  pnpm install
  pnpm build
  \`\`\`

  ### 開発サーバーの起動
  \`\`\`bash
  pnpm dev
  \`\`\`

  - フロントエンド: http://localhost:3000
  - バックエンド: http://localhost:3001

  ## テスト実行
  \`\`\`bash
  # 全てのテスト
  pnpm test

  # ユニットテスト
  pnpm test:unit

  # E2Eテスト
  pnpm test:e2e
  \`\`\`

  ## ビルド
  \`\`\`bash
  pnpm build
  \`\`\`

  ## プロジェクト構成
  - `apps/frontend` - Next.js フロントエンド
  - `apps/backend` - NestJS バックエンド
  - `libs/types` - 共通型定義
  - `libs/utils` - 共通ユーティリティ
  ```

---

## 進捗管理

### チェックリストサマリー

#### Phase 1: プロジェクト基盤構築 (0/15)
- [ ] 1.1 リポジトリとパッケージ管理 (0/5)
- [ ] 1.2 Git設定 (0/2)
- [ ] 1.3 エディタ設定 (0/3)

#### Phase 2: 開発環境セットアップ (0/12)
- [ ] 2.1 TypeScript設定 (0/2)
- [ ] 2.2 Linter/Formatter設定 (0/4)
- [ ] 2.3 Git Hooks設定 (0/3)
- [ ] 2.4 環境変数設定 (0/2)

#### Phase 3: 共通ライブラリ構築 (0/13)
- [ ] 3.1 共通型定義ライブラリ (0/7)
- [ ] 3.2 共通ユーティリティライブラリ (0/7)

#### Phase 4: バックエンド基盤構築 (0/21)
- [ ] 4.1 NestJSプロジェクト初期化 (0/3)
- [ ] 4.2 基本設定 (0/3)
- [ ] 4.3 ディレクトリ構造構築 (0/2)
- [ ] 4.4 基本設定ファイル (0/4)
- [ ] 4.5 共通機能の実装 (0/3)
- [ ] 4.6 環境変数設定 (0/2)

#### Phase 5: フロントエンド基盤構築 (0/17)
- [ ] 5.1 Next.jsプロジェクト初期化 (0/1)
- [ ] 5.2 基本設定 (0/3)
- [ ] 5.3 ディレクトリ構造構築 (0/2)
- [ ] 5.4 基本設定ファイル (0/4)
- [ ] 5.5 APIクライアントの実装 (0/2)
- [ ] 5.6 状態管理の実装 (0/1)
- [ ] 5.7 環境変数設定 (0/2)

#### Phase 6: テスト環境構築 (0/9)
- [ ] 6.1 バックエンドテスト環境 (0/3)
- [ ] 6.2 フロントエンドテスト環境 (0/2)
- [ ] 6.3 E2Eテスト環境 (0/3)

#### Phase 7: CI/CD環境構築 (0/3)
- [ ] 7.1 GitHub Actions設定 (0/2)
- [ ] 7.2 コードカバレッジ設定 (0/1)

#### Phase 8: 開発ツール・ユーティリティ (0/7)
- [ ] 8.1 開発スクリプト (0/4)
- [ ] 8.2 データシーディング (0/2)
- [ ] 8.3 READMEの更新 (0/1)

### 全体進捗
**総タスク数**: 97  
**完了タスク数**: 0  
**進捗率**: 0%

---

## 推奨実施順序

1. **Phase 1-2**: プロジェクト基盤と開発環境セットアップ（1-2日）
2. **Phase 3**: 共通ライブラリ構築（1日）
3. **Phase 4**: バックエンド基盤構築（2-3日）
4. **Phase 5**: フロントエンド基盤構築（2-3日）
5. **Phase 6**: テスト環境構築（1日）
6. **Phase 7**: CI/CD環境構築（1日）
7. **Phase 8**: 開発ツール・ユーティリティ（1日）

**推定所要期間**: 9-13日

---

## 次のステップ

環境構築完了後：
1. ドメインモデルの実装
2. ユースケースの実装
3. APIエンドポイントの実装
4. UIコンポーネントの実装
5. 機能要件の実装（FR-001から順次）

---

**文書バージョン**: 1.0  
**作成日**: 2025-11-15  
**最終更新日**: 2025-11-15

