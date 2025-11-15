# システム構成要件書

**文書バージョン**: 1.0  
**作成日**: 2025-11-15  
**最終更新日**: 2025-11-15

## 目次

1. [システムアーキテクチャ概要](#1-システムアーキテクチャ概要)
2. [技術スタック](#2-技術スタック)
3. [プロジェクト構成](#3-プロジェクト構成)
4. [アーキテクチャパターン](#4-アーキテクチャパターン)
5. [モジュール設計](#5-モジュール設計)
6. [データフロー](#6-データフロー)
7. [API設計](#7-api設計)
8. [データ永続化](#8-データ永続化)
9. [セキュリティアーキテクチャ](#9-セキュリティアーキテクチャ)
10. [開発環境](#10-開発環境)
11. [デプロイメント構成](#11-デプロイメント構成)
12. [パフォーマンス要件](#12-パフォーマンス要件)
13. [監視・ログ](#13-監視ログ)
14. [拡張性・保守性](#14-拡張性保守性)

---

## 1. システムアーキテクチャ概要

### 1.1 全体構成図

```
┌─────────────────────────────────────────────────────────────┐
│                         ユーザー                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
│                      (Next.js)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI         │  │   State      │  │   API        │      │
│  │  Components  │◄─┤  Management  │◄─┤   Client     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API / GraphQL
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Layer                             │
│                      (NestJS)                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Presentation Layer                        │   │
│  │  (Controllers, Middlewares, Guards)                  │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                     │
│  ┌─────────────────────▼────────────────────────────────┐   │
│  │          Application Layer                           │   │
│  │  (Use Cases, Application Services)                   │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                     │
│  ┌─────────────────────▼────────────────────────────────┐   │
│  │            Domain Layer                              │   │
│  │  (Entities, Value Objects, Domain Services)          │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                     │
│  ┌─────────────────────▼────────────────────────────────┐   │
│  │        Infrastructure Layer                          │   │
│  │  (Repositories, External API Clients, File System)   │   │
│  └─────────────────────┬────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   JSON      │  │  External   │  │   Future    │
│   Files     │  │  Financial  │  │  Database   │
│  (Local)    │  │     APIs    │  │ (SQLite/PG) │
└─────────────┘  └─────────────┘  └─────────────┘
```

### 1.2 システムの特徴

#### Monorepo構成
- 単一リポジトリで複数のアプリケーションを管理
- コードの共有が容易
- 一貫したバージョン管理

#### Onion Architecture
- 依存関係の逆転
- ドメインロジックの独立性
- テストの容易性
- 拡張性の確保

#### TypeScript統一
- フロントエンドとバックエンドで型を共有
- 型安全性の確保
- 開発効率の向上

---

## 2. 技術スタック

### 2.1 フロントエンド

#### コアフレームワーク
```json
{
  "framework": "Next.js 14.x",
  "features": [
    "App Router",
    "Server Components",
    "Server Actions",
    "Static Site Generation (SSG)",
    "Incremental Static Regeneration (ISR)"
  ]
}
```

#### 言語・ツール
| 技術 | バージョン | 用途 |
|------|----------|------|
| TypeScript | 5.x | 型安全な開発 |
| React | 18.x | UIライブラリ |
| Node.js | 20.x LTS | ランタイム |

#### 状態管理
- **Zustand** または **React Context API**
  - 軽量で学習コストが低い
  - TypeScriptとの親和性が高い
  - グローバルステートの管理

#### UIライブラリ・スタイリング
```typescript
// オプション1: Material-UI (MUI)
{
  "@mui/material": "^5.x",
  "@emotion/react": "^11.x",
  "@emotion/styled": "^11.x"
}

// オプション2: Chakra UI
{
  "@chakra-ui/react": "^2.x",
  "@emotion/react": "^11.x",
  "@emotion/styled": "^11.x"
}

// オプション3: Tailwind CSS
{
  "tailwindcss": "^3.x",
  "postcss": "^8.x",
  "autoprefixer": "^10.x"
}
```

**推奨**: Chakra UI + Tailwind CSS
- レスポンシブ対応が容易
- ダークモード対応
- アクセシビリティ対応
- カスタマイズ性

#### グラフ・チャート
```json
{
  "recharts": "^2.x",
  "alternatives": ["chart.js", "victory"]
}
```

#### フォーム管理
```json
{
  "react-hook-form": "^7.x",
  "zod": "^3.x"
}
```
- バリデーション
- 型安全なフォーム
- パフォーマンス最適化

#### 日付処理
```json
{
  "date-fns": "^3.x"
}
```

#### HTTPクライアント
```json
{
  "axios": "^1.x",
  "swr": "^2.x"
}
```
- SWR: データフェッチング、キャッシング、再検証

### 2.2 バックエンド

#### コアフレームワーク
```json
{
  "framework": "NestJS 10.x",
  "architecture": "Modular, Dependency Injection",
  "features": [
    "Decorators",
    "Guards",
    "Interceptors",
    "Pipes",
    "Middleware"
  ]
}
```

#### 言語・ツール
| 技術 | バージョン | 用途 |
|------|----------|------|
| TypeScript | 5.x | 型安全な開発 |
| Node.js | 20.x LTS | ランタイム |

#### データ永続化
**Phase 1 (初期)**:
```json
{
  "fs-extra": "^11.x",
  "format": "JSON"
}
```

**Phase 2 (将来)**:
```json
{
  "typeorm": "^0.3.x",
  "sqlite3": "^5.x",
  "alternatives": ["prisma", "postgresql"]
}
```

#### バリデーション
```json
{
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x"
}
```

#### 暗号化
```json
{
  "crypto": "built-in",
  "bcrypt": "^5.x"
}
```

#### スケジューリング
```json
{
  "@nestjs/schedule": "^4.x",
  "node-cron": "^3.x"
}
```

#### HTTPクライアント
```json
{
  "@nestjs/axios": "^3.x",
  "axios": "^1.x"
}
```

#### ロギング
```json
{
  "winston": "^3.x",
  "@nestjs/winston": "^1.x"
}
```

### 2.3 共通ライブラリ

#### 型定義
```typescript
// libs/types/src/index.ts
export * from './transaction.types';
export * from './institution.types';
export * from './category.types';
export * from './user.types';
```

#### ユーティリティ
```typescript
// libs/utils/src/index.ts
export * from './date.utils';
export * from './currency.utils';
export * from './validation.utils';
```

### 2.4 開発ツール

#### パッケージマネージャ
```json
{
  "manager": "pnpm 8.x",
  "reason": "高速、ディスク効率的、monorepo対応"
}
```

#### ビルドツール
```json
{
  "turbo": "^1.x",
  "reason": "monorepo向け高速ビルド"
}
```

#### コード品質
```json
{
  "eslint": "^8.x",
  "@typescript-eslint/parser": "^6.x",
  "@typescript-eslint/eslint-plugin": "^6.x",
  "prettier": "^3.x",
  "eslint-config-prettier": "^9.x"
}
```

#### テスト
```json
{
  "jest": "^29.x",
  "@testing-library/react": "^14.x",
  "@testing-library/jest-dom": "^6.x",
  "supertest": "^6.x"
}
```

#### Git Hooks
```json
{
  "husky": "^8.x",
  "lint-staged": "^15.x"
}
```

---

## 3. プロジェクト構成

### 3.1 ディレクトリ構造

```
account-book/
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
│       ├── ci.yml
│       └── deploy.yml
│
├── .husky/                     # Git hooks
│   ├── pre-commit
│   └── pre-push
│
├── apps/
│   ├── frontend/               # Next.js アプリケーション
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── app/           # App Router
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   └── register/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── transactions/
│   │   │   │   ├── reports/
│   │   │   │   ├── settings/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── components/    # 共通コンポーネント
│   │   │   │   ├── ui/        # UIコンポーネント
│   │   │   │   ├── layout/    # レイアウト
│   │   │   │   ├── charts/    # グラフ
│   │   │   │   └── forms/     # フォーム
│   │   │   ├── hooks/         # カスタムフック
│   │   │   ├── lib/           # ユーティリティ
│   │   │   ├── stores/        # 状態管理
│   │   │   ├── styles/        # グローバルスタイル
│   │   │   └── types/         # 型定義
│   │   ├── .env.local
│   │   ├── next.config.js
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tailwind.config.ts
│   │
│   └── backend/                # NestJS アプリケーション
│       ├── src/
│       │   ├── modules/       # 機能モジュール
│       │   │   ├── transaction/
│       │   │   │   ├── application/
│       │   │   │   │   ├── use-cases/
│       │   │   │   │   └── services/
│       │   │   │   ├── domain/
│       │   │   │   │   ├── entities/
│       │   │   │   │   ├── value-objects/
│       │   │   │   │   └── repositories/
│       │   │   │   ├── infrastructure/
│       │   │   │   │   ├── repositories/
│       │   │   │   │   └── adapters/
│       │   │   │   ├── presentation/
│       │   │   │   │   ├── controllers/
│       │   │   │   │   └── dtos/
│       │   │   │   └── transaction.module.ts
│       │   │   ├── institution/
│       │   │   │   └── (同様の構造)
│       │   │   ├── category/
│       │   │   ├── credit-card/
│       │   │   ├── sync/
│       │   │   └── report/
│       │   ├── common/
│       │   │   ├── decorators/
│       │   │   ├── filters/
│       │   │   ├── guards/
│       │   │   ├── interceptors/
│       │   │   ├── pipes/
│       │   │   └── utils/
│       │   ├── config/
│       │   │   ├── app.config.ts
│       │   │   ├── database.config.ts
│       │   │   └── crypto.config.ts
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── test/
│       ├── .env
│       ├── nest-cli.json
│       ├── package.json
│       └── tsconfig.json
│
├── libs/                       # 共有ライブラリ
│   ├── types/                 # 共通型定義
│   │   ├── src/
│   │   │   ├── transaction.types.ts
│   │   │   ├── institution.types.ts
│   │   │   ├── category.types.ts
│   │   │   ├── user.types.ts
│   │   │   ├── api.types.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── utils/                 # 共通ユーティリティ
│       ├── src/
│       │   ├── date.utils.ts
│       │   ├── currency.utils.ts
│       │   ├── validation.utils.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── data/                       # ローカルデータ保存
│   ├── transactions/
│   │   └── YYYY-MM.json
│   ├── institutions/
│   │   └── institutions.json
│   ├── categories/
│   │   └── categories.json
│   └── settings/
│       └── config.json
│
├── docs/                       # ドキュメント
│   ├── requirements-specification.md
│   ├── system-architecture.md
│   ├── api-specification.md
│   ├── functional-requirements/
│   └── development-guide.md
│
├── scripts/                    # スクリプト
│   ├── setup.sh
│   ├── dev.sh
│   └── build.sh
│
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── package.json                # ルートpackage.json
├── pnpm-workspace.yaml         # pnpmワークスペース設定
├── turbo.json                  # Turbo設定
├── tsconfig.json               # ルートtsconfig
└── README.md
```

### 3.2 pnpm Workspace設定

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'libs/*'
```

### 3.3 Turbo設定

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": ["coverage/**"],
      "dependsOn": ["^build"]
    }
  }
}
```

---

## 4. アーキテクチャパターン

### 4.1 Onion Architecture詳細

#### 4.1.1 Domain Layer（ドメイン層）

**責務**:
- ビジネスロジックの中核
- エンティティの定義
- ドメインルールの実装
- 他の層に依存しない

**構成要素**:

```typescript
// Entities (エンティティ)
export class Transaction {
  constructor(
    public readonly id: TransactionId,
    public date: Date,
    public amount: Money,
    public category: Category,
    public description: string,
    public institutionId: InstitutionId,
    public status: TransactionStatus
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.amount.value === 0) {
      throw new DomainException('Amount cannot be zero');
    }
  }

  changeCategory(newCategory: Category): void {
    this.category = newCategory;
    // ドメインイベントの発火
    this.addDomainEvent(new TransactionCategoryChangedEvent(this.id));
  }
}

// Value Objects (値オブジェクト)
export class Money {
  constructor(
    public readonly value: number,
    public readonly currency: Currency = Currency.JPY
  ) {
    if (value < 0 && !this.isExpense()) {
      throw new DomainException('Invalid amount');
    }
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new DomainException('Currency mismatch');
    }
    return new Money(this.value + other.value, this.currency);
  }
}

// Domain Services (ドメインサービス)
export class TransactionReconciliationService {
  reconcile(
    creditCardTransactions: Transaction[],
    bankTransaction: Transaction
  ): ReconciliationResult {
    // 照合ロジック
  }
}

// Repository Interfaces (リポジトリインターフェース)
export interface ITransactionRepository {
  findById(id: TransactionId): Promise<Transaction | null>;
  findByDateRange(start: Date, end: Date): Promise<Transaction[]>;
  save(transaction: Transaction): Promise<void>;
  delete(id: TransactionId): Promise<void>;
}
```

#### 4.1.2 Application Layer（アプリケーション層）

**責務**:
- ユースケースの実装
- トランザクション制御
- ドメイン層の組み合わせ

**構成要素**:

```typescript
// Use Cases (ユースケース)
@Injectable()
export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(input: CreateTransactionInput): Promise<CreateTransactionOutput> {
    // 1. バリデーション
    this.validate(input);

    // 2. カテゴリの取得
    const category = await this.categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // 3. エンティティの作成
    const transaction = Transaction.create({
      date: input.date,
      amount: new Money(input.amount),
      category,
      description: input.description,
      institutionId: input.institutionId,
    });

    // 4. 保存
    await this.transactionRepository.save(transaction);

    // 5. イベント発行
    this.eventBus.publish(new TransactionCreatedEvent(transaction.id));

    // 6. 結果返却
    return {
      transactionId: transaction.id.value,
      createdAt: transaction.createdAt,
    };
  }

  private validate(input: CreateTransactionInput): void {
    // バリデーションロジック
  }
}

// Application Services (アプリケーションサービス)
@Injectable()
export class ReportService {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository
  ) {}

  async generateMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
    const transactions = await this.transactionRepository.findByMonth(year, month);
    
    // 集計処理
    const income = this.calculateIncome(transactions);
    const expense = this.calculateExpense(transactions);
    const byCategory = this.groupByCategory(transactions);

    return {
      year,
      month,
      income,
      expense,
      balance: income - expense,
      byCategory,
    };
  }
}
```

#### 4.1.3 Infrastructure Layer（インフラストラクチャ層）

**責務**:
- 外部システムとの接続
- データの永続化
- 外部API呼び出し

**構成要素**:

```typescript
// Repository Implementations (リポジトリ実装)
@Injectable()
export class JsonTransactionRepository implements ITransactionRepository {
  constructor(private readonly fileService: FileService) {}

  async findById(id: TransactionId): Promise<Transaction | null> {
    const data = await this.fileService.read('transactions');
    const record = data.find(r => r.id === id.value);
    return record ? this.toDomain(record) : null;
  }

  async save(transaction: Transaction): Promise<void> {
    const data = await this.fileService.read('transactions');
    const record = this.toRecord(transaction);
    data.push(record);
    await this.fileService.write('transactions', data);
  }

  private toDomain(record: any): Transaction {
    // JSONからドメインモデルへの変換
  }

  private toRecord(transaction: Transaction): any {
    // ドメインモデルからJSONへの変換
  }
}

// External API Clients (外部APIクライアント)
@Injectable()
export class BankApiClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly cryptoService: CryptoService
  ) {}

  async fetchTransactions(
    credentials: BankCredentials,
    startDate: Date,
    endDate: Date
  ): Promise<ExternalTransaction[]> {
    // 1. 認証情報の復号化
    const decrypted = await this.cryptoService.decrypt(credentials.encrypted);

    // 2. API呼び出し
    const response = await this.httpService.post('/api/transactions', {
      apiKey: decrypted.apiKey,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }).toPromise();

    // 3. レスポンスの変換
    return response.data.map(this.mapToExternalTransaction);
  }
}
```

#### 4.1.4 Presentation Layer（プレゼンテーション層）

**責務**:
- HTTPリクエスト/レスポンスの処理
- 認証・認可
- DTOの変換

**構成要素**:

```typescript
// Controllers (コントローラ)
@Controller('transactions')
@UseGuards(AuthGuard)
export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionsUseCase: GetTransactionsUseCase
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateTransactionDto
  ): Promise<CreateTransactionResponse> {
    const input = this.toUseCaseInput(dto);
    const output = await this.createTransactionUseCase.execute(input);
    return this.toResponse(output);
  }

  @Get()
  async list(
    @Query() query: GetTransactionsQuery
  ): Promise<GetTransactionsResponse> {
    const input = this.toUseCaseInput(query);
    const output = await this.getTransactionsUseCase.execute(input);
    return this.toResponse(output);
  }

  private toUseCaseInput(dto: CreateTransactionDto): CreateTransactionInput {
    // DTOからユースケース入力への変換
  }

  private toResponse(output: CreateTransactionOutput): CreateTransactionResponse {
    // ユースケース出力からレスポンスDTOへの変換
  }
}

// DTOs (データ転送オブジェクト)
export class CreateTransactionDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  description: string;

  @IsString()
  institutionId: string;
}
```

### 4.2 依存関係の方向

```
Presentation Layer
       ↓ (depends on)
Application Layer
       ↓ (depends on)
   Domain Layer
       ↑ (implemented by)
Infrastructure Layer
```

**重要原則**:
- 内側の層は外側の層に依存しない
- Infrastructureは全ての層を実装するが、依存はインターフェースを通じて
- 依存性の注入（DI）を使用

---

## 5. モジュール設計

### 5.1 バックエンドモジュール構成

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    
    // Feature Modules
    TransactionModule,
    InstitutionModule,
    CategoryModule,
    CreditCardModule,
    SyncModule,
    ReportModule,
    
    // Infrastructure Modules
    FileSystemModule,
    CryptoModule,
    ExternalApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 5.2 モジュール依存関係

```
TransactionModule
  ├─→ CategoryModule
  └─→ InstitutionModule

CreditCardModule
  ├─→ TransactionModule
  └─→ InstitutionModule

SyncModule
  ├─→ TransactionModule
  ├─→ InstitutionModule
  └─→ ExternalApiModule

ReportModule
  ├─→ TransactionModule
  └─→ CategoryModule
```

### 5.3 フロントエンドモジュール構成

```typescript
// アプリケーション構造
src/
├── app/                    # ページ（App Router）
│   ├── (auth)/            # 認証グループ
│   ├── dashboard/         # ダッシュボード
│   ├── transactions/      # 取引一覧・詳細
│   ├── reports/          # レポート
│   └── settings/         # 設定
│
├── components/            # 共通コンポーネント
│   ├── ui/               # 基本UIコンポーネント
│   ├── layout/           # レイアウトコンポーネント
│   ├── charts/           # グラフコンポーネント
│   └── forms/            # フォームコンポーネント
│
├── hooks/                # カスタムフック
│   ├── useTransactions.ts
│   ├── useInstitutions.ts
│   └── useCategories.ts
│
├── lib/                  # ライブラリ・ユーティリティ
│   ├── api/             # APIクライアント
│   ├── utils/           # ユーティリティ関数
│   └── constants/       # 定数
│
└── stores/              # 状態管理
    ├── transactionStore.ts
    ├── institutionStore.ts
    └── categoryStore.ts
```

---

## 6. データフロー

### 6.1 データ取得フロー

```
[User] ─ Action ─→ [Frontend]
                        │
                        │ HTTP Request
                        ↓
                   [Controller] ← Presentation Layer
                        │
                        │ Call UseCase
                        ↓
                   [Use Case] ← Application Layer
                        │
                        │ Query Repository
                        ↓
              [Repository Interface] ← Domain Layer
                        ↑
                        │ Implements
                        │
              [Repository Impl] ← Infrastructure Layer
                        │
                        │ Read/Write
                        ↓
               [Data Store (JSON/DB)]
```

### 6.2 外部API連携フロー

```
[Scheduler] ─ Trigger ─→ [Sync Service]
                              │
                              │ For each Institution
                              ↓
                      [External API Client]
                              │
                              │ HTTP Request (with Auth)
                              ↓
                    [Financial Institution API]
                              │
                              │ Response (Transactions)
                              ↓
                      [Data Mapper]
                              │
                              │ Convert to Domain Model
                              ↓
                      [Transaction Entity]
                              │
                              │ Apply Auto-Classification
                              ↓
                      [Category Service]
                              │
                              │ Save
                              ↓
                      [Transaction Repository]
                              │
                              │ Persist
                              ↓
                      [Data Store]
```

### 6.3 クレジットカード照合フロー

```
[Monthly Job] ─→ [Reconciliation Service]
                        │
                        ├─→ [Get Card Transactions]
                        │        │
                        │        ↓
                        │   [Transaction Repository]
                        │
                        └─→ [Get Bank Withdrawals]
                                 │
                                 ↓
                            [Transaction Repository]
                                 │
                                 ↓
                          [Compare Amounts]
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                  Match      Partial      No Match
                    │            │            │
                    ↓            ↓            ↓
              Update Status   Create Alert   Create Alert
                    │            │            │
                    └────────────┴────────────┘
                                 │
                                 ↓
                          [Notify User]
```

---

## 7. API設計

### 7.1 RESTful API エンドポイント

#### 取引 (Transactions)
```
GET    /api/transactions              # 取引一覧取得
GET    /api/transactions/:id          # 取引詳細取得
POST   /api/transactions              # 取引作成
PUT    /api/transactions/:id          # 取引更新
DELETE /api/transactions/:id          # 取引削除
GET    /api/transactions/summary      # 取引サマリー
```

#### 金融機関 (Institutions)
```
GET    /api/institutions              # 金融機関一覧
GET    /api/institutions/:id          # 金融機関詳細
POST   /api/institutions              # 金融機関登録
PUT    /api/institutions/:id          # 金融機関更新
DELETE /api/institutions/:id          # 金融機関削除
POST   /api/institutions/:id/test     # 接続テスト
POST   /api/institutions/:id/sync     # 手動同期
```

#### カテゴリ (Categories)
```
GET    /api/categories                # カテゴリ一覧
GET    /api/categories/:id            # カテゴリ詳細
POST   /api/categories                # カテゴリ作成
PUT    /api/categories/:id            # カテゴリ更新
DELETE /api/categories/:id            # カテゴリ削除
PUT    /api/categories/order          # 並び順更新
```

#### レポート (Reports)
```
GET    /api/reports/monthly/:year/:month    # 月次レポート
GET    /api/reports/yearly/:year            # 年次レポート
GET    /api/reports/category/:id            # カテゴリ別レポート
GET    /api/reports/institution/:id         # 金融機関別レポート
```

#### クレジットカード (Credit Cards)
```
GET    /api/credit-cards/:id/payments       # 支払い一覧
GET    /api/credit-cards/:id/reconciliation # 照合状態
POST   /api/credit-cards/:id/reconcile      # 照合実行
```

#### 同期 (Sync)
```
GET    /api/sync/status               # 同期状態取得
POST   /api/sync/start                # 全体同期開始
GET    /api/sync/history              # 同期履歴
```

#### 設定 (Settings)
```
GET    /api/settings                  # 設定取得
PUT    /api/settings                  # 設定更新
GET    /api/settings/sync             # 同期設定取得
PUT    /api/settings/sync             # 同期設定更新
```

### 7.2 リクエスト・レスポンス形式

#### 標準レスポンス形式
```typescript
// 成功時
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "metadata": {
    "timestamp": "2025-11-15T10:30:00Z",
    "version": "1.0"
  }
}

// エラー時
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [
      {
        "field": "amount",
        "message": "金額は0より大きい必要があります"
      }
    ]
  },
  "metadata": {
    "timestamp": "2025-11-15T10:30:00Z",
    "version": "1.0"
  }
}
```

#### ページネーション
```typescript
// リクエスト
GET /api/transactions?page=1&limit=20&sortBy=date&order=desc

// レスポンス
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 7.3 エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| VALIDATION_ERROR | 400 | バリデーションエラー |
| UNAUTHORIZED | 401 | 認証エラー |
| FORBIDDEN | 403 | 権限エラー |
| NOT_FOUND | 404 | リソースが見つからない |
| CONFLICT | 409 | 競合エラー |
| INTERNAL_ERROR | 500 | 内部サーバーエラー |
| EXTERNAL_API_ERROR | 502 | 外部API接続エラー |
| SERVICE_UNAVAILABLE | 503 | サービス利用不可 |

---

## 8. データ永続化

### 8.1 Phase 1: JSON形式

#### ファイル構造
```
data/
├── transactions/
│   ├── 2025-01.json
│   ├── 2025-02.json
│   └── ...
├── institutions/
│   └── institutions.json
├── categories/
│   └── categories.json
├── credit-cards/
│   └── payments.json
└── settings/
    ├── config.json
    └── sync.json
```

#### データモデル例

**transactions/2025-01.json**
```json
{
  "month": "2025-01",
  "transactions": [
    {
      "id": "tx_001",
      "date": "2025-01-15T10:30:00Z",
      "amount": -3000,
      "category": {
        "id": "cat_food",
        "name": "食費",
        "subcategory": {
          "id": "subcat_grocery",
          "name": "食料品"
        }
      },
      "description": "セブンイレブン",
      "institutionId": "inst_001",
      "accountId": "acc_001",
      "status": "completed",
      "isReconciled": false,
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**institutions/institutions.json**
```json
{
  "institutions": [
    {
      "id": "inst_001",
      "name": "三菱UFJ銀行",
      "type": "bank",
      "credentials": {
        "encrypted": "...",
        "iv": "...",
        "authTag": "...",
        "algorithm": "aes-256-gcm",
        "version": "1.0"
      },
      "isConnected": true,
      "lastSyncedAt": "2025-11-15T10:30:00Z",
      "accounts": [
        {
          "id": "acc_001",
          "accountNumber": "****1234",
          "accountName": "普通預金",
          "balance": 500000,
          "currency": "JPY"
        }
      ],
      "createdAt": "2025-11-01T09:00:00Z",
      "updatedAt": "2025-11-15T10:30:00Z"
    }
  ]
}
```

### 8.2 Phase 2: Database (SQLite/PostgreSQL)

#### スキーマ設計

```sql
-- Institutions (金融機関)
CREATE TABLE institutions (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,
  credentials_encrypted TEXT NOT NULL,
  credentials_iv TEXT NOT NULL,
  credentials_auth_tag TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Accounts (口座)
CREATE TABLE accounts (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  account_name VARCHAR(100) NOT NULL,
  balance DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'JPY',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
);

-- Categories (カテゴリ)
CREATE TABLE categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  parent_id VARCHAR(36),
  icon VARCHAR(10),
  color VARCHAR(7),
  order_index INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Transactions (取引)
CREATE TABLE transactions (
  id VARCHAR(36) PRIMARY KEY,
  date TIMESTAMP NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  category_id VARCHAR(36) NOT NULL,
  subcategory_id VARCHAR(36),
  description TEXT,
  institution_id VARCHAR(36) NOT NULL,
  account_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL,
  is_reconciled BOOLEAN DEFAULT FALSE,
  related_transaction_id VARCHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (subcategory_id) REFERENCES categories(id),
  FOREIGN KEY (institution_id) REFERENCES institutions(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (related_transaction_id) REFERENCES transactions(id)
);

CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_institution ON transactions(institution_id);

-- Credit Card Payments (クレジットカード支払い)
CREATE TABLE credit_card_payments (
  id VARCHAR(36) PRIMARY KEY,
  card_id VARCHAR(36) NOT NULL,
  month VARCHAR(7) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  bank_withdrawal_id VARCHAR(36),
  status VARCHAR(20) NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES institutions(id),
  FOREIGN KEY (bank_withdrawal_id) REFERENCES transactions(id)
);

-- Events (イベント)
CREATE TABLE events (
  id VARCHAR(36) PRIMARY KEY,
  date DATE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Event Transaction Relations (イベントと取引の関連)
CREATE TABLE event_transaction_relations (
  event_id VARCHAR(36) NOT NULL,
  transaction_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (event_id, transaction_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Sync Logs (同期ログ)
CREATE TABLE sync_logs (
  id VARCHAR(36) PRIMARY KEY,
  institution_id VARCHAR(36) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status VARCHAR(20) NOT NULL,
  records_fetched INTEGER DEFAULT 0,
  error_message TEXT,
  duration INTEGER,
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

CREATE INDEX idx_sync_logs_institution ON sync_logs(institution_id);
CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at);

-- Auto Classification Rules (自動分類ルール)
CREATE TABLE auto_classification_rules (
  id VARCHAR(36) PRIMARY KEY,
  priority INTEGER NOT NULL,
  field VARCHAR(50) NOT NULL,
  operator VARCHAR(20) NOT NULL,
  value TEXT NOT NULL,
  category_id VARCHAR(36) NOT NULL,
  subcategory_id VARCHAR(36),
  is_active BOOLEAN DEFAULT TRUE,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (subcategory_id) REFERENCES categories(id)
);

CREATE INDEX idx_rules_priority ON auto_classification_rules(priority);
```

---

## 9. セキュリティアーキテクチャ

### 9.1 認証・認可

#### 初期フェーズ（ローカル実行）
- ユーザー認証は不要（単一ユーザー想定）
- データはローカルに保存

#### 将来フェーズ（マルチユーザー対応）
```typescript
// JWT認証
{
  "strategy": "JWT",
  "algorithm": "HS256",
  "expiresIn": "1h",
  "refreshToken": {
    "expiresIn": "7d",
    "rotating": true
  }
}
```

### 9.2 データ暗号化

#### 暗号化対象
- 金融機関認証情報
- APIキー
- アクセストークン

#### 暗号化方式
```typescript
// AES-256-GCM暗号化
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;

  async encrypt(plaintext: string): Promise<EncryptedData> {
    const key = await this.getEncryptionKey();
    const iv = crypto.randomBytes(this.ivLength);
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: this.algorithm,
      version: '1.0',
    };
  }

  async decrypt(data: EncryptedData): Promise<string> {
    const key = await this.getEncryptionKey();
    const iv = Buffer.from(data.iv, 'base64');
    const authTag = Buffer.from(data.authTag, 'base64');

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(data.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  private async getEncryptionKey(): Promise<Buffer> {
    // 環境変数から取得またはキーストアから取得
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
      throw new Error('Encryption key not configured');
    }
    return Buffer.from(keyString, 'base64');
  }
}
```

### 9.3 セキュアな通信

#### HTTPS必須
- すべての外部API通信はHTTPS
- 証明書の検証必須
- TLS 1.2以上

#### APIキーの保護
```typescript
// 環境変数での管理
// .env
BANK_API_KEY=xxxxx
CARD_API_KEY=xxxxx
ENCRYPTION_KEY=xxxxx

// 環境変数の検証
@Injectable()
export class ConfigValidationService {
  validate() {
    const required = [
      'ENCRYPTION_KEY',
      'BANK_API_KEY',
      // ...
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}
```

### 9.4 監査ログ

```typescript
// 監査ログの記録
@Injectable()
export class AuditLogger {
  log(event: AuditEvent): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      result: event.result,
      errorCode: event.errorCode,
    };

    // ログファイルへの書き込み
    this.writeToLog(logEntry);
  }
}

// 使用例
this.auditLogger.log({
  userId: 'user_001',
  action: 'update_credentials',
  resource: 'institution',
  resourceId: 'inst_001',
  result: 'success',
});
```

---

## 10. 開発環境

### 10.1 必要な開発ツール

| ツール | バージョン | 用途 |
|--------|----------|------|
| Node.js | 20.x LTS | ランタイム |
| pnpm | 8.x | パッケージマネージャ |
| Git | 2.x | バージョン管理 |
| Visual Studio Code | Latest | IDE（推奨） |

### 10.2 VSCode推奨拡張機能

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "orta.vscode-jest",
    "PKief.material-icon-theme",
    "usernamehw.errorlens"
  ]
}
```

### 10.3 開発環境のセットアップ

```bash
# 1. リポジトリのクローン
git clone https://github.com/username/account-book.git
cd account-book

# 2. 依存関係のインストール
pnpm install

# 3. 環境変数の設定
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.local.example apps/frontend/.env.local

# 4. データディレクトリの作成
mkdir -p data/{transactions,institutions,categories,settings}

# 5. 開発サーバーの起動
pnpm dev
```

### 10.4 開発コマンド

```json
// package.json (root)
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "clean": "turbo run clean && rm -rf node_modules"
  }
}
```

---

## 11. デプロイメント構成

### 11.1 ローカル実行（初期フェーズ）

```
┌─────────────────────────────────────┐
│         User's Local Machine        │
│                                     │
│  ┌──────────────┐  ┌──────────────┐│
│  │   Frontend   │  │   Backend    ││
│  │ (localhost:  │◄─┤ (localhost:  ││
│  │   3000)      │  │   3001)      ││
│  └──────────────┘  └──────┬───────┘│
│                           │        │
│                    ┌──────▼───────┐│
│                    │  Local JSON  ││
│                    │    Files     ││
│                    └──────────────┘│
└─────────────────────────────────────┘
```

#### 実行方法
```bash
# 開発モード
pnpm dev

# 本番ビルド
pnpm build

# 本番実行
pnpm start
```

### 11.2 Docker構成（将来フェーズ）

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3001
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/accountbook
    volumes:
      - ./data:/app/data
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=accountbook
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 11.3 クラウドデプロイ（将来フェーズ）

#### Vercel + Railway構成
```
┌─────────────────────────────────────┐
│           Vercel (Frontend)         │
│         Next.js Application         │
└────────────────┬────────────────────┘
                 │ HTTPS
                 ↓
┌─────────────────────────────────────┐
│        Railway (Backend)            │
│         NestJS Application          │
└────────────────┬────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│    Railway (PostgreSQL Database)    │
└─────────────────────────────────────┘
```

---

## 12. パフォーマンス要件

### 12.1 レスポンスタイム要件

| 操作 | 目標時間 | 最大許容時間 |
|------|---------|------------|
| ページ初期表示 | 1秒 | 3秒 |
| 取引一覧表示 | 500ms | 2秒 |
| 取引詳細表示 | 300ms | 1秒 |
| 取引作成・更新 | 500ms | 2秒 |
| グラフ描画 | 1秒 | 3秒 |
| データ同期 | - | 30秒 |
| 検索 | 500ms | 2秒 |

### 12.2 最適化戦略

#### フロントエンド最適化
```typescript
// 1. Code Splitting
const TransactionList = dynamic(() => import('./TransactionList'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

// 2. Memoization
const MemoizedTransactionItem = React.memo(TransactionItem);

// 3. Virtual Scrolling
import { FixedSizeList } from 'react-window';

// 4. Image Optimization
import Image from 'next/image';
```

#### バックエンド最適化
```typescript
// 1. Caching
@Injectable()
export class CacheService {
  @Cacheable({ ttl: 300 })
  async getMonthlySummary(year: number, month: number) {
    // 重い集計処理
  }
}

// 2. Batch Processing
async processBatch(items: Transaction[]): Promise<void> {
  const batchSize = 100;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await this.processBatchItems(batch);
  }
}

// 3. Lazy Loading
async getTransactionDetails(id: string): Promise<TransactionDetail> {
  // 基本情報のみ取得し、関連データは必要に応じて取得
}
```

---

## 13. 監視・ログ

### 13.1 ログレベル

| レベル | 用途 | 例 |
|--------|------|---|
| ERROR | エラー | API接続失敗、データ保存失敗 |
| WARN | 警告 | トークン有効期限切れ間近 |
| INFO | 情報 | API呼び出し、データ同期完了 |
| DEBUG | デバッグ | リクエスト詳細、処理フロー |

### 13.2 ログ設定

```typescript
// logger.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

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
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});
```

### 13.3 メトリクス収集

```typescript
// metrics.service.ts
@Injectable()
export class MetricsService {
  private requestCount = 0;
  private errorCount = 0;
  private syncDuration: number[] = [];

  recordRequest(): void {
    this.requestCount++;
  }

  recordError(): void {
    this.errorCount++;
  }

  recordSyncDuration(duration: number): void {
    this.syncDuration.push(duration);
  }

  getMetrics() {
    return {
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        errorRate: this.errorCount / this.requestCount,
      },
      sync: {
        averageDuration: this.average(this.syncDuration),
        maxDuration: Math.max(...this.syncDuration),
        minDuration: Math.min(...this.syncDuration),
      },
    };
  }
}
```

---

## 14. 拡張性・保守性

### 14.1 モジュールの追加

新しい機能モジュールの追加手順：

```bash
# 1. モジュールの作成
nest g module modules/new-feature
nest g controller modules/new-feature/presentation/controllers/new-feature
nest g service modules/new-feature/application/services/new-feature

# 2. ディレクトリ構造の整理
modules/new-feature/
├── application/
├── domain/
├── infrastructure/
├── presentation/
└── new-feature.module.ts

# 3. AppModuleへの登録
# app.module.tsのimportsに追加
```

### 14.2 新しい金融機関の追加

```typescript
// 1. APIクライアントの作成
@Injectable()
export class NewBankApiClient implements IFinancialApiClient {
  async fetchTransactions(
    credentials: Credentials,
    startDate: Date,
    endDate: Date
  ): Promise<ExternalTransaction[]> {
    // 実装
  }
}

// 2. ファクトリーへの登録
@Injectable()
export class FinancialApiClientFactory {
  create(institutionType: InstitutionType): IFinancialApiClient {
    switch (institutionType) {
      case 'new-bank':
        return new NewBankApiClient();
      // ...
    }
  }
}
```

### 14.3 データベースへの移行

```typescript
// 1. TypeORMエンティティの作成
@Entity('transactions')
export class TransactionEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  date: Date;

  @Column('decimal')
  amount: number;

  // ...
}

// 2. リポジトリの実装切り替え
@Injectable()
export class TypeOrmTransactionRepository implements ITransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repository: Repository<TransactionEntity>
  ) {}

  async findById(id: TransactionId): Promise<Transaction | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } });
    return entity ? this.toDomain(entity) : null;
  }
}

// 3. DIコンテナでの切り替え
{
  provide: ITransactionRepository,
  useClass: TypeOrmTransactionRepository, // JsonTransactionRepositoryから切り替え
}
```

---

## まとめ

本システム構成要件書では、以下の内容を定義しました：

### 主要アーキテクチャ決定事項
1. **Monorepo構成** - pnpm workspace + Turbo
2. **Onion Architecture** - レイヤー分離と依存性の逆転
3. **TypeScript統一** - フロントエンドとバックエンドの型共有
4. **段階的な実装** - JSON → Database

### 技術選定
- **フロントエンド**: Next.js 14 + Chakra UI + Zustand
- **バックエンド**: NestJS 10 + TypeORM(将来)
- **データ保存**: JSON(初期) → SQLite/PostgreSQL(将来)

### 重要な設計原則
- セキュリティファースト（暗号化、監査ログ）
- 拡張性の確保（モジュール設計、インターフェース分離）
- パフォーマンス最適化（キャッシング、遅延読み込み）
- 保守性の向上（明確なレイヤー分離、テスタビリティ）

このアーキテクチャに基づいて実装を進めることで、堅牢で拡張可能なシステムを構築できます。

---

**文書バージョン**: 1.0  
**作成日**: 2025-11-15  
**最終更新日**: 2025-11-15

