# テストカバレッジレポート

> **最終更新**: 2025-12-06 23:33:12  
> **コミット**: `e6ff0d5`  
> **ブランチ**: `feature/issue-374-feature-fr-024`

## 概要

このドキュメントは、各モジュールのテストカバレッジ状況をまとめたものです。

### カバレッジ目標

- **プロジェクト全体**: 80%以上
- **各モジュール**: 80%以上
- **新規コード**: 80%以上

## サマリー

| テスト種類      | Lines  | Statements | Functions | Branches |
| --------------- | ------ | ---------- | --------- | -------- |
| Backend (Unit)  | 77.45% | 72.79%     | 75.66%    | 61.59%   |
| Backend (E2E)   | 0.96%  | 0.96%      | 0.71%     | 1.92%    |
| Frontend (Unit) | 39.15% | 39.15%     | 39.76%    | 33.42%   |
| Frontend (E2E)  | N/A    | N/A        | N/A       | N/A      |

## Backend モジュール別詳細

### Unit Tests

| モジュール  | Lines  | Statements | Functions | Branches | 優先度 |
| ----------- | ------ | ---------- | --------- | -------- | ------ |
| category    | 79.44% | 79.44%     | 74.36%    | 74.85%   | 🟢 Low |
| credit-card | 88.18% | 88.18%     | 90.68%    | 69.31%   | 🟢 Low |
| health      | 82.40% | 82.40%     | 85.71%    | 62.04%   | 🟢 Low |
| institution | 68.63% | 68.63%     | 48.46%    | 61.20%   | 🟢 Low |
| securities  | 86.07% | 86.07%     | 85.23%    | 69.64%   | 🟢 Low |
| sync        | 60.60% | 60.60%     | 57.47%    | 50.00%   | 🟢 Low |
| transaction | 84.44% | 84.44%     | 80.49%    | 74.73%   | 🟢 Low |

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
| app        | 14.40% | 14.40%     | 13.70%    | 5.34%    | 🔴 High   |
| components | 49.47% | 49.47%     | 48.08%    | 43.15%   | 🟡 Medium |
| lib        | 38.52% | 38.52%     | 34.92%    | 29.58%   | 🟡 Medium |
| stores     | 43.14% | 43.14%     | 47.62%    | 7.14%    | 🟡 Medium |
| utils      | 19.30% | 19.30%     | 25.00%    | 21.62%   | 🔴 High   |

## 改善優先度

### 🔴 High Priority (カバレッジ < 30%)

**Backend:**

**Frontend:**

- app (Lines: 14.40%, Stmts: 14.40%, Funcs: 13.70%, Branches: 5.34%)
- utils (Lines: 19.30%, Stmts: 19.30%, Funcs: 25.00%, Branches: 21.62%)

### 🟡 Medium Priority (30% ≤ カバレッジ < 50%)

**Backend:**

**Frontend:**

- components (Lines: 49.47%, Stmts: 49.47%, Funcs: 48.08%, Branches: 43.15%)
- lib (Lines: 38.52%, Stmts: 38.52%, Funcs: 34.92%, Branches: 29.58%)
- stores (Lines: 43.14%, Stmts: 43.14%, Funcs: 47.62%, Branches: 7.14%)

### 🟢 Low Priority (カバレッジ ≥ 50%)

**Backend:**

- category (Lines: 79.44%, Stmts: 79.44%, Funcs: 74.36%, Branches: 74.85%)
- credit-card (Lines: 88.18%, Stmts: 88.18%, Funcs: 90.68%, Branches: 69.31%)
- health (Lines: 82.40%, Stmts: 82.40%, Funcs: 85.71%, Branches: 62.04%)
- institution (Lines: 68.63%, Stmts: 68.63%, Funcs: 48.46%, Branches: 61.20%)
- securities (Lines: 86.07%, Stmts: 86.07%, Funcs: 85.23%, Branches: 69.64%)
- sync (Lines: 60.60%, Stmts: 60.60%, Funcs: 57.47%, Branches: 50.00%)
- transaction (Lines: 84.44%, Stmts: 84.44%, Funcs: 80.49%, Branches: 74.73%)

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
