# Backend カバレッジ詳細

> **最終更新**: 2025-11-24 23:05:13  
> **コミット**: `5329d9e`

## ユニットテスト カバレッジ

| メトリクス | カバレッジ |
|----------|----------|
| Lines | 0% |
| Statements | 0% |
| Functions | 0% |
| Branches | 0% |

### HTMLレポート

詳細なカバレッジレポート（ファイル別・行別）:
`apps/backend/coverage/lcov-report/index.html`

### 実行方法

```bash
cd apps/backend
pnpm test:cov
```

## E2Eテスト カバレッジ

| メトリクス | カバレッジ |
|----------|----------|
| Lines | 0% |
| Statements | 0% |
| Functions | 0% |
| Branches | 0% |

### HTMLレポート

詳細なカバレッジレポート（ファイル別・行別）:
`apps/backend/coverage-e2e/lcov-report/index.html`

### 実行方法

```bash
cd apps/backend
pnpm test:e2e:cov
```

## モジュール別カバレッジ

Backendは以下のモジュールで構成されています：

- **Common**: 共通ユーティリティ、デコレータ、フィルタ
- **Institution**: 金融機関管理
- **Transaction**: 取引データ管理
- **Category**: カテゴリ管理
- **Sync**: データ同期
- **Chart**: チャートデータ生成
- **Health**: ヘルスチェック

詳細なモジュール別カバレッジは `apps/backend/coverage/lcov-report/index.html` を参照してください。

## カバレッジ向上のヒント

### ユニットテストで重点的にカバーすべき部分

1. **Use Cases**: ビジネスロジックの中核
2. **Services**: ドメインロジック
3. **Validators**: バリデーションロジック
4. **Handlers**: イベントハンドラ

### E2Eテストで重点的にカバーすべき部分

1. **API Endpoints**: エンドポイント全体の動作
2. **Integration**: モジュール間連携
3. **Error Handling**: エラーケース
4. **Authentication**: 認証・認可

## 参考資料

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Configuration](../../apps/backend/package.json)
