# Backend ユニットテスト環境

## 概要

このドキュメントでは、Backendのユニットテスト環境の使用方法について説明します。

## テスト実行

### 基本的な実行方法

```bash
# すべてのユニットテストを実行
pnpm test:unit

# カバレッジ付きで実行
pnpm test:cov

# Watchモードで実行
pnpm test:watch
```

### 特定のテストファイルのみ実行

```bash
# 特定のファイルのみ実行
pnpm test transaction.entity.spec.ts

# パターンマッチで実行
pnpm test transaction
```

## テスト環境の構成

### Jest設定

Jest設定は `package.json` の `jest` セクションに定義されています。

主な設定項目：

- **rootDir**: `src` - テスト対象のソースコードのルートディレクトリ
- **testRegex**: `.*\\.spec\\.ts$` - テストファイルのパターン
- **testEnvironment**: `node` - Node.js環境で実行
- **clearMocks**: `true` - 各テスト後にモックをクリア
- **restoreMocks**: `true` - 各テスト後にモックを復元

### セットアップファイル

`jest.setup.ts` では、以下の設定を行っています：

- `@nestjs/swagger` のモック（テスト時に不要なため）

**注意**: `@nestjs/swagger` のモックは `moduleNameMapper` によって解決されているため、`setupFilesAfterEnv` の設定は不要です。

## テストユーティリティ

### 共通ヘルパー

`src/common/test-utils/` ディレクトリに、ユニットテストで使用する共通のヘルパー関数が定義されています。

#### モックファクトリー

```typescript
import { createMockTransaction } from '@/common/test-utils';

// TransactionEntityのモックを作成
const transaction = createMockTransaction({
  id: 'tx_123',
  amount: 1000,
  category: { id: 'cat_1', name: 'Test', type: CategoryType.EXPENSE },
});
```

#### テストヘルパー

```typescript
import { createTestDate, createTestId, wait } from '@/common/test-utils';

// テスト用の日付を生成
const date = createTestDate(2024, 1, 15);

// テスト用のIDを生成
const id = createTestId('tx');

// 非同期処理の待機
await wait(100);
```

## テストの書き方

### 基本的な構造

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  describe('methodName', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = service.methodName(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### モックの使用

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyUseCase } from './my.use-case';
import { MY_REPOSITORY } from './my.tokens';

describe('MyUseCase', () => {
  let useCase: MyUseCase;
  let mockRepository: jest.Mocked<MyRepository>;

  beforeEach(async () => {
    const mockRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyUseCase,
        {
          provide: MY_REPOSITORY,
          useValue: mockRepo,
        },
      ],
    }).compile();

    useCase = module.get<MyUseCase>(MyUseCase);
    mockRepository = module.get(MY_REPOSITORY);
  });

  it('should call repository method', async () => {
    // Arrange
    mockRepository.findById.mockResolvedValue({ id: '1' });

    // Act
    const result = await useCase.execute('1');

    // Assert
    expect(mockRepository.findById).toHaveBeenCalledWith('1');
    expect(result).toEqual({ id: '1' });
  });
});
```

## テストカバレッジ

### カバレッジの確認

```bash
# カバレッジレポートを生成
pnpm test:cov

# カバレッジレポートは coverage/ ディレクトリに出力されます
```

### カバレッジ目標

- **全体**: 80%以上
- **Domain層**: 90%以上
- **Application層**: 80%以上
- **Infrastructure層**: 70%以上
- **Presentation層**: 70%以上

## ベストプラクティス

### 1. AAAパターンの使用

テストは Arrange（準備）、Act（実行）、Assert（検証）の3つのセクションに分けて記述します。

### 2. モックのクリーンアップ

Jestの設定（`clearMocks: true`, `restoreMocks: true`）により、各テストの前にモックは自動的にリセットされます。そのため、手動で `jest.clearAllMocks()` を呼び出す必要はありません。

### 3. テストの独立性

各テストは独立して実行できるようにし、他のテストの状態に依存しないようにします。

### 4. テストデータの再利用

共通のテストデータは、モックファクトリーやヘルパー関数を使用して生成します。

### 5. エッジケースのテスト

正常系だけでなく、エラーケースやエッジケースもテストします。

## トラブルシューティング

### テストがタイムアウトする

Jestのデフォルトタイムアウトは5秒です。長時間かかるテストの場合は、`jest.setTimeout()` を使用してタイムアウトを延長します。

```typescript
jest.setTimeout(10000); // 10秒に設定
```

### モックが正しく動作しない

`clearMocks` と `restoreMocks` が `package.json` で有効になっていることを確認してください。

### 型エラーが発生する

TypeScriptの型定義が正しく設定されていることを確認してください。モックの型は `jest.Mocked<T>` を使用します。

## 参考資料

- [Jest公式ドキュメント](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [TypeScript Jest設定](https://kulshekhar.github.io/ts-jest/)
