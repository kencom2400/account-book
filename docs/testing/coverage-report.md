# テストカバレッジレポート

> **最終更新**: 2025-11-26 10:23:29  
> **コミット**: `c1380db`  
> **ブランチ**: `feature/issue-307-module-coverage-reports`

## 概要

このドキュメントは、各モジュールのテストカバレッジ状況をまとめたものです。

### カバレッジ目標

- **プロジェクト全体**: 80%以上
- **各モジュール**: 80%以上
- **新規コード**: 80%以上

## サマリー

| テスト種類      | Lines  | Statements | Functions | Branches |
| --------------- | ------ | ---------- | --------- | -------- |
| Backend (Unit)  | 35.89% | 35.89%     | 32.00%    | 33.02%   |
| Backend (E2E)   | 1.23%  | 1.23%      | 0.98%     | 2.00%    |
| Frontend (Unit) | 47.92% | 47.92%     | 46.23%    | 46.61%   |
| Frontend (E2E)  | N/A    | N/A        | N/A       | N/A      |

## Backend モジュール別詳細

### Unit Tests

| モジュール  | Lines  | Statements | Functions | Branches | 優先度    |
| ----------- | ------ | ---------- | --------- | -------- | --------- |
| category    | 52.76% | 52.76%     | 49.69%    | 47.98%   | 🟢 Low    |
| credit-card | 47.71% | 47.71%     | 39.13%    | 51.64%   | 🟡 Medium |
| health      | 28.50% | 28.50%     | 32.77%    | 19.67%   | 🔴 High   |
| institution | 34.28% | 34.28%     | 27.68%    | 21.70%   | 🟡 Medium |
| securities  | 22.27% | 22.27%     | 19.89%    | 24.56%   | 🔴 High   |
| sync        | 47.47% | 47.47%     | 44.83%    | 38.30%   | 🟡 Medium |
| transaction | 30.39% | 30.39%     | 16.03%    | 29.41%   | 🟡 Medium |

### E2E Tests

| モジュール  | Lines | Statements | Functions | Branches |
| ----------- | ----- | ---------- | --------- | -------- |
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
| components | 63.04% | 63.04%     | 59.56%    | 55.96%   | 🟢 Low    |
| lib        | 16.96% | 16.96%     | 0.00%     | 5.71%    | 🔴 High   |
| stores     | 43.14% | 43.14%     | 47.62%    | 7.14%    | 🟡 Medium |
| utils      | 88.89% | 88.89%     | 100.00%   | 87.50%   | 🟢 Low    |

## 改善優先度

### 🔴 High Priority (カバレッジ < 30%)

**Backend:**

- health (Lines: 28.50%, Stmts: 28.50%, Funcs: 32.77%, Branches: 19.67%)
- securities (Lines: 22.27%, Stmts: 22.27%, Funcs: 19.89%, Branches: 24.56%)

**Frontend:**

- app (Lines: 0.00%, Stmts: 0.00%, Funcs: 0.00%, Branches: 0.00%)
- lib (Lines: 16.96%, Stmts: 16.96%, Funcs: 0.00%, Branches: 5.71%)

### 🟡 Medium Priority (30% ≤ カバレッジ < 50%)

**Backend:**

- credit-card (Lines: 47.71%, Stmts: 47.71%, Funcs: 39.13%, Branches: 51.64%)
- institution (Lines: 34.28%, Stmts: 34.28%, Funcs: 27.68%, Branches: 21.70%)
- sync (Lines: 47.47%, Stmts: 47.47%, Funcs: 44.83%, Branches: 38.30%)
- transaction (Lines: 30.39%, Stmts: 30.39%, Funcs: 16.03%, Branches: 29.41%)

**Frontend:**

- stores (Lines: 43.14%, Stmts: 43.14%, Funcs: 47.62%, Branches: 7.14%)

### 🟢 Low Priority (カバレッジ ≥ 50%)

**Backend:**

- category (Lines: 52.76%, Stmts: 52.76%, Funcs: 49.69%, Branches: 47.98%)

**Frontend:**

- components (Lines: 63.04%, Stmts: 63.04%, Funcs: 59.56%, Branches: 55.96%)
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
