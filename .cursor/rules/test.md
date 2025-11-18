# テスト実装ガイドライン（ユニットテスト + E2Eテスト）

## 基本原則

- **全ての新規実装にユニットテストを作成すること**
- **APIエンドポイントやUI機能を実装した場合は、E2Eテストも作成すること**
- **実装したテストは必ず実行し、全てのテストが成功することを確認すること**
- **テストが失敗した場合は、必ず修正してから次の作業に進むこと**
- **テストカバレッジは80%以上を目標とする**
- **テストは独立して実行可能であること**
- **テストは高速に実行できること**
- **テストは保守しやすく、理解しやすいこと**

## 🚫 テストでの絶対禁止事項

### 1. any型の安易な使用禁止

**❌ 悪い例:**

```typescript
// テストだからといってany型を乱用しない
const mockData: any = { id: 1 }; // ❌
const result: any = await service.execute(); // ❌
```

**✅ 良い例:**

```typescript
// テストでも適切な型定義を使用
const mockData: CreditCardEntity = {
  id: '1',
  issuer: 'Test Card',
  // ... 必要なプロパティを全て定義
};

// モックオブジェクトでのみany型を許容（理由コメント必須）
const mockRepository = {
  findById: jest.fn(),
  save: jest.fn(),
} as any; // Jest型定義の制約によりany使用
```

**許容されるany型使用（理由コメント必須）:**

- Jestモックオブジェクトの型キャスト
- 外部ライブラリのモック作成時
- 上記の場合も必ずコメントで理由を明記

### 2. テストエラー・警告の握りつぶし禁止

**❌ 絶対に禁止:**

```typescript
// テストが失敗しているのにスキップする
it.skip('should process payment', () => {
  // ❌ 理由なしのskipは禁止
  // ...
});

// エラーを握りつぶす
try {
  await service.execute();
} catch (error) {
  // 何もしない  // ❌ エラーを無視するのは禁止
}

// 期待値を緩くして通す
expect(result).toBeTruthy(); // ❌ 具体的な値を検証すべき
```

**✅ 正しい対応:**

```typescript
// 一時的にスキップする場合は理由とTODOを明記
// TODO: #456 - APIモックの修正後にこのテストを有効化
it.skip('should process payment', () => {
  // ...
});

// エラーは適切にテスト
it('should throw error when invalid data', async () => {
  await expect(service.execute(invalidData)).rejects.toThrow('Invalid data');
});

// 具体的な値を検証
expect(result.status).toBe('COMPLETED');
expect(result.amount).toBe(1000);
```

### 3. テスト実行の省略禁止

**❌ 絶対に禁止:**

- テストコードを書いたが実行しない
- テストが失敗したまま放置
- 「後でテスト書く」と先延ばし

**✅ 必須の手順:**

1. テストコード作成
2. **即座にテスト実行**（`pnpm test`）
3. 全テスト成功を確認
4. 失敗があれば即座に修正
5. コミット前に再度確認

## テスト実行義務

### 新機能実装時

1. **ユニットテストコードを作成する**
   - ドメインロジック、UseCase、コントローラーなど、各レイヤーのユニットテストを作成
2. **E2Eテストコードを作成する（該当する場合）**
   - 新規APIエンドポイントを実装した場合: Backend E2Eテストを作成
   - 新規UI機能を実装した場合: Frontend E2Eテストを作成
   - 既存のE2Eテストが失敗する場合は、実装状況に応じて修正またはスキップ
3. **必ずテストを実行する**
   - ユニットテスト: `./scripts/test.sh`
   - E2Eテスト: `./scripts/test/test-e2e.sh`
4. **全てのテストが成功するまで修正する**
5. コミット前に再度テストを実行し、全て成功することを確認する

### テスト実行コマンド

#### ユニットテスト

```bash
# モジュール全体のテスト
cd apps/backend
pnpm test <module-name>

# 例: クレジットカードモジュールのテスト
pnpm test credit-card

# 特定のファイルのテスト
pnpm test <file-path>

# ウォッチモード（開発時推奨）
pnpm test:watch

# カバレッジ付き
pnpm test:cov
```

#### E2Eテスト

```bash
# Backend E2Eテスト
cd apps/backend
pnpm test:e2e

# Frontend E2Eテスト
cd apps/frontend
pnpm test:e2e

# すべてのE2Eテスト（スクリプト経由）
./scripts/test/test-e2e.sh all

# Backendのみ
./scripts/test/test-e2e.sh backend

# Frontendのみ
./scripts/test/test-e2e.sh frontend
```

### テスト失敗時の対応

1. エラーメッセージを確認する
2. 失敗したテストケースを特定する
3. 以下のいずれかを実施：
   - **実装コードの修正**: バグや仕様の誤りがある場合
   - **テストコードの修正**: テストの期待値や前提条件が誤っている場合
   - **テストデータの修正**: ファクトリーやモックのデータが不適切な場合
4. 再度テストを実行し、成功することを確認する
5. **全てのテストが成功するまで、この手順を繰り返す**

### コミット前チェックリスト

- [ ] 新規実装に対応するユニットテストコードを作成した
- [ ] APIエンドポイントやUI機能を実装した場合、E2Eテストコードを作成した
- [ ] ユニットテストを実行し、全て成功した（`./scripts/test.sh`）
- [ ] E2Eテストを実行し、全て成功した（`./scripts/test/test-e2e.sh`）
- [ ] Linterエラーがない
- [ ] 不要なconsole.log等のデバッグコードを削除した
- [ ] コミットメッセージが適切である

## テストフレームワーク

### ユニットテスト

- **Jest**: TypeScript/JavaScript用テストフレームワーク
- **@nestjs/testing**: NestJS固有の機能テスト用

### E2Eテスト

- **Jest + Supertest**: Backend APIのE2Eテスト用
- **Playwright**: Frontend UIのE2Eテスト用

## ディレクトリ構造

```
src/
├── modules/
│   └── credit-card/
│       ├── domain/
│       │   ├── entities/
│       │   │   ├── credit-card.entity.ts
│       │   │   └── credit-card.entity.spec.ts  ← テストファイル
│       │   └── value-objects/
│       │       ├── payment.vo.ts
│       │       └── payment.vo.spec.ts
│       ├── application/
│       │   └── use-cases/
│       │       ├── connect-credit-card.use-case.ts
│       │       └── connect-credit-card.use-case.spec.ts
│       ├── infrastructure/
│       │   ├── adapters/
│       │   │   ├── mock-credit-card-api.adapter.ts
│       │   │   └── mock-credit-card-api.adapter.spec.ts
│       │   └── repositories/
│       │       └── credit-card.repository.spec.ts
│       └── presentation/
│           └── controllers/
│               └── credit-card.controller.spec.ts
```

## 命名規則

- テストファイル: `<ファイル名>.spec.ts`
- テストスイート: `describe('<クラス名/機能名>', () => {})`
- テストケース: `it('should <期待される動作>', () => {})`
- または: `test('<期待される動作>', () => {})`

## テストの構造（AAA パターン）

```typescript
describe('CreditCardEntity', () => {
  describe('constructor', () => {
    it('should create a valid credit card entity', () => {
      // Arrange - 準備
      const cardData = {
        id: 'cc_123',
        cardName: 'テストカード',
        // ...
      };

      // Act - 実行
      const creditCard = new CreditCardEntity(/* ... */);

      // Assert - 検証
      expect(creditCard.id).toBe('cc_123');
      expect(creditCard.cardName).toBe('テストカード');
    });
  });
});
```

## レイヤー別テストガイドライン

### Domain層のテスト

**エンティティのテスト:**

- コンストラクタのバリデーション
- ビジネスロジックメソッド
- 状態変更メソッド
- エッジケース

```typescript
describe('CreditCardEntity', () => {
  describe('validation', () => {
    it('should throw error when card number is invalid', () => {
      expect(() => {
        new CreditCardEntity(
          'cc_1',
          'カード名',
          '12345' // 5桁（無効）
          // ...
        );
      }).toThrow('Card number must be last 4 digits');
    });
  });

  describe('business logic', () => {
    it('should calculate available credit correctly', () => {
      const card = createTestCreditCard({
        creditLimit: 100000,
        currentBalance: 30000,
      });

      expect(card.getAvailableCredit()).toBe(70000);
    });
  });
});
```

**Value Objectのテスト:**

- 不変性の確認
- バリデーション
- 等価性チェック
- 計算ロジック

```typescript
describe('PaymentVO', () => {
  it('should be immutable', () => {
    const payment = new PaymentVO(/* ... */);

    // Value Objectは不変なので、新しいインスタンスを返す
    const updated = payment.markAsPaid(new Date());

    expect(payment.isPaid()).toBe(false);
    expect(updated.isPaid()).toBe(true);
  });
});
```

### Application層のテスト

**UseCaseのテスト:**

- モックを使用して依存関係を分離
- 正常系と異常系の両方をテスト
- ビジネスロジックの検証

```typescript
describe('ConnectCreditCardUseCase', () => {
  let useCase: ConnectCreditCardUseCase;
  let mockRepository: jest.Mocked<ICreditCardRepository>;
  let mockTransactionRepository: jest.Mocked<ICreditCardTransactionRepository>;
  let mockAPIClient: jest.Mocked<ICreditCardAPIClient>;
  let mockCryptoService: jest.Mocked<ICryptoService>;

  beforeEach(() => {
    // モックの作成
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      // ...
    } as any;

    mockTransactionRepository = {
      saveMany: jest.fn(),
      findByCreditCardIdAndDateRange: jest.fn(),
      // ...
    } as any;

    mockAPIClient = {
      testConnection: jest.fn(),
      getCardInfo: jest.fn(),
      // ...
    } as any;

    mockCryptoService = {
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    } as any;

    useCase = new ConnectCreditCardUseCase(
      mockRepository,
      mockTransactionRepository,
      mockAPIClient,
      mockCryptoService
    );
  });

  it('should connect credit card successfully', async () => {
    // Arrange
    mockAPIClient.testConnection.mockResolvedValue({ success: true });
    mockAPIClient.getCardInfo.mockResolvedValue({
      cardNumber: '1234',
      creditLimit: 500000,
      currentBalance: 0,
      availableCredit: 500000,
    });
    mockCryptoService.encrypt.mockResolvedValue(/* encrypted data */);
    mockRepository.save.mockImplementation((card) => Promise.resolve(card));

    const input = {
      cardName: 'テストカード',
      // ...
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.cardName).toBe('テストカード');
    expect(mockAPIClient.testConnection).toHaveBeenCalledTimes(1);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw error when API connection fails', async () => {
    // Arrange
    mockAPIClient.testConnection.mockResolvedValue({
      success: false,
      error: 'Connection failed',
    });

    const input = {
      /* ... */
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow('Failed to connect');
  });
});
```

### Infrastructure層のテスト

**リポジトリのテスト:**

- CRUD操作
- ファイルシステム操作（モック使用）
- エラーハンドリング

```typescript
describe('FileSystemCreditCardRepository', () => {
  let repository: FileSystemCreditCardRepository;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    } as any;

    repository = new FileSystemCreditCardRepository(mockConfigService);
  });

  it('should save and retrieve credit card', async () => {
    const card = createTestCreditCard();

    await repository.save(card);
    const retrieved = await repository.findById(card.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(card.id);
  });
});
```

**アダプターのテスト:**

- API通信のモック
- データ変換ロジック
- エラーハンドリング

### Presentation層のテスト

**コントローラーのテスト:**

- リクエスト/レスポンスの検証
- UseCaseの呼び出し確認
- エラーハンドリング

```typescript
describe('CreditCardController', () => {
  let controller: CreditCardController;
  let mockConnectUseCase: jest.Mocked<ConnectCreditCardUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditCardController],
      providers: [
        {
          provide: ConnectCreditCardUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        // ...
      ],
    }).compile();

    controller = module.get<CreditCardController>(CreditCardController);
    mockConnectUseCase = module.get(ConnectCreditCardUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should connect credit card', async () => {
    const dto = {
      cardName: 'テストカード',
      // ...
    };

    const mockCard = createTestCreditCard();
    mockConnectUseCase.execute.mockResolvedValue(mockCard);

    const result = await controller.connect(dto);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(mockConnectUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        cardName: 'テストカード',
      })
    );
  });
});
```

## テストヘルパー/ファクトリー

テストデータを簡単に作成するためのヘルパー関数を用意：

```typescript
// test/helpers/credit-card.factory.ts
export function createTestCreditCard(
  overrides?: Partial<CreditCardConstructorParams>
): CreditCardEntity {
  return new CreditCardEntity(
    overrides?.id || 'cc_test_123',
    overrides?.cardName || 'テストカード',
    overrides?.cardNumber || '1234',
    overrides?.cardHolderName || '山田太郎',
    overrides?.expiryDate || new Date('2025-12-31'),
    overrides?.credentials || createTestCredentials(),
    overrides?.isConnected ?? true,
    overrides?.lastSyncedAt || new Date(),
    overrides?.paymentDay || 27,
    overrides?.closingDay || 15,
    overrides?.creditLimit || 500000,
    overrides?.currentBalance || 0,
    overrides?.issuer || 'テスト銀行',
    overrides?.createdAt || new Date(),
    overrides?.updatedAt || new Date()
  );
}
```

## モックの作成

```typescript
// jest.fn()でモック関数を作成
const mockFn = jest.fn();

// 戻り値を設定
mockFn.mockReturnValue('value');
mockFn.mockResolvedValue('async value');
mockFn.mockRejectedValue(new Error('error'));

// 実装を設定
mockFn.mockImplementation((arg) => arg * 2);

// 呼び出し確認
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
```

## カバレッジ

```bash
# カバレッジレポート生成
pnpm test:cov

# カバレッジ閾値（jest.config.js）
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

## ベストプラクティス

### ✅ 良い例

```typescript
// 明確なテストケース名
it('should throw error when credit limit is negative', () => {
  expect(() => {
    new CreditCardEntity(/* creditLimit: -1000 */);
  }).toThrow('Credit limit must be positive');
});

// 1つのテストケースで1つのことをテスト
it('should update balance', () => {
  const card = createTestCreditCard({ currentBalance: 1000 });
  const updated = card.updateBalance(2000);
  expect(updated.currentBalance).toBe(2000);
});

// モックは必要最小限
it('should save credit card', async () => {
  mockRepository.save.mockImplementation((card) => Promise.resolve(card));
  // ...
});
```

### ❌ 悪い例

```typescript
// 曖昧なテストケース名
it('should work', () => {
  /* ... */
});

// 1つのテストで複数のことをテスト
it('should do everything', () => {
  // validation test
  // business logic test
  // error handling test
});

// 過度なモック
it('should test', () => {
  // 全てのメソッドをモック化すると、実際の動作をテストできない
});
```

## テスト実行

```bash
# 全テスト実行
pnpm test

# 特定のファイルのテスト
pnpm test credit-card.entity.spec.ts

# ウォッチモード
pnpm test:watch

# カバレッジ付き
pnpm test:cov

# E2Eテスト
pnpm test:e2e

# Backend E2Eテスト
cd apps/backend && pnpm test:e2e

# Frontend E2Eテスト
cd apps/frontend && pnpm test:e2e

# すべてのE2Eテスト（スクリプト経由）
./scripts/test/test-e2e.sh all
```

## E2Eテスト実装ガイドライン

### Backend E2Eテスト

**作成が必要な場合:**

- 新規APIエンドポイントを実装した場合
- APIの統合動作を確認したい場合

**テストファイルの場所:**

- `apps/backend/test/*.e2e-spec.ts`

**例:**

```typescript
describe('Securities API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SecuritiesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should connect to securities account successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/securities/connect')
      .send({
        securitiesCompanyName: 'SBI証券',
        accountNumber: '12345678',
        accountType: 'specific',
        loginId: 'test_user',
        password: 'test_password',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

### Frontend E2Eテスト

**作成が必要な場合:**

- 新規ページやUI機能を実装した場合
- ユーザーフローを確認したい場合

**テストファイルの場所:**

- `apps/frontend/e2e/*.spec.ts`

**例:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('ダッシュボード', () => {
  test('ダッシュボードページが表示される', async ({ page }) => {
    await page.goto('/dashboard');

    // ローディングが完了するまで待機
    await page
      .waitForSelector('text=読み込み中...', { state: 'hidden', timeout: 10000 })
      .catch(() => {});

    // タイトルが表示されることを確認
    const hasHeading = await page
      .getByRole('heading', { level: 1 })
      .isVisible()
      .catch(() => false);
    expect(hasHeading).toBe(true);
  });
});
```

### E2Eテストの注意事項

- **実装していない機能のテストはスキップする**: `it.skip()`を使用
- **ローディング状態を考慮する**: 非同期処理の完了を待つ
- **エラー状態もテストする**: 正常系だけでなく異常系も確認
- **テストデータの管理**: テスト実行前後のデータクリーンアップを考慮

## まとめ

- **テストファースト**: 実装前にテストを書く（TDD推奨）
- **ユニットテスト + E2Eテスト**: 両方を作成して品質を担保
- **独立性**: テストは他のテストに依存しない
- **明確性**: テストケース名で何をテストしているか明確に
- **保守性**: テストコードも本番コードと同じ品質で
- **カバレッジ**: 80%以上を目標に、でも100%にこだわりすぎない
- **高速性**: テストは高速に実行できるように

## 参考資料

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
