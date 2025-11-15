# テスト設計書

**文書バージョン**: 1.0  
**作成日**: 2025-11-15  
**最終更新日**: 2025-11-15

## 目次

1. [テスト戦略](#1-テスト戦略)
2. [テストレベル](#2-テストレベル)
3. [テスト環境](#3-テスト環境)
4. [テストデータ](#4-テストデータ)
5. [テストツール](#5-テストツール)
6. [テストカバレッジ目標](#6-テストカバレッジ目標)
7. [単体テスト設計](#7-単体テスト設計)
8. [統合テスト設計](#8-統合テスト設計)
9. [E2Eテスト設計](#9-e2eテスト設計)
10. [パフォーマンステスト設計](#10-パフォーマンステスト設計)
11. [セキュリティテスト設計](#11-セキュリティテスト設計)
12. [テスト実行計画](#12-テスト実行計画)
13. [品質メトリクス](#13-品質メトリクス)
14. [テストケース管理](#14-テストケース管理)

---

## 1. テスト戦略

### 1.1 テストの目的

本プロジェクトにおけるテストの主要目的：

1. **機能品質の保証**
   - 全ての機能要件が正しく実装されていることを確認
   - ユーザーの期待通りに動作することを検証

2. **非機能品質の保証**
   - パフォーマンス、セキュリティ、可用性の確認
   - レスポンスタイムの目標値達成

3. **回帰の防止**
   - 新機能追加時の既存機能への影響を検知
   - リファクタリング後の動作保証

4. **継続的な品質維持**
   - CI/CDパイプラインでの自動テスト実行
   - 早期のバグ検出と修正

### 1.2 テストアプローチ

#### テストピラミッド戦略

```
        /\
       /  \
      / E2E \          少数（遅い、高コスト）
     /-------\
    /         \
   / Integration \     中数（中速、中コスト）
  /-------------\
 /               \
/   Unit Tests    \    多数（速い、低コスト）
-------------------
```

**比率目標**:
- 単体テスト: 70%
- 統合テスト: 20%
- E2Eテスト: 10%

#### Shift-Left Testing

- 開発初期段階からテストを組み込む
- 設計段階でテスタビリティを考慮
- TDD（Test Driven Development）の推奨

### 1.3 テスト原則

1. **DRY (Don't Repeat Yourself)**
   - テストユーティリティの共通化
   - フィクスチャの再利用

2. **FIRST原則**
   - **F**ast: 高速に実行
   - **I**solated: 独立性の確保
   - **R**epeatable: 再現可能
   - **S**elf-validating: 自己検証
   - **T**imely: タイムリーな実装

3. **AAA（Arrange-Act-Assert）パターン**
   ```typescript
   it('should create a transaction', () => {
     // Arrange: テストデータの準備
     const input = createTransactionInput();
     
     // Act: テスト対象の実行
     const result = service.create(input);
     
     // Assert: 結果の検証
     expect(result.id).toBeDefined();
     expect(result.amount).toBe(input.amount);
   });
   ```

---

## 2. テストレベル

### 2.1 単体テスト (Unit Test)

**対象**:
- ドメインエンティティ
- ドメインサービス
- ユースケース
- ユーティリティ関数
- Reactコンポーネント

**特徴**:
- 依存関係をモック化
- 高速に実行
- 高いカバレッジ目標（80%以上）

**実行タイミング**:
- コード保存時（Watch mode）
- コミット前（Git hook）
- CI/CD（プルリクエスト時）

### 2.2 統合テスト (Integration Test)

**対象**:
- APIエンドポイント
- データベース操作
- 外部APIクライアント
- モジュール間連携

**特徴**:
- 実際の依存関係を使用（一部モック）
- データベースはテスト用を使用
- 外部APIはモック化

**実行タイミング**:
- コミット前
- CI/CD（プルリクエスト時）
- デプロイ前

### 2.3 E2Eテスト (End-to-End Test)

**対象**:
- 主要なユーザーフロー
- クリティカルパス
- ブラウザ操作

**特徴**:
- 実際のブラウザを使用
- フロントエンドとバックエンドの結合
- 実行時間が長い

**実行タイミング**:
- デプロイ前
- 定期実行（夜間バッチ）

### 2.4 パフォーマンステスト

**対象**:
- APIレスポンスタイム
- データベースクエリ性能
- フロントエンドレンダリング速度

**実行タイミング**:
- リリース前
- 定期実行（週次）

### 2.5 セキュリティテスト

**対象**:
- 認証・認可
- データ暗号化
- XSS、CSRF対策
- SQLインジェクション対策

**実行タイミング**:
- リリース前
- 定期実行（月次）

---

## 3. テスト環境

### 3.1 環境構成

| 環境 | 用途 | データベース | 外部API |
|------|------|------------|---------|
| Local | 開発者のローカル環境 | JSON/SQLite | モック |
| CI | 自動テスト実行 | SQLite（メモリ） | モック |
| Staging | 結合テスト | PostgreSQL | Sandbox |
| Production | 本番環境 | PostgreSQL | 本番 |

### 3.2 ローカル開発環境

```bash
# 環境変数設定
cp .env.test.example .env.test

# テストデータベースのセットアップ
pnpm test:db:setup

# テスト実行
pnpm test
```

### 3.3 CI環境

**GitHub Actions設定例**:
```yaml
name: Test

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run unit tests
        run: pnpm test:unit
      
      - name: Run integration tests
        run: pnpm test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 4. テストデータ

### 4.1 テストデータ戦略

#### データファクトリーパターン

```typescript
// test/factories/transaction.factory.ts
export class TransactionFactory {
  static create(overrides?: Partial<Transaction>): Transaction {
    return {
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      date: new Date('2025-01-15'),
      amount: -3000,
      category: CategoryFactory.create(),
      description: 'Test Transaction',
      institutionId: 'inst_001',
      accountId: 'acc_001',
      status: 'completed',
      isReconciled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides?: Partial<Transaction>): Transaction[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createIncome(overrides?: Partial<Transaction>): Transaction {
    return this.create({
      amount: 300000,
      category: { type: 'income', name: '給与' },
      ...overrides,
    });
  }

  static createExpense(overrides?: Partial<Transaction>): Transaction {
    return this.create({
      amount: -3000,
      category: { type: 'expense', name: '食費' },
      ...overrides,
    });
  }
}
```

### 4.2 テストフィクスチャ

```typescript
// test/fixtures/index.ts
export const testFixtures = {
  institutions: {
    bank: {
      id: 'inst_bank_001',
      name: '三菱UFJ銀行',
      type: 'bank',
      isConnected: true,
    },
    creditCard: {
      id: 'inst_card_001',
      name: '楽天カード',
      type: 'credit_card',
      isConnected: true,
    },
  },
  
  transactions: {
    january2025: [
      { date: '2025-01-01', amount: -1000, description: 'コンビニ' },
      { date: '2025-01-05', amount: -50000, description: '家賃' },
      { date: '2025-01-25', amount: 300000, description: '給与' },
    ],
  },
  
  categories: {
    food: { id: 'cat_food', name: '食費', type: 'expense' },
    housing: { id: 'cat_housing', name: '住居費', type: 'expense' },
    salary: { id: 'cat_salary', name: '給与', type: 'income' },
  },
};
```

### 4.3 データベースシーディング

```typescript
// test/seeds/test-data.seed.ts
export class TestDataSeed {
  async run() {
    // カテゴリの作成
    await this.seedCategories();
    
    // 金融機関の作成
    await this.seedInstitutions();
    
    // 取引の作成
    await this.seedTransactions();
  }

  private async seedCategories() {
    const categories = [
      { id: 'cat_food', name: '食費', type: 'expense' },
      { id: 'cat_housing', name: '住居費', type: 'expense' },
      // ...
    ];
    
    for (const category of categories) {
      await categoryRepository.save(category);
    }
  }
}
```

---

## 5. テストツール

### 5.1 テスティングフレームワーク

#### Jest
```json
{
  "framework": "Jest 29.x",
  "features": [
    "テストランナー",
    "アサーション",
    "モック",
    "カバレッジ",
    "スナップショット"
  ]
}
```

**設定例**:
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.spec.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### 5.2 E2Eテストツール

#### Playwright
```json
{
  "tool": "Playwright",
  "features": [
    "クロスブラウザテスト",
    "自動待機",
    "スクリーンショット",
    "動画録画",
    "ネットワークモック"
  ]
}
```

**設定例**:
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 5.3 Reactコンポーネントテスト

#### React Testing Library
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionList } from './TransactionList';

describe('TransactionList', () => {
  it('should render transactions', () => {
    const transactions = TransactionFactory.createMany(3);
    
    render(<TransactionList transactions={transactions} />);
    
    expect(screen.getByText('取引一覧')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(4); // header + 3 rows
  });
});
```

### 5.4 APIテストツール

#### Supertest
```typescript
import request from 'supertest';
import { app } from '../src/app';

describe('GET /api/transactions', () => {
  it('should return transactions list', async () => {
    const response = await request(app)
      .get('/api/transactions')
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toBeInstanceOf(Array);
  });
});
```

### 5.5 モックツール

```typescript
// 外部APIのモック
import nock from 'nock';

describe('BankApiClient', () => {
  it('should fetch transactions from bank API', async () => {
    nock('https://bank-api.example.com')
      .post('/api/transactions')
      .reply(200, {
        transactions: [
          { date: '2025-01-15', amount: -3000, description: 'セブンイレブン' },
        ],
      });

    const transactions = await bankApiClient.fetchTransactions(
      credentials,
      new Date('2025-01-01'),
      new Date('2025-01-31')
    );

    expect(transactions).toHaveLength(1);
  });
});
```

---

## 6. テストカバレッジ目標

### 6.1 カバレッジ基準

| レイヤー/モジュール | 目標カバレッジ | 最低カバレッジ |
|------------------|--------------|--------------|
| Domain Layer | 90% | 80% |
| Application Layer | 85% | 75% |
| Infrastructure Layer | 70% | 60% |
| Presentation Layer | 75% | 65% |
| Utility Functions | 95% | 90% |
| React Components | 80% | 70% |
| **全体** | **85%** | **75%** |

### 6.2 カバレッジの種類

1. **行カバレッジ（Line Coverage）**
   - 実行された行の割合
   - 最も基本的な指標

2. **分岐カバレッジ（Branch Coverage）**
   - if/else等の全分岐の実行割合
   - 条件分岐の網羅性を確認

3. **関数カバレッジ（Function Coverage）**
   - 実行された関数の割合

4. **文カバレッジ（Statement Coverage）**
   - 実行された文の割合

### 6.3 カバレッジレポート

```bash
# カバレッジ付きでテスト実行
pnpm test:coverage

# HTMLレポート生成
open coverage/lcov-report/index.html
```

---

## 7. 単体テスト設計

### 7.1 Domain Layerのテスト

#### エンティティのテスト

```typescript
// src/modules/transaction/domain/entities/transaction.entity.spec.ts
describe('Transaction Entity', () => {
  describe('constructor', () => {
    it('should create a valid transaction', () => {
      const transaction = new Transaction({
        id: new TransactionId('tx_001'),
        date: new Date('2025-01-15'),
        amount: new Money(-3000),
        category: CategoryFactory.create(),
        description: 'Test',
        institutionId: new InstitutionId('inst_001'),
        accountId: new AccountId('acc_001'),
        status: TransactionStatus.COMPLETED,
      });

      expect(transaction.id.value).toBe('tx_001');
      expect(transaction.amount.value).toBe(-3000);
    });

    it('should throw error when amount is zero', () => {
      expect(() => {
        new Transaction({
          ...validTransactionProps,
          amount: new Money(0),
        });
      }).toThrow('Amount cannot be zero');
    });
  });

  describe('changeCategory', () => {
    it('should change category and emit event', () => {
      const transaction = TransactionFactory.create();
      const newCategory = CategoryFactory.create({ name: '交通費' });

      transaction.changeCategory(newCategory);

      expect(transaction.category.name).toBe('交通費');
      expect(transaction.getDomainEvents()).toHaveLength(1);
      expect(transaction.getDomainEvents()[0]).toBeInstanceOf(
        TransactionCategoryChangedEvent
      );
    });
  });
});
```

#### 値オブジェクトのテスト

```typescript
// src/modules/transaction/domain/value-objects/money.spec.ts
describe('Money Value Object', () => {
  describe('constructor', () => {
    it('should create money with positive value', () => {
      const money = new Money(1000);
      expect(money.value).toBe(1000);
      expect(money.currency).toBe(Currency.JPY);
    });

    it('should create money with negative value', () => {
      const money = new Money(-1000);
      expect(money.value).toBe(-1000);
    });
  });

  describe('add', () => {
    it('should add two money objects', () => {
      const money1 = new Money(1000);
      const money2 = new Money(2000);
      
      const result = money1.add(money2);
      
      expect(result.value).toBe(3000);
    });

    it('should throw error when currencies differ', () => {
      const money1 = new Money(1000, Currency.JPY);
      const money2 = new Money(1000, Currency.USD);
      
      expect(() => money1.add(money2)).toThrow('Currency mismatch');
    });
  });

  describe('equals', () => {
    it('should return true for equal money', () => {
      const money1 = new Money(1000);
      const money2 = new Money(1000);
      
      expect(money1.equals(money2)).toBe(true);
    });

    it('should return false for different amounts', () => {
      const money1 = new Money(1000);
      const money2 = new Money(2000);
      
      expect(money1.equals(money2)).toBe(false);
    });
  });
});
```

#### ドメインサービスのテスト

```typescript
// src/modules/transaction/domain/services/reconciliation.service.spec.ts
describe('TransactionReconciliationService', () => {
  let service: TransactionReconciliationService;

  beforeEach(() => {
    service = new TransactionReconciliationService();
  });

  describe('reconcile', () => {
    it('should match when total equals bank withdrawal', () => {
      const cardTransactions = [
        TransactionFactory.create({ amount: -10000 }),
        TransactionFactory.create({ amount: -20000 }),
      ];
      const bankTransaction = TransactionFactory.create({ amount: -30000 });

      const result = service.reconcile(cardTransactions, bankTransaction);

      expect(result.status).toBe('matched');
      expect(result.difference).toBe(0);
    });

    it('should not match when amounts differ', () => {
      const cardTransactions = [
        TransactionFactory.create({ amount: -10000 }),
      ];
      const bankTransaction = TransactionFactory.create({ amount: -20000 });

      const result = service.reconcile(cardTransactions, bankTransaction);

      expect(result.status).toBe('unmatched');
      expect(result.difference).toBe(-10000);
    });
  });
});
```

### 7.2 Application Layerのテスト

#### ユースケースのテスト

```typescript
// src/modules/transaction/application/use-cases/create-transaction.usecase.spec.ts
describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;
  let mockTransactionRepository: jest.Mocked<ITransactionRepository>;
  let mockCategoryRepository: jest.Mocked<ICategoryRepository>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockTransactionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockCategoryRepository = {
      findById: jest.fn(),
    } as any;

    mockEventBus = {
      publish: jest.fn(),
    } as any;

    useCase = new CreateTransactionUseCase(
      mockTransactionRepository,
      mockCategoryRepository,
      mockEventBus
    );
  });

  it('should create a transaction successfully', async () => {
    const input: CreateTransactionInput = {
      date: new Date('2025-01-15'),
      amount: -3000,
      categoryId: 'cat_food',
      description: 'セブンイレブン',
      institutionId: 'inst_001',
      accountId: 'acc_001',
    };

    const category = CategoryFactory.create({ id: 'cat_food' });
    mockCategoryRepository.findById.mockResolvedValue(category);

    const result = await useCase.execute(input);

    expect(result.transactionId).toBeDefined();
    expect(mockTransactionRepository.save).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(TransactionCreatedEvent)
    );
  });

  it('should throw error when category not found', async () => {
    const input: CreateTransactionInput = {
      date: new Date('2025-01-15'),
      amount: -3000,
      categoryId: 'invalid_category',
      description: 'Test',
      institutionId: 'inst_001',
      accountId: 'acc_001',
    };

    mockCategoryRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(
      'Category not found'
    );
  });

  it('should throw error when amount is zero', async () => {
    const input: CreateTransactionInput = {
      date: new Date('2025-01-15'),
      amount: 0,
      categoryId: 'cat_food',
      description: 'Test',
      institutionId: 'inst_001',
      accountId: 'acc_001',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      'Amount must not be zero'
    );
  });
});
```

### 7.3 Reactコンポーネントのテスト

```typescript
// src/components/transactions/TransactionList.test.tsx
describe('TransactionList Component', () => {
  it('should render transaction list', () => {
    const transactions = TransactionFactory.createMany(3);
    
    render(<TransactionList transactions={transactions} />);
    
    expect(screen.getByText('取引一覧')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(4);
  });

  it('should display empty state when no transactions', () => {
    render(<TransactionList transactions={[]} />);
    
    expect(screen.getByText('取引がありません')).toBeInTheDocument();
  });

  it('should call onTransactionClick when row is clicked', () => {
    const transactions = TransactionFactory.createMany(1);
    const onClickMock = jest.fn();
    
    render(
      <TransactionList 
        transactions={transactions} 
        onTransactionClick={onClickMock}
      />
    );
    
    const row = screen.getByRole('row', { name: /test transaction/i });
    fireEvent.click(row);
    
    expect(onClickMock).toHaveBeenCalledWith(transactions[0]);
  });

  it('should filter transactions by category', () => {
    const transactions = [
      TransactionFactory.create({ category: { name: '食費' } }),
      TransactionFactory.create({ category: { name: '交通費' } }),
    ];
    
    const { rerender } = render(<TransactionList transactions={transactions} />);
    
    expect(screen.getAllByRole('row')).toHaveLength(3);
    
    rerender(
      <TransactionList 
        transactions={transactions} 
        filterCategory="食費"
      />
    );
    
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });
});
```

---

## 8. 統合テスト設計

### 8.1 APIエンドポイントのテスト

```typescript
// test/integration/api/transactions.api.spec.ts
describe('Transactions API', () => {
  let app: INestApplication;
  let transactionRepository: ITransactionRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ITransactionRepository)
      .useClass(InMemoryTransactionRepository)
      .compile();

    app = moduleRef.createNestApplication();
    transactionRepository = moduleRef.get(ITransactionRepository);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await transactionRepository.clear();
  });

  describe('GET /api/transactions', () => {
    it('should return paginated transactions', async () => {
      // Arrange
      const transactions = TransactionFactory.createMany(25);
      for (const transaction of transactions) {
        await transactionRepository.save(transaction);
      }

      // Act
      const response = await request(app.getHttpServer())
        .get('/api/transactions')
        .query({ page: 1, limit: 10 })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(10);
      expect(response.body.data.pagination.total).toBe(25);
      expect(response.body.data.pagination.totalPages).toBe(3);
    });

    it('should filter transactions by date range', async () => {
      // Arrange
      await transactionRepository.save(
        TransactionFactory.create({ date: new Date('2025-01-15') })
      );
      await transactionRepository.save(
        TransactionFactory.create({ date: new Date('2025-02-15') })
      );

      // Act
      const response = await request(app.getHttpServer())
        .get('/api/transactions')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
        .expect(200);

      // Assert
      expect(response.body.data.items).toHaveLength(1);
    });
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      // Arrange
      const dto = {
        date: '2025-01-15T10:00:00Z',
        amount: -3000,
        categoryId: 'cat_food',
        description: 'セブンイレブン',
        institutionId: 'inst_001',
        accountId: 'acc_001',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/transactions')
        .send(dto)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactionId).toBeDefined();

      const saved = await transactionRepository.findById(
        new TransactionId(response.body.data.transactionId)
      );
      expect(saved).toBeDefined();
      expect(saved.amount.value).toBe(-3000);
    });

    it('should return 400 for invalid input', async () => {
      // Arrange
      const dto = {
        date: 'invalid-date',
        amount: 'not-a-number',
      };

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/api/transactions')
        .send(dto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### 8.2 データベース統合テスト

```typescript
// test/integration/repositories/transaction.repository.spec.ts
describe('TransactionRepository (Integration)', () => {
  let repository: TypeOrmTransactionRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    await dataSource.initialize();
    repository = new TypeOrmTransactionRepository(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.synchronize(true); // Drop and recreate tables
  });

  describe('save', () => {
    it('should persist transaction to database', async () => {
      const transaction = TransactionFactory.create();

      await repository.save(transaction);

      const found = await repository.findById(transaction.id);
      expect(found).toBeDefined();
      expect(found.id.value).toBe(transaction.id.value);
    });
  });

  describe('findByDateRange', () => {
    it('should return transactions within date range', async () => {
      await repository.save(
        TransactionFactory.create({ date: new Date('2025-01-15') })
      );
      await repository.save(
        TransactionFactory.create({ date: new Date('2025-02-15') })
      );
      await repository.save(
        TransactionFactory.create({ date: new Date('2025-03-15') })
      );

      const results = await repository.findByDateRange(
        new Date('2025-01-01'),
        new Date('2025-02-28')
      );

      expect(results).toHaveLength(2);
    });
  });

  describe('complex queries', () => {
    it('should aggregate transactions by category', async () => {
      await repository.save(
        TransactionFactory.create({ 
          amount: -1000, 
          category: { id: 'cat_food', name: '食費' } 
        })
      );
      await repository.save(
        TransactionFactory.create({ 
          amount: -2000, 
          category: { id: 'cat_food', name: '食費' } 
        })
      );
      await repository.save(
        TransactionFactory.create({ 
          amount: -5000, 
          category: { id: 'cat_transport', name: '交通費' } 
        })
      );

      const summary = await repository.aggregateByCategory(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      expect(summary).toEqual({
        cat_food: -3000,
        cat_transport: -5000,
      });
    });
  });
});
```

### 8.3 外部API統合テスト

```typescript
// test/integration/external-api/bank-api-client.spec.ts
describe('BankApiClient (Integration)', () => {
  let client: BankApiClient;
  let mockServer: nock.Scope;

  beforeEach(() => {
    client = new BankApiClient(httpService, cryptoService);
    mockServer = nock('https://api.bank.example.com');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('fetchTransactions', () => {
    it('should fetch transactions from bank API', async () => {
      // Arrange
      const credentials = createTestCredentials();
      mockServer
        .post('/v1/transactions')
        .reply(200, {
          transactions: [
            {
              id: 'ext_001',
              date: '2025-01-15T10:00:00Z',
              amount: -3000,
              description: 'SEVEN ELEVEN',
            },
          ],
        });

      // Act
      const transactions = await client.fetchTransactions(
        credentials,
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      // Assert
      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount).toBe(-3000);
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const credentials = createTestCredentials();
      mockServer
        .post('/v1/transactions')
        .reply(500, { error: 'Internal Server Error' });

      // Act & Assert
      await expect(
        client.fetchTransactions(
          credentials,
          new Date('2025-01-01'),
          new Date('2025-01-31')
        )
      ).rejects.toThrow('Failed to fetch transactions');
    });

    it('should retry on timeout', async () => {
      // Arrange
      const credentials = createTestCredentials();
      mockServer
        .post('/v1/transactions')
        .delayConnection(5000)
        .reply(200, { transactions: [] });

      // Act & Assert
      await expect(
        client.fetchTransactions(
          credentials,
          new Date('2025-01-01'),
          new Date('2025-01-31')
        )
      ).rejects.toThrow('Request timeout');
    });
  });
});
```

---

## 9. E2Eテスト設計

### 9.1 主要ユーザーフローのテスト

```typescript
// e2e/user-flows/transaction-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Transaction Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // ログイン処理（将来実装時）
  });

  test('should create, edit, and delete a transaction', async ({ page }) => {
    // 取引作成ページへ移動
    await page.click('text=取引を追加');
    await expect(page).toHaveURL('/transactions/new');

    // フォーム入力
    await page.fill('input[name="date"]', '2025-01-15');
    await page.fill('input[name="amount"]', '3000');
    await page.selectOption('select[name="category"]', 'cat_food');
    await page.fill('textarea[name="description"]', 'セブンイレブン');

    // 保存
    await page.click('button:has-text("保存")');
    await expect(page).toHaveURL('/transactions');
    await expect(page.locator('text=取引を作成しました')).toBeVisible();

    // 作成した取引が一覧に表示されることを確認
    const row = page.locator('tr:has-text("セブンイレブン")');
    await expect(row).toBeVisible();

    // 編集
    await row.click();
    await page.click('button:has-text("編集")');
    await page.fill('input[name="amount"]', '2500');
    await page.click('button:has-text("保存")');
    await expect(page.locator('text=¥2,500')).toBeVisible();

    // 削除
    await page.click('button:has-text("削除")');
    await page.click('button:has-text("確認")');
    await expect(page.locator('text=取引を削除しました')).toBeVisible();
    await expect(row).not.toBeVisible();
  });

  test('should filter transactions by category', async ({ page }) => {
    await page.goto('/transactions');

    // 全取引を確認
    const allRows = await page.locator('tbody tr').count();
    expect(allRows).toBeGreaterThan(0);

    // カテゴリでフィルタ
    await page.selectOption('select[name="categoryFilter"]', 'cat_food');

    // フィルタ後の件数を確認
    const filteredRows = await page.locator('tbody tr').count();
    expect(filteredRows).toBeLessThanOrEqual(allRows);

    // 全ての行が「食費」カテゴリであることを確認
    const categories = await page.locator('td:nth-child(3)').allTextContents();
    categories.forEach(cat => {
      expect(cat).toBe('食費');
    });
  });

  test('should search transactions', async ({ page }) => {
    await page.goto('/transactions');

    // 検索
    await page.fill('input[name="search"]', 'セブン');
    await page.press('input[name="search"]', 'Enter');

    // 検索結果を確認
    const results = await page.locator('tbody tr').count();
    expect(results).toBeGreaterThan(0);

    const descriptions = await page.locator('td:nth-child(4)').allTextContents();
    descriptions.forEach(desc => {
      expect(desc.toLowerCase()).toContain('セブン'.toLowerCase());
    });
  });
});
```

### 9.2 金融機関連携フロー

```typescript
// e2e/user-flows/institution-setup.spec.ts
test.describe('Institution Setup Flow', () => {
  test('should add a bank account', async ({ page }) => {
    await page.goto('/settings/institutions');

    // 金融機関追加ボタンをクリック
    await page.click('text=金融機関を追加');

    // 銀行を選択
    await page.click('text=銀行');
    await page.click('text=三菱UFJ銀行');

    // 認証情報を入力
    await page.fill('input[name="bankCode"]', '0005');
    await page.fill('input[name="branchCode"]', '001');
    await page.fill('input[name="accountNumber"]', '1234567');
    await page.fill('input[name="apiKey"]', 'test_api_key');

    // 接続テスト
    await page.click('button:has-text("接続テスト")');

    // 成功メッセージを待つ
    await expect(page.locator('text=接続に成功しました')).toBeVisible();

    // 保存
    await page.click('button:has-text("保存")');

    // 一覧に表示されることを確認
    await expect(page.locator('text=三菱UFJ銀行')).toBeVisible();
    await expect(page.locator('text=✓ 正常')).toBeVisible();
  });

  test('should handle connection error', async ({ page }) => {
    await page.goto('/settings/institutions');

    await page.click('text=金融機関を追加');
    await page.click('text=銀行');
    await page.click('text=三菱UFJ銀行');

    // 誤った認証情報を入力
    await page.fill('input[name="bankCode"]', 'invalid');
    await page.fill('input[name="branchCode"]', 'invalid');
    await page.fill('input[name="accountNumber"]', 'invalid');
    await page.fill('input[name="apiKey"]', 'invalid_key');

    await page.click('button:has-text("接続テスト")');

    // エラーメッセージを確認
    await expect(page.locator('text=接続に失敗しました')).toBeVisible();
  });
});
```

### 9.3 レポート表示フロー

```typescript
// e2e/user-flows/reports.spec.ts
test.describe('Reports Flow', () => {
  test('should display monthly summary', async ({ page }) => {
    await page.goto('/reports/monthly');

    // 月を選択
    await page.selectOption('select[name="year"]', '2025');
    await page.selectOption('select[name="month"]', '1');

    // サマリーが表示されることを確認
    await expect(page.locator('text=収入合計')).toBeVisible();
    await expect(page.locator('text=支出合計')).toBeVisible();
    await expect(page.locator('text=収支')).toBeVisible();

    // グラフが表示されることを確認
    await expect(page.locator('canvas')).toBeVisible();

    // カテゴリ別内訳が表示されることを確認
    await expect(page.locator('text=カテゴリ別内訳')).toBeVisible();
  });

  test('should navigate between months', async ({ page }) => {
    await page.goto('/reports/monthly/2025/1');

    // 次月へ
    await page.click('button:has-text("次月")');
    await expect(page).toHaveURL('/reports/monthly/2025/2');

    // 前月へ
    await page.click('button:has-text("前月")');
    await expect(page).toHaveURL('/reports/monthly/2025/1');
  });

  test('should export report as CSV', async ({ page }) => {
    await page.goto('/reports/monthly/2025/1');

    // ダウンロード開始を監視
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("CSVエクスポート")');

    // ダウンロードを確認
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('transactions_2025-01.csv');
  });
});
```

### 9.4 レスポンシブテスト

```typescript
// e2e/responsive/mobile.spec.ts
test.describe('Mobile Responsive Tests', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
  });

  test('should display mobile menu', async ({ page }) => {
    await page.goto('/');

    // ハンバーガーメニューが表示されることを確認
    await expect(page.locator('button[aria-label="メニュー"]')).toBeVisible();

    // メニューを開く
    await page.click('button[aria-label="メニュー"]');

    // ナビゲーションが表示されることを確認
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=ダッシュボード')).toBeVisible();
    await expect(page.locator('text=取引一覧')).toBeVisible();
  });

  test('should display transaction list on mobile', async ({ page }) => {
    await page.goto('/transactions');

    // カード形式で表示されることを確認（テーブルではない）
    await expect(page.locator('.transaction-card')).toHaveCount.greaterThan(0);
  });
});
```

---

## 10. パフォーマンステスト設計

### 10.1 レスポンスタイムテスト

```typescript
// test/performance/api-response-time.spec.ts
describe('API Response Time', () => {
  test('GET /api/transactions should respond within 500ms', async () => {
    const startTime = Date.now();
    
    await request(app.getHttpServer())
      .get('/api/transactions')
      .query({ page: 1, limit: 20 })
      .expect(200);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500);
  });

  test('POST /api/transactions should respond within 500ms', async () => {
    const dto = {
      date: '2025-01-15T10:00:00Z',
      amount: -3000,
      categoryId: 'cat_food',
      description: 'Test',
      institutionId: 'inst_001',
      accountId: 'acc_001',
    };

    const startTime = Date.now();
    
    await request(app.getHttpServer())
      .post('/api/transactions')
      .send(dto)
      .expect(201);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500);
  });
});
```

### 10.2 負荷テスト

```typescript
// test/performance/load-test.spec.ts
describe('Load Test', () => {
  test('should handle 100 concurrent requests', async () => {
    const requests = Array.from({ length: 100 }, () =>
      request(app.getHttpServer())
        .get('/api/transactions')
        .query({ page: 1, limit: 20 })
    );

    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;

    // 全てのリクエストが成功
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });

    // 全体で5秒以内
    expect(duration).toBeLessThan(5000);

    // 平均レスポンスタイム
    const avgTime = duration / 100;
    console.log(`Average response time: ${avgTime}ms`);
    expect(avgTime).toBeLessThan(1000);
  });
});
```

### 10.3 データベースクエリパフォーマンス

```typescript
// test/performance/database-query.spec.ts
describe('Database Query Performance', () => {
  test('should fetch 1000 transactions within 1 second', async () => {
    // 1000件のデータを準備
    const transactions = TransactionFactory.createMany(1000);
    for (const tx of transactions) {
      await repository.save(tx);
    }

    const startTime = Date.now();
    
    const results = await repository.findByDateRange(
      new Date('2025-01-01'),
      new Date('2025-12-31')
    );
    
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(1000);
    expect(duration).toBeLessThan(1000);
  });

  test('should aggregate large dataset efficiently', async () => {
    // 10000件のデータを準備
    const transactions = TransactionFactory.createMany(10000);
    for (const tx of transactions) {
      await repository.save(tx);
    }

    const startTime = Date.now();
    
    const summary = await repository.aggregateByCategory(
      new Date('2025-01-01'),
      new Date('2025-12-31')
    );
    
    const duration = Date.now() - startTime;

    expect(Object.keys(summary).length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(2000);
  });
});
```

---

## 11. セキュリティテスト設計

### 11.1 認証・認可テスト

```typescript
// test/security/authentication.spec.ts
describe('Authentication Security', () => {
  test('should reject requests without authentication', async () => {
    await request(app.getHttpServer())
      .get('/api/transactions')
      .expect(401);
  });

  test('should reject requests with invalid token', async () => {
    await request(app.getHttpServer())
      .get('/api/transactions')
      .set('Authorization', 'Bearer invalid_token')
      .expect(401);
  });

  test('should accept requests with valid token', async () => {
    const token = await generateValidToken();
    
    await request(app.getHttpServer())
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

### 11.2 データ暗号化テスト

```typescript
// test/security/encryption.spec.ts
describe('Data Encryption', () => {
  let cryptoService: CryptoService;

  beforeEach(() => {
    cryptoService = new CryptoService();
  });

  test('should encrypt sensitive data', async () => {
    const plaintext = 'sensitive_api_key';
    
    const encrypted = await cryptoService.encrypt(plaintext);
    
    expect(encrypted.encrypted).toBeDefined();
    expect(encrypted.encrypted).not.toBe(plaintext);
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();
  });

  test('should decrypt encrypted data correctly', async () => {
    const plaintext = 'sensitive_api_key';
    
    const encrypted = await cryptoService.encrypt(plaintext);
    const decrypted = await cryptoService.decrypt(encrypted);
    
    expect(decrypted).toBe(plaintext);
  });

  test('should fail decryption with tampered data', async () => {
    const plaintext = 'sensitive_api_key';
    const encrypted = await cryptoService.encrypt(plaintext);
    
    // データを改ざん
    encrypted.encrypted = 'tampered_data';
    
    await expect(cryptoService.decrypt(encrypted)).rejects.toThrow();
  });
});
```

### 11.3 入力バリデーションテスト

```typescript
// test/security/input-validation.spec.ts
describe('Input Validation Security', () => {
  test('should reject XSS attempts', async () => {
    const xssPayload = {
      date: '2025-01-15',
      amount: -3000,
      categoryId: 'cat_food',
      description: '<script>alert("XSS")</script>',
      institutionId: 'inst_001',
      accountId: 'acc_001',
    };

    const response = await request(app.getHttpServer())
      .post('/api/transactions')
      .send(xssPayload)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('should reject SQL injection attempts', async () => {
    const sqlInjectionPayload = {
      categoryId: "' OR '1'='1",
    };

    const response = await request(app.getHttpServer())
      .get('/api/transactions')
      .query(sqlInjectionPayload)
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

---

## 12. テスト実行計画

### 12.1 開発時のテスト実行

```bash
# Watch modeで単体テスト実行（開発中）
pnpm test:watch

# 変更されたファイルのみテスト
pnpm test:changed

# 特定のファイルのみテスト
pnpm test src/modules/transaction
```

### 12.2 コミット前のテスト実行

```bash
# Git hookでの自動実行（Husky）
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint-staged
pnpm test:changed
```

### 12.3 CI/CDでのテスト実行

```yaml
# .github/workflows/test.yml
name: Test

on:
  pull_request:
    branches: [main, develop]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:unit --coverage
      - uses: codecov/codecov-action@v3

  integration-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:integration

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm playwright install
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 12.4 テスト実行スケジュール

| タイミング | テスト種類 | 実行環境 | 所要時間 |
|-----------|----------|---------|---------|
| コード保存時 | 単体（変更分） | Local | 数秒 |
| コミット前 | 単体（全体） | Local | 1-2分 |
| プルリクエスト | 単体+統合 | CI | 5-10分 |
| マージ前 | 単体+統合+E2E | CI | 15-20分 |
| デプロイ前 | 全種類 | CI | 20-30分 |
| 定期実行（夜間） | 全種類+パフォーマンス | CI | 30-60分 |

---

## 13. 品質メトリクス

### 13.1 コードカバレッジ

**目標値**:
- 全体: 85%以上
- Domain Layer: 90%以上
- Application Layer: 85%以上
- Critical Path: 100%

**測定方法**:
```bash
pnpm test:coverage
```

**レポート確認**:
```bash
open coverage/lcov-report/index.html
```

### 13.2 テスト品質指標

| 指標 | 目標値 | 測定方法 |
|------|--------|---------|
| テスト成功率 | 100% | CI/CDレポート |
| テストカバレッジ | 85%以上 | Jest Coverage |
| テスト実行時間 | 10分以内 | CI/CDログ |
| E2Eテスト成功率 | 95%以上 | Playwright Report |
| フレーキーテスト率 | 5%以下 | テスト履歴分析 |

### 13.3 バグ検出メトリクス

```typescript
// バグ検出効率の計算
const defectDetectionEfficiency = {
  defectsFoundInTesting: 45,
  defectsFoundInProduction: 5,
  
  calculate() {
    return (this.defectsFoundInTesting / 
      (this.defectsFoundInTesting + this.defectsFoundInProduction)) * 100;
  }
};

// 目標: 90%以上
console.log(`DDE: ${defectDetectionEfficiency.calculate()}%`);
```

---

## 14. テストケース管理

### 14.1 テストケース命名規則

```typescript
// Good: 明確で具体的
describe('CreateTransactionUseCase', () => {
  it('should create a transaction successfully with valid input', () => {});
  it('should throw error when category not found', () => {});
  it('should throw error when amount is zero', () => {});
});

// Bad: 曖昧
describe('Transaction', () => {
  it('works', () => {});
  it('fails', () => {});
});
```

### 14.2 テストケースドキュメント

```typescript
/**
 * Test Case ID: TC-TR-001
 * Feature: Transaction Creation
 * Priority: High
 * 
 * @description
 * Verify that a transaction can be created successfully with valid input.
 * 
 * @preconditions
 * - Category exists in the system
 * - Institution is connected
 * 
 * @testSteps
 * 1. Prepare valid transaction input
 * 2. Call createTransaction use case
 * 3. Verify transaction is saved
 * 4. Verify event is published
 * 
 * @expectedResult
 * - Transaction is created with a valid ID
 * - Transaction is persisted in repository
 * - TransactionCreatedEvent is published
 */
it('[TC-TR-001] should create a transaction successfully with valid input', async () => {
  // Test implementation
});
```

### 14.3 テストメンテナンス

#### フレーキーテストの削減
```typescript
// Bad: フレーキーテスト
it('should complete within time', () => {
  setTimeout(() => {
    expect(result).toBe(true);
  }, 100); // タイミング依存
});

// Good: 確実なテスト
it('should complete within time', async () => {
  const result = await waitFor(() => service.isComplete());
  expect(result).toBe(true);
});
```

#### テストの独立性確保
```typescript
// Bad: テスト間で状態を共有
let sharedData;

it('test 1', () => {
  sharedData = createData();
  // ...
});

it('test 2', () => {
  // sharedDataに依存
  expect(sharedData).toBeDefined();
});

// Good: 各テストが独立
it('test 1', () => {
  const data = createData();
  // ...
});

it('test 2', () => {
  const data = createData();
  // ...
});
```

---

## まとめ

本テスト設計書では、以下の内容を定義しました：

### テスト戦略
- ✅ テストピラミッド戦略（70% 単体、20% 統合、10% E2E）
- ✅ Shift-Left Testing
- ✅ FIRST原則とAAAパターン

### テストレベル
- ✅ 単体テスト（ドメイン、アプリケーション、UI）
- ✅ 統合テスト（API、DB、外部API）
- ✅ E2Eテスト（ユーザーフロー）
- ✅ パフォーマンステスト
- ✅ セキュリティテスト

### テストツール
- ✅ Jest（単体・統合テスト）
- ✅ Playwright（E2Eテスト）
- ✅ React Testing Library（コンポーネントテスト）
- ✅ Supertest（APIテスト）

### 品質目標
- ✅ テストカバレッジ: 85%以上
- ✅ テスト成功率: 100%
- ✅ バグ検出効率: 90%以上

このテスト設計に基づいて実装することで、高品質で保守性の高いアプリケーションを実現できます。

---

**文書バージョン**: 1.0  
**作成日**: 2025-11-15  
**最終更新日**: 2025-11-15

