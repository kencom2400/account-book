# ユニットテスト実装ガイドライン

## 基本原則

- **全ての新規実装にユニットテストを作成すること**
- **テストカバレッジは80%以上を目標とする**
- **テストは独立して実行可能であること**
- **テストは高速に実行できること**
- **テストは保守しやすく、理解しやすいこと**

## テストフレームワーク

- **Jest**: TypeScript/JavaScript用テストフレームワーク
- **@nestjs/testing**: NestJS固有の機能テスト用

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
          '12345', // 5桁（無効）
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
  let mockAPIClient: jest.Mocked<ICreditCardAPIClient>;
  let mockCryptoService: jest.Mocked<ICryptoService>;

  beforeEach(() => {
    // モックの作成
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
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
      mockCryptoService,
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

    const input = { /* ... */ };

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
      }),
    );
  });
});
```

## テストヘルパー/ファクトリー

テストデータを簡単に作成するためのヘルパー関数を用意：

```typescript
// test/helpers/credit-card.factory.ts
export function createTestCreditCard(
  overrides?: Partial<CreditCardConstructorParams>,
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
    overrides?.updatedAt || new Date(),
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
  mockRepository.save.mockImplementation(card => Promise.resolve(card));
  // ...
});
```

### ❌ 悪い例

```typescript
// 曖昧なテストケース名
it('should work', () => { /* ... */ });

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
```

## まとめ

- **テストファースト**: 実装前にテストを書く（TDD推奨）
- **独立性**: テストは他のテストに依存しない
- **明確性**: テストケース名で何をテストしているか明確に
- **保守性**: テストコードも本番コードと同じ品質で
- **カバレッジ**: 80%以上を目標に、でも100%にこだわりすぎない
- **高速性**: テストは高速に実行できるように

## 参考資料

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

