# テストカバレッジレポート

> **最終更新**: 2025-01-30 12:00:00  
> **コミット**: `51a2087`  
> **ブランチ**: `feature/issue-333-alert-implementation`

## 概要

このドキュメントは、各モジュールのテストカバレッジ状況をまとめたものです。

### カバレッジ目標

- **プロジェクト全体**: 80%以上
- **各モジュール**: 80%以上
- **新規コード**: 80%以上

## サマリー

| テスト種類      | Lines  | Statements | Functions | Branches |
| --------------- | ------ | ---------- | --------- | -------- |
| Backend (Unit)  | 74.50% | 74.82%     | 74.32%    | 63.83%   |
| Backend (E2E)   | 1.23%  | 1.23%      | 0.98%     | 2.00%    |
| Frontend (Unit) | 41.44% | 41.44%     | 38.49%    | 40.04%   |
| Frontend (E2E)  | N/A    | N/A        | N/A       | N/A      |

## Backend モジュール別詳細

### Unit Tests

| モジュール  | Lines  | Statements | Functions | Branches | 優先度 |
| ----------- | ------ | ---------- | --------- | -------- | ------ |
| alert       | 90.00% | 90.00%     | 95.00%    | 90.00%   | 🟢 Low |
| category    | 60.48% | 60.48%     | 61.18%    | 50.00%   | 🟢 Low |
| credit-card | 62.59% | 62.59%     | 45.96%    | 55.12%   | 🟢 Low |
| health      | 82.17% | 82.17%     | 85.71%    | 61.26%   | 🟢 Low |
| institution | 69.00% | 69.00%     | 50.00%    | 60.89%   | 🟢 Low |
| securities  | 86.07% | 86.07%     | 85.23%    | 69.64%   | 🟢 Low |
| sync        | 56.10% | 56.10%     | 48.28%    | 46.15%   | 🟢 Low |
| transaction | 67.91% | 67.91%     | 60.31%    | 66.67%   | 🟢 Low |

### E2E Tests

| モジュール  | Lines | Statements | Functions | Branches |
| ----------- | ----- | ---------- | --------- | -------- |
| alert       | 0%    | 0%         | 0%        | 0%       |
| category    | 0%    | 0%         | 0%        | 0%       |
| credit-card | 0%    | 0%         | 0%        | 0%       |
| health      | 0%    | 0%         | 0%        | 0%       |
| institution | 0%    | 0%         | 0%        | 0%       |
| securities  | 0%    | 0%         | 0%        | 0%       |
| sync        | 0%    | 0%         | 0%        | 0%       |
| transaction | 0%    | 0%         | 0%        | 0%       |

## Frontend モジュール別詳細

### Unit Tests

| モジュール | Lines  | Statements | Functions | Branches | 優先度    |
| ---------- | ------ | ---------- | --------- | -------- | --------- |
| app        | 0.00%  | 0.00%      | 0.00%     | 0.00%    | 🔴 High   |
| components | 56.86% | 56.86%     | 52.26%    | 50.00%   | 🟢 Low    |
| lib        | 18.46% | 18.46%     | 0.00%     | 5.26%    | 🔴 High   |
| stores     | 43.14% | 43.14%     | 47.62%    | 7.14%    | 🟡 Medium |
| utils      | 88.89% | 88.89%     | 100.00%   | 87.50%   | 🟢 Low    |

## 改善優先度

### 🔴 High Priority (カバレッジ < 30%)

**Backend:**

**Frontend:**

- app (Lines: 0.00%, Stmts: 0.00%, Funcs: 0.00%, Branches: 0.00%)
- lib (Lines: 18.46%, Stmts: 18.46%, Funcs: 0.00%, Branches: 5.26%)

### 🟡 Medium Priority (30% ≤ カバレッジ < 50%)

**Backend:**

**Frontend:**

- stores (Lines: 43.14%, Stmts: 43.14%, Funcs: 47.62%, Branches: 7.14%)

### 🟢 Low Priority (カバレッジ ≥ 50%)

**Backend:**

- alert (Lines: 90.00%, Stmts: 90.00%, Funcs: 95.00%, Branches: 90.00%)
- category (Lines: 60.48%, Stmts: 60.48%, Funcs: 61.18%, Branches: 50.00%)
- credit-card (Lines: 62.59%, Stmts: 62.59%, Funcs: 45.96%, Branches: 55.12%)
- health (Lines: 82.17%, Stmts: 82.17%, Funcs: 85.71%, Branches: 61.26%)
- institution (Lines: 69.00%, Stmts: 69.00%, Funcs: 50.00%, Branches: 60.89%)
- securities (Lines: 86.07%, Stmts: 86.07%, Funcs: 85.23%, Branches: 69.64%)
- sync (Lines: 56.10%, Stmts: 56.10%, Funcs: 48.28%, Branches: 46.15%)
- transaction (Lines: 67.91%, Stmts: 67.91%, Funcs: 60.31%, Branches: 66.67%)

**Frontend:**

- components (Lines: 56.86%, Stmts: 56.86%, Funcs: 52.26%, Branches: 50.00%)
- utils (Lines: 88.89%, Stmts: 88.89%, Funcs: 100.00%, Branches: 87.50%)

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
