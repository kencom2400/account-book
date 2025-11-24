# Frontend カバレッジ詳細

> **最終更新**: 2025-11-24 17:24:04  
> **コミット**: `44f2308`

## ユニットテスト カバレッジ

| メトリクス | カバレッジ |
| ---------- | ---------- |
| Lines      | 0%         |
| Statements | 0%         |
| Functions  | 0%         |
| Branches   | 0%         |

### HTMLレポート

詳細なカバレッジレポート（ファイル別・行別）:
`apps/frontend/coverage/lcov-report/index.html`

### 実行方法

```bash
cd apps/frontend
pnpm test -- --coverage
```

## コンポーネント別カバレッジ

Frontendは以下のコンポーネントで構成されています：

- **Pages**: Next.jsページコンポーネント
- **Components**: 再利用可能なUIコンポーネント
- **Hooks**: カスタムReactフック
- **Utils**: ユーティリティ関数
- **API Client**: APIクライアント

詳細なコンポーネント別カバレッジは `apps/frontend/coverage/lcov-report/index.html` を参照してください。

## E2Eテスト

E2Eテストは Playwright で実行されます。

### 実行方法

```bash
cd apps/frontend
pnpm test:e2e
```

### E2Eテストレポート

```bash
# レポートを表示
pnpm test:e2e:report
```

## カバレッジ向上のヒント

### ユニットテストで重点的にカバーすべき部分

1. **Custom Hooks**: ビジネスロジックを含むフック
2. **Utility Functions**: 共通ユーティリティ
3. **API Client**: API呼び出しロジック
4. **State Management**: Zustand store

### E2Eテストで重点的にカバーすべき部分

1. **User Flows**: ユーザージャーニー全体
2. **Form Submission**: フォーム送信とバリデーション
3. **Navigation**: ページ遷移
4. **Error Handling**: エラー表示

## 参考資料

- [Next.js Testing](https://nextjs.org/docs/testing)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/)
- [Jest Configuration](../../apps/frontend/jest.config.js)
