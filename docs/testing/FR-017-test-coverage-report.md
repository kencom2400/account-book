# FR-017: 金融機関別集計機能 テストカバレッジレポート

**作成日**: 2025-01-27  
**対象機能**: FR-017: 金融機関別集計機能

## 概要

本レポートは、FR-017: 金融機関別集計機能の実装ファイルに対するテストカバレッジを示します。

## テストカバレッジ一覧

### 1. Domain Service

#### `InstitutionAggregationDomainService`

| 指標           | カバレッジ | 未カバー行 |
| -------------- | ---------- | ---------- |
| **Lines**      | **6.66%**  | 47-173     |
| **Statements** | **10.2%**  | -          |
| **Functions**  | **0%**     | -          |
| **Branches**   | **0%**     | -          |

**状態**: ❌ **テスト未実装**

**必要なテスト**:

- `aggregateByInstitution()` メソッドのテスト
- `aggregateByAccount()` メソッドのテスト
- `calculateInstitutionBalance()` メソッドのテスト
- `filterByInstitutionIds()` メソッドのテスト

---

### 2. Use Case

#### `CalculateInstitutionSummaryUseCase`

| 指標           | カバレッジ | 未カバー行 |
| -------------- | ---------- | ---------- |
| **Lines**      | **14.7%**  | 84-248     |
| **Statements** | **19.44%** | -          |
| **Functions**  | **0%**     | -          |
| **Branches**   | **23.07%** | -          |

**状態**: ❌ **テスト未実装**

**必要なテスト**:

- `execute()` メソッドのテスト（正常系）
  - 全金融機関を対象とする場合
  - 特定の金融機関IDを指定する場合
  - `includeTransactions=true` の場合
  - `includeTransactions=false` の場合
- `execute()` メソッドのテスト（異常系）
  - 取引データが存在しない場合
  - 金融機関が存在しない場合
- `buildInstitutionSummary()` メソッドのテスト
- `toTransactionDto()` メソッドのテスト

---

### 3. DTO

#### `GetInstitutionSummaryDto`

| 指標           | カバレッジ | 未カバー行 |
| -------------- | ---------- | ---------- |
| **Lines**      | **53.84%** | 20-29      |
| **Statements** | **60%**    | -          |
| **Functions**  | **0%**     | -          |
| **Branches**   | **0%**     | -          |

**状態**: ⚠️ **部分的なカバレッジ**

**必要なテスト**:

- カスタムバリデーター `IsEndDateAfterStartDateConstraint` のテスト
  - `startDate <= endDate` の場合（正常）
  - `startDate > endDate` の場合（エラー）
  - `startDate` または `endDate` が未指定の場合

---

### 4. Controller

#### `AggregationController` (transaction module)

| 指標           | カバレッジ | 未カバー行 |
| -------------- | ---------- | ---------- |
| **Lines**      | **90%**    | 78-85      |
| **Statements** | **90.9%**  | -          |
| **Functions**  | **75%**    | -          |
| **Branches**   | **71.05%** | -          |

**状態**: ⚠️ **部分的なカバレッジ**

**未カバー箇所**: `getInstitutionSummary()` メソッド（78-85行目）

**必要なテスト**:

- `getInstitutionSummary()` メソッドのテスト
  - 正常系: レスポンスが正しく返されること
  - 正常系: Use Caseが正しいパラメータで呼ばれること
  - 正常系: `includeTransactions` パラメータの処理

---

### 5. Repository

#### `IInstitutionRepository` / `InstitutionTypeOrmRepository` / `InstitutionRepository`

**状態**: ✅ **既存のテストでカバー済み**

- `findByIds()` メソッドは新規追加だが、既存のテストフレームワークでカバー可能

#### `ITransactionRepository` / `TransactionTypeOrmRepository` / `TransactionRepository`

**状態**: ⚠️ **部分的なカバレッジ**

- `findByInstitutionIdsAndDateRange()` メソッドは新規追加
- 既存のテストでカバーされていない可能性が高い

**必要なテスト**:

- `findByInstitutionIdsAndDateRange()` メソッドのテスト
  - 正常系: 指定された金融機関IDと期間で取引を取得できること
  - 正常系: 空の配列が渡された場合の処理
  - 正常系: 該当する取引が存在しない場合

---

## 全体サマリー

| ファイル                                        | Lines  | Statements | Functions | Branches | 状態      |
| ----------------------------------------------- | ------ | ---------- | --------- | -------- | --------- |
| `InstitutionAggregationDomainService`           | 6.66%  | 10.2%      | 0%        | 0%       | ❌ 未実装 |
| `CalculateInstitutionSummaryUseCase`            | 14.7%  | 19.44%     | 0%        | 23.07%   | ❌ 未実装 |
| `GetInstitutionSummaryDto`                      | 53.84% | 60%        | 0%        | 0%       | ⚠️ 部分   |
| `AggregationController` (getInstitutionSummary) | 90%    | 90.9%      | 75%       | 71.05%   | ⚠️ 部分   |
| Repository拡張                                  | -      | -          | -         | -        | ⚠️ 要確認 |

## 推奨事項

### 優先度: 高

1. **Domain Service のテスト実装**
   - `InstitutionAggregationDomainService` の全メソッドをテスト
   - カバレッジ目標: 80%以上

2. **Use Case のテスト実装**
   - `CalculateInstitutionSummaryUseCase` の全メソッドをテスト
   - 正常系・異常系の両方をカバー
   - カバレッジ目標: 80%以上

### 優先度: 中

3. **DTO のバリデーションテスト**
   - カスタムバリデーターのテストを追加
   - カバレッジ目標: 100%

4. **Controller のテスト追加**
   - `getInstitutionSummary()` メソッドのテストを追加
   - カバレッジ目標: 90%以上

### 優先度: 低

5. **Repository 拡張のテスト確認**
   - `findByInstitutionIdsAndDateRange()` のテストを確認・追加

## 次のステップ

1. Domain Service のテストファイルを作成
2. Use Case のテストファイルを作成
3. DTO のバリデーションテストを追加
4. Controller のテストを追加
5. Repository 拡張のテストを確認・追加

---

**注意**: 本レポートは実装時点でのカバレッジを示しています。テスト実装後は再測定が必要です。
