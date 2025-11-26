# テストカバレッジレポート

> **最終更新**: 2025-11-25 22:31:29  
> **コミット**: `bcd7fc9`  
> **ブランチ**: `main`

## 概要

このドキュメントは、各モジュールのテストカバレッジ状況をまとめたものです。

### カバレッジ目標

- **プロジェクト全体**: 80%以上
- **各モジュール**: 80%以上
- **新規コード**: 80%以上

## モジュール別カバレッジサマリー

| モジュール      | Lines  | Statements | Functions | Branches |
| --------------- | ------ | ---------- | --------- | -------- |
| Backend (Unit)  | 35.89% | 35.89%     | 32.00%    | 33.02%   |
| Backend (E2E)   | 1.23%  | 1.23%      | 0.98%     | 2.00%    |
| Frontend (Unit) | 47.92% | 47.92%     | 46.23%    | 46.61%   |

## 詳細レポート

各モジュールの詳細なカバレッジレポートは以下を参照してください：

- [Backend カバレッジ詳細](./module-coverage/backend.md)
- [Frontend カバレッジ詳細](./module-coverage/frontend.md)

## カバレッジ履歴

カバレッジの推移については [カバレッジ履歴](./coverage-history.md) を参照してください。

## カバレッジ改善のベストプラクティス

### 1. 未カバーコードの特定

各モジュールで生成されるHTMLレポートを確認：

- Backend: `apps/backend/coverage/lcov-report/index.html`
- Frontend: `apps/frontend/coverage/lcov-report/index.html`

### 2. テスト追加の優先順位

1. **Critical Path**: ビジネスロジックの中核部分
2. **エッジケース**: エラーハンドリング、境界値テスト
3. **Integration**: モジュール間の連携テスト

### 3. カバレッジ向上のコツ

- **小さな単位でテスト**: 1つのテストで1つの動作を検証
- **モックの活用**: 外部依存を排除して単体テストを書きやすくする
- **E2Eテストとのバランス**: ユニットテストでカバーできない統合部分をE2Eで補完

## 使用方法

### カバレッジレポートの更新

```bash
# 最新のカバレッジレポートを生成
./scripts/test/generate-coverage-report.sh

# 履歴を更新（オプション）
./scripts/test/update-coverage-history.sh
```

### 個別モジュールのカバレッジ確認

```bash
# Backend ユニットテスト
cd apps/backend
pnpm test:cov

# Backend E2Eテスト
cd apps/backend
pnpm test:e2e:cov

# Frontend ユニットテスト
cd apps/frontend
pnpm test -- --coverage
```

## 参考資料

- [Jest Coverage Documentation](https://jestjs.io/docs/configuration#collectcoverage-boolean)
- [Codecov Configuration](../codecov.yml)
- [テスト設計ドキュメント](./test-design.md)
