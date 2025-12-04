# テストカバレッジレポート

> **最終更新**: 2025-12-04 15:33:45  
> **コミット**: `1e68385`  
> **ブランチ**: `feature/issue-114-financial-institution-settings-screen`

## 概要

このドキュメントは、各モジュールのテストカバレッジ状況をまとめたものです。

### カバレッジ目標

- **プロジェクト全体**: 80%以上
- **各モジュール**: 80%以上
- **新規コード**: 80%以上

## サマリー

| テスト種類      | Lines  | Statements | Functions | Branches |
| --------------- | ------ | ---------- | --------- | -------- |
| Backend (Unit)  | 79.20% | 79.37%     | 78.98%    | 67.56%   |
| Backend (E2E)   | 4.73%  | 4.73%      | 3.68%     | 9.60%    |
| Frontend (Unit) | 33.10% | 33.10%     | 34.75%    | 32.10%   |
| Frontend (E2E)  | N/A    | N/A        | N/A       | N/A      |

## Backend モジュール別詳細

### Unit Tests

| モジュール  | Lines  | Statements | Functions | Branches | 優先度 |
| ----------- | ------ | ---------- | --------- | -------- | ------ |
| category    | 78.57% | 78.57%     | 74.36%    | 72.67%   | 🟢 Low |
| credit-card | 88.18% | 88.18%     | 90.68%    | 69.31%   | 🟢 Low |
| health      | 82.17% | 82.17%     | 85.71%    | 61.26%   | 🟢 Low |
| institution | 67.38% | 67.38%     | 48.28%    | 60.22%   | 🟢 Low |
| securities  | 86.07% | 86.07%     | 85.23%    | 69.64%   | 🟢 Low |
| sync        | 60.60% | 60.60%     | 57.47%    | 50.00%   | 🟢 Low |
| transaction | 84.86% | 84.86%     | 80.67%    | 75.45%   | 🟢 Low |

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
| app        | 1.38%  | 1.38%      | 1.82%     | 0.00%    | 🔴 High   |
| components | 42.63% | 42.63%     | 42.98%    | 39.92%   | 🟡 Medium |
| lib        | 36.68% | 36.68%     | 31.03%    | 29.85%   | 🟡 Medium |
| stores     | 43.14% | 43.14%     | 47.62%    | 7.14%    | 🟡 Medium |
| utils      | 14.04% | 14.04%     | 12.50%    | 18.92%   | 🔴 High   |

## 改善優先度

### 🔴 High Priority (カバレッジ < 30%)

**Backend:**

**Frontend:**

- app (Lines: 1.38%, Stmts: 1.38%, Funcs: 1.82%, Branches: 0.00%)
- utils (Lines: 14.04%, Stmts: 14.04%, Funcs: 12.50%, Branches: 18.92%)

### 🟡 Medium Priority (30% ≤ カバレッジ < 50%)

**Backend:**

**Frontend:**

- components (Lines: 42.63%, Stmts: 42.63%, Funcs: 42.98%, Branches: 39.92%)
- lib (Lines: 36.68%, Stmts: 36.68%, Funcs: 31.03%, Branches: 29.85%)
- stores (Lines: 43.14%, Stmts: 43.14%, Funcs: 47.62%, Branches: 7.14%)

### 🟢 Low Priority (カバレッジ ≥ 50%)

**Backend:**

- category (Lines: 78.57%, Stmts: 78.57%, Funcs: 74.36%, Branches: 72.67%)
- credit-card (Lines: 88.18%, Stmts: 88.18%, Funcs: 90.68%, Branches: 69.31%)
- health (Lines: 82.17%, Stmts: 82.17%, Funcs: 85.71%, Branches: 61.26%)
- institution (Lines: 67.38%, Stmts: 67.38%, Funcs: 48.28%, Branches: 60.22%)
- securities (Lines: 86.07%, Stmts: 86.07%, Funcs: 85.23%, Branches: 69.64%)
- sync (Lines: 60.60%, Stmts: 60.60%, Funcs: 57.47%, Branches: 50.00%)
- transaction (Lines: 84.86%, Stmts: 84.86%, Funcs: 80.67%, Branches: 75.45%)

**Frontend:**

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
