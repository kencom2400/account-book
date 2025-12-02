# Issue #113 実施計画書

**Issue**: #113 - [TASK] E-7: クレジットカード管理画面の実装  
**PR**: #304 - feat(frontend): クレジットカード管理画面の基本構造を実装  
**作成日**: 2025-01-27  
**ステータス**: In Progress

---

## 📊 現在の状況

### ✅ 実装完了

1. **型定義の追加**
   - `libs/types/src/credit-card.types.ts` - クレジットカード関連の型定義
   - CreditCard, CreditCardTransaction, Payment, MonthlyCardSummary, ReconciliationResult, Alert などの型を定義

2. **APIクライアント関数の実装**
   - `apps/frontend/src/lib/api/credit-cards.ts` - 7つのAPI関数を実装
   - `connectCreditCard()`, `getCreditCards()`, `getCreditCard()`, `getCreditCardTransactions()`, `getPaymentInfo()`, `deleteCreditCard()`, `refreshCreditCardData()`

3. **基本画面構造の実装**
   - `apps/frontend/src/app/credit-cards/page.tsx` - ページコンポーネント
   - `apps/frontend/src/components/credit-cards/CreditCardManagementPage.tsx` - 管理画面コンポーネント
   - カード一覧表示、ローディング状態、エラーハンドリング、空状態の表示

### ✅ 実装完了機能（mainブランチにマージ済み）

以下の機能は、既にmainブランチにマージされています：

- **FR-012**: クレジットカード月別集計機能（PR #325、2025-11-30マージ）
- **FR-013**: 銀行引落額との自動照合機能（PR #329マージ）
- **FR-014**: 支払いステータス管理機能（PR #331、2025-12-01マージ）
- **FR-015**: 不一致時のアラート表示機能（PR #332、2025-12-01マージ）

**バックエンド実装状況:**

- `apps/backend/src/modules/aggregation/` - 月別集計モジュール
- `apps/backend/src/modules/reconciliation/` - 照合モジュール
- `apps/backend/src/modules/payment-status/` - ステータス管理モジュール
- `apps/backend/src/modules/alert/` - アラートモジュール

**フロントエンド実装状況:**

- `apps/frontend/src/app/alerts/` - アラート画面（実装済み）
- クレジットカード管理画面への統合は未実装

### 🔍 バックエンド実装状況

**実装済み:**

- クレジットカードの基本CRUD（接続、取得、削除）
- 取引履歴取得（`GET /api/credit-cards/:id/transactions`）
- 支払い情報取得（`GET /api/credit-cards/:id/payment-info`）- FR-012の一部に相当
- データ再同期（`POST /api/credit-cards/:id/refresh`）

**未実装:**

- FR-012: 月別集計の詳細機能（カテゴリ別内訳、複数月集計API）
- FR-013: 銀行引落額との自動照合機能（バックエンドAPI）
- FR-014: 支払いステータス管理機能（ステータス更新、履歴管理API）
- FR-015: 不一致時のアラート表示機能（アラート生成・管理API）

---

## 🎯 実施計画（更新版）

### Phase 1: PR #304のレビュー対応（優先度: 最高）

**目的**: 既存PRのレビューがあれば対応し、マージ可能な状態にする

**タスク:**

1. [x] PR #304のレビューコメントを確認（レビューなしを確認）
2. [x] mainブランチから最新の変更をマージ（FR-012〜015の実装を含む）

**見積時間**: 完了

---

### Phase 2: フロントエンド統合（優先度: 高）

**目的**: 既に実装済みのバックエンドAPI（FR-012〜015）をフロントエンドのクレジットカード管理画面に統合する

**実装内容:**

1. [ ] 月別集計機能のUI実装
   - APIクライアント関数の追加（`getMonthlySummary()`など）
   - 月別集計コンポーネントの作成
   - `CreditCardManagementPage`への統合
2. [ ] 照合機能のUI実装
   - APIクライアント関数の追加（`reconcilePayment()`など）
   - 照合結果コンポーネントの作成
   - `CreditCardManagementPage`への統合
3. [ ] ステータス管理機能のUI実装
   - APIクライアント関数の追加（`updatePaymentStatus()`など）
   - ステータス管理コンポーネントの作成
   - `CreditCardManagementPage`への統合
4. [ ] アラート表示機能のUI実装
   - 既存のアラート画面（`apps/frontend/src/app/alerts/`）を活用
   - クレジットカード管理画面へのアラートバッジ統合

**見積時間**: 12〜16時間

---

### Phase 2（旧）: FR-012 クレジットカード月別集計機能の実装（優先度: 高）【完了済み】

**目的**: クレジットカードの利用明細を月別に集計し、支払い予定額を算出する機能を実装

#### 2.1 バックエンド実装

**必要なAPIエンドポイント:**

- `GET /api/credit-cards/:id/monthly-summary` - 月別集計情報を取得
  - クエリパラメータ: `billingMonth` (YYYY-MM), `startMonth`, `endMonth` (複数月対応)

**実装内容:**

1. [ ] `CalculateMonthlySummaryUseCase` を作成
   - 締め日に基づく請求月の判定ロジック
   - カテゴリ別内訳の集計
   - ポイント利用・割引の適用
   - 最終支払額の算出
2. [ ] `MonthlySummaryDto` を作成
3. [ ] `CreditCardController` にエンドポイントを追加
4. [ ] ユニットテストを実装

**参照資料:**

- `docs/functional-requirements/FR-012-015_credit-card-management.md` (FR-012セクション)
- 既存の `FetchPaymentInfoUseCase` を参考にする

**見積時間**: 4〜6時間

#### 2.2 フロントエンド実装

**実装内容:**

1. [ ] APIクライアント関数を追加
   - `getMonthlySummary()` - 月別集計情報を取得
2. [ ] 月別集計コンポーネントを作成
   - `MonthlySummaryCard.tsx` - 月別集計カード
   - `CategoryBreakdownChart.tsx` - カテゴリ別内訳のグラフ表示
   - `MonthlySummaryList.tsx` - 複数月の一覧表示
3. [ ] `CreditCardManagementPage` に月別集計セクションを追加
4. [ ] 月選択UI（カレンダー形式）を実装
5. [ ] エラーハンドリングとローディング状態の管理

**見積時間**: 6〜8時間

---

### Phase 3: FR-013 銀行引落額との自動照合機能の実装（優先度: 高）

**目的**: クレジットカードの月別集計額と、銀行口座からの実際の引落額を自動的に照合

#### 3.1 バックエンド実装

**必要なAPIエンドポイント:**

- `POST /api/credit-cards/:id/reconcile` - 照合処理を実行
- `GET /api/credit-cards/:id/reconciliation-reports` - 照合レポート一覧を取得
- `GET /api/credit-cards/:id/reconciliation-reports/:reportId` - 照合レポート詳細を取得

**実装内容:**

1. [ ] `ReconcilePaymentUseCase` を作成
   - 金額・日付・摘要でのマッチングロジック
   - 信頼度スコアの算出
   - 不一致の分析
2. [ ] `ReconciliationReport` エンティティを作成
3. [ ] `ReconciliationRepository` を作成
4. [ ] `CreditCardController` にエンドポイントを追加
5. [ ] ユニットテストを実装

**注意事項:**

- 銀行取引データの取得は、FR-001（銀行口座連携）の実装状況に依存
- 現時点では、モックデータまたは既存の取引データを使用して実装

**見積時間**: 6〜8時間

#### 3.2 フロントエンド実装

**実装内容:**

1. [ ] APIクライアント関数を追加
   - `reconcilePayment()` - 照合処理を実行
   - `getReconciliationReports()` - 照合レポート一覧を取得
   - `getReconciliationReport()` - 照合レポート詳細を取得
2. [ ] 照合結果コンポーネントを作成
   - `ReconciliationResultCard.tsx` - 照合結果カード
   - `ReconciliationReportList.tsx` - 照合レポート一覧
   - `ReconciliationDetailModal.tsx` - 照合詳細モーダル
3. [ ] 手動マッチング機能を実装
4. [ ] `CreditCardManagementPage` に照合セクションを追加

**見積時間**: 6〜8時間

---

### Phase 4: FR-014 支払いステータス管理機能の実装（優先度: 高）

**目的**: クレジットカードの各請求月について、支払いステータスを管理

#### 4.1 バックエンド実装

**必要なAPIエンドポイント:**

- `PATCH /api/credit-cards/:id/payment-status` - ステータスを更新
- `GET /api/credit-cards/:id/payment-status-history` - ステータス変更履歴を取得

**実装内容:**

1. [ ] `UpdatePaymentStatusUseCase` を作成
   - ステータス遷移の妥当性チェック
   - 変更履歴の記録
2. [ ] `PaymentStatusHistory` エンティティを作成
3. [ ] `PaymentStatusRepository` を作成
4. [ ] `CreditCardController` にエンドポイントを追加
5. [ ] ユニットテストを実装

**注意事項:**

- 既存の `PaymentVO` にステータス管理機能を追加するか、別エンティティとして管理するか検討が必要

**見積時間**: 4〜6時間

#### 4.2 フロントエンド実装

**実装内容:**

1. [ ] APIクライアント関数を追加
   - `updatePaymentStatus()` - ステータスを更新
   - `getPaymentStatusHistory()` - ステータス変更履歴を取得
2. [ ] ステータス管理コンポーネントを作成
   - `PaymentStatusBadge.tsx` - ステータスバッジ
   - `PaymentStatusSelector.tsx` - ステータス選択UI
   - `PaymentStatusHistoryList.tsx` - ステータス変更履歴一覧
3. [ ] `CreditCardManagementPage` にステータス管理セクションを追加
4. [ ] ステータス別フィルタ機能を実装

**見積時間**: 4〜6時間

---

### Phase 5: FR-015 不一致時のアラート表示機能の実装（優先度: 中）

**目的**: 照合不一致が検出された場合、ユーザーに分かりやすくアラートを表示

#### 5.1 バックエンド実装

**必要なAPIエンドポイント:**

- `GET /api/alerts` - アラート一覧を取得
- `GET /api/alerts/:id` - アラート詳細を取得
- `PATCH /api/alerts/:id/read` - アラートを既読にする
- `PATCH /api/alerts/:id/resolve` - アラートを解決済みにする

**実装内容:**

1. [ ] `Alert` エンティティを作成（既存のAlertモジュールを確認）
2. [ ] `GenerateAlertUseCase` を作成
   - 照合結果からアラートを生成
   - アラートレベルの判定
3. [ ] `AlertController` を作成（既存のAlertControllerを確認）
4. [ ] ユニットテストを実装

**注意事項:**

- Issue #36でAlertモジュールが実装されている可能性があるため、既存実装を確認する

**見積時間**: 4〜6時間

#### 5.2 フロントエンド実装

**実装内容:**

1. [ ] APIクライアント関数を追加
   - `getAlerts()` - アラート一覧を取得
   - `getAlert()` - アラート詳細を取得
   - `markAlertAsRead()` - アラートを既読にする
   - `resolveAlert()` - アラートを解決済みにする
2. [ ] アラートコンポーネントを作成
   - `AlertCard.tsx` - アラートカード
   - `AlertList.tsx` - アラート一覧
   - `AlertDetailModal.tsx` - アラート詳細モーダル
   - `AlertBadge.tsx` - ヘッダー用アラートバッジ
3. [ ] アラートポップアップ機能を実装
4. [ ] `CreditCardManagementPage` にアラートセクションを追加
5. [ ] アラートレベル別フィルタ機能を実装

**見積時間**: 6〜8時間

---

### Phase 6: テスト実装（優先度: 高）

**目的**: 実装した機能の品質を確保するため、テストを実装

#### 6.1 ユニットテスト

**実装内容:**

1. [ ] フロントエンドコンポーネントのテスト
   - `CreditCardManagementPage.test.tsx`
   - `MonthlySummaryCard.test.tsx`
   - `ReconciliationResultCard.test.tsx`
   - `PaymentStatusBadge.test.tsx`
   - `AlertCard.test.tsx`
2. [ ] APIクライアント関数のテスト
   - `credit-cards.test.ts`
3. [ ] カバレッジ80%以上を目標

**見積時間**: 6〜8時間

#### 6.2 E2Eテスト

**実装内容:**

1. [ ] クレジットカード管理画面のE2Eテスト
   - カード一覧表示
   - 月別集計表示
   - 照合結果表示
   - ステータス更新
   - アラート表示
2. [ ] Playwrightを使用して実装

**見積時間**: 4〜6時間

---

### Phase 7: 最終チェックとPR更新（優先度: 最高）

**目的**: すべての実装が完了したら、品質チェックを実施してPRを更新

**タスク:**

1. [ ] push前チェックを実行
   ```bash
   ./scripts/test/lint.sh
   pnpm build
   ./scripts/test/test.sh all
   ./scripts/test/test-e2e.sh frontend
   ```
2. [ ] すべてのテストがパスすることを確認
3. [ ] PR #304を更新（または新しいPRを作成）
4. [ ] PR説明を更新
5. [ ] Issue #113に進捗を報告

**見積時間**: 1〜2時間

---

## 📅 実装順序の推奨

1. **Phase 1**: PR #304のレビュー対応（最優先）
2. **Phase 2**: FR-012 月別集計機能（他の機能の基盤となるため優先）
3. **Phase 3**: FR-013 照合機能（FR-012に依存）
4. **Phase 4**: FR-014 ステータス管理（FR-013に依存）
5. **Phase 5**: FR-015 アラート表示（FR-013, FR-014に依存）
6. **Phase 6**: テスト実装（各機能実装後に随時実施）
7. **Phase 7**: 最終チェックとPR更新

---

## ⚠️ 注意事項

### 依存関係

- **FR-013（照合機能）**: FR-001（銀行口座連携）の実装状況に依存する可能性がある
- **FR-015（アラート）**: Issue #36でAlertモジュールが実装されている可能性があるため、既存実装を確認する

### 技術的考慮事項

1. **型安全性**: `any`型の使用は禁止（テストのJestモック作成時のみ例外）
2. **Onion Architecture**: Domain層のエンティティはPresentation層のDTO型に依存してはならない
3. **エラーハンドリング**: 適切なエラーメッセージとユーザーフィードバックを実装
4. **パフォーマンス**: 大量データの処理時は、ページネーションや仮想スクロールを検討

### 実装時の参照資料

- `docs/functional-requirements/FR-012-015_credit-card-management.md` - 機能要件書
- `docs/detailed-design/FR-012_credit-card-monthly-aggregation/` - 詳細設計書（存在する場合）
- `docs/detailed-design/FR-013_bank-withdrawal-reconciliation/` - 詳細設計書（存在する場合）
- `docs/detailed-design/FR-014_payment-status-management/` - 詳細設計書（存在する場合）
- `docs/detailed-design/FR-015_inconsistency-alert/` - 詳細設計書（存在する場合）

---

## 📊 見積時間の合計

| Phase                   | 見積時間         |
| ----------------------- | ---------------- |
| Phase 1: PRレビュー対応 | 0.5〜2時間       |
| Phase 2: FR-012実装     | 10〜14時間       |
| Phase 3: FR-013実装     | 12〜16時間       |
| Phase 4: FR-014実装     | 8〜12時間        |
| Phase 5: FR-015実装     | 10〜14時間       |
| Phase 6: テスト実装     | 10〜14時間       |
| Phase 7: 最終チェック   | 1〜2時間         |
| **合計**                | **52.5〜74時間** |

**注意**: 見積時間は実装者の経験や既存コードの理解度によって変動します。

---

## 🔗 関連リンク

- **Issue**: #113
- **PR**: #304
- **Epic**: #190 (Frontend実装), #184 (クレジットカード管理)
- **機能要件書**: `docs/functional-requirements/FR-012-015_credit-card-management.md`

---

**更新履歴:**

- 2025-01-27: 初版作成
