#!/bin/bash

# GitHub Issues Batch Creation Script
# 機能要件に基づいてIssueを一括作成します

set -e

echo "📋 GitHub Issuesの一括作成を開始します..."

# GitHub CLIの確認
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLIがインストールされていません"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLIの認証が必要です"
    exit 1
fi

echo "✅ GitHub CLI認証済み"

# 確認
read -p "⚠️  複数のIssueを作成します。続行しますか？ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "キャンセルしました"
    exit 0
fi

CREATED_COUNT=0

echo ""
echo "🚀 Issueの作成を開始します..."
echo ""

# ================================================
# A-1. 開発環境セットアップ
# ================================================

echo "📦 [A-1] 開発環境セットアップ"

gh issue create \
  --title "[TASK] Git Hooks設定 (Husky + lint-staged)" \
  --label "task,infrastructure,priority: high,size: S" \
  --body "## タスク概要
Husky と lint-staged を使用したGit Hooksの設定を行います。

## 目的・背景
コードの品質を保つため、コミット前に自動的にリントとフォーマットを実行する仕組みを整備します。

## タスク種別
- [x] ⚙️ 設定・環境構築

## 作業内容
- [ ] Huskyのインストールと初期化
- [ ] lint-staged の設定
- [ ] pre-commit フックの実装
- [ ] pre-push フックの実装
- [ ] ドキュメント更新

## 対象ファイル・モジュール
- .husky/
- package.json

## 参考資料
- [開発環境構築タスク](../docs/development-setup-tasks.md#23-git-hooks設定)

## スケジュール
- 見積もり工数: 0.5日
" || echo "  ⚠️  作成失敗またはスキップ"

((CREATED_COUNT++))

gh issue create \
  --title "[TASK] データディレクトリとシーディング機能の整備" \
  --label "task,infrastructure,priority: high,size: S" \
  --body "## タスク概要
初期データのシーディング機能と、データディレクトリの整備を行います。

## 目的・背景
開発・テスト時に使用する初期データを簡単にセットアップできるようにします。

## タスク種別
- [x] ⚙️ 設定・環境構築
- [x] 📚 ドキュメント作成・更新

## 作業内容
- [ ] 初期カテゴリデータの整備
- [ ] テストデータのシーディングスクリプト作成
- [ ] データバリデーション機能の実装
- [ ] README更新

## 対象ファイル・モジュール
- data/categories/
- scripts/seed-test-data.sh
- scripts/init-categories.sh

## 参考資料
- [開発環境構築タスク](../docs/development-setup-tasks.md#82-データシーディング)

## スケジュール
- 見積もり工数: 0.5日
" || echo "  ⚠️  作成失敗またはスキップ"

((CREATED_COUNT++))

# ================================================
# B-1. データ取得機能 (FR-001～FR-007)
# ================================================

echo ""
echo "🔌 [B-1] データ取得機能 (FR-001～FR-007)"

gh issue create \
  --title "[FEATURE] FR-001: 銀行口座との連携機能" \
  --label "feature,integration,bank,backend,priority: high,size: L" \
  --body "## 機能概要
銀行APIとの連携機能を実装し、銀行口座の取引履歴を自動取得できるようにします。

## 目的・背景
ユーザーが銀行の取引履歴を手動で入力する手間を削減し、自動的にデータを同期できるようにします。

## 機能要件ID
- 機能要件: FR-001
- 参照ドキュメント: [FR-001-007_data-acquisition.md](../docs/functional-requirements/FR-001-007_data-acquisition.md)

## ユーザーストーリー
**As a** 資産管理アプリのユーザー  
**I want** 銀行口座を連携して取引履歴を自動取得したい  
**So that** 手動入力の手間を省き、最新の残高と取引を確認できる

## 機能詳細

### 主要機能
1. 銀行API認証機能
2. 口座情報の取得
3. 取引履歴の取得
4. 残高情報の取得

### APIエンドポイント
| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| POST | /api/institutions | 金融機関の登録 |
| POST | /api/institutions/:id/connect | 銀行APIへの接続 |
| GET | /api/institutions/:id/transactions | 取引履歴の取得 |

## 設計方針

### オニオンアーキテクチャの層
- [x] Domain層（BankAccount エンティティ）
- [x] Application層（ConnectBankUseCase）
- [x] Infrastructure層（BankApiClient）
- [x] Presentation層（InstitutionController）

## 受入基準
- [ ] ユーザーが銀行を選択して接続設定ができる
- [ ] 認証情報が暗号化されて保存される
- [ ] 接続テストが成功する
- [ ] 取引履歴が正常に取得できる
- [ ] エラーハンドリングが適切に実装されている

## 実装タスク

### Phase 1: 設計・準備
- [ ] 銀行API仕様の調査
- [ ] データモデルの定義
- [ ] 暗号化方式の決定

### Phase 2: Backend実装
- [ ] BankAccount エンティティの作成
- [ ] BankApiClient の実装
- [ ] ConnectBankUseCase の実装
- [ ] 認証情報の暗号化実装
- [ ] 単体テストの作成

### Phase 3: Frontend実装
- [ ] 銀行連携設定画面の作成
- [ ] 接続テストUIの実装
- [ ] エラー表示の実装

### Phase 4: テスト
- [ ] 統合テストの実施
- [ ] E2Eテストの実施

## 関連情報
- Blocked by: #(暗号化機能のIssue)
- Related to: FR-002, FR-003

## スケジュール
- 見積もり工数: 5人日
" || echo "  ⚠️  作成失敗またはスキップ"

((CREATED_COUNT++))

# ================================================
# B-3. クレジットカード管理機能 (FR-012～FR-015)
# ================================================

echo ""
echo "💳 [B-3] クレジットカード管理機能 (FR-012～FR-015)"

gh issue create \
  --title "[FEATURE] FR-013: 銀行引落額との自動照合機能" \
  --label "feature,credit-card,reconciliation,backend,priority: high,size: L" \
  --body "## 機能概要
クレジットカードの月次利用額と銀行からの引落額を自動的に照合し、不一致があればアラートを表示する機能を実装します。

## 目的・背景
クレジットカードの不正利用や請求ミスを早期に発見できるようにし、資産管理の正確性を向上させます。

## 機能要件ID
- 機能要件: FR-013
- 参照ドキュメント: [FR-012-015_credit-card-management.md](../docs/functional-requirements/FR-012-015_credit-card-management.md)

## ユーザーストーリー
**As a** クレジットカードを利用するユーザー  
**I want** カード利用額と銀行引落額を自動照合したい  
**So that** 不一致をすぐに発見し、正確な収支管理ができる

## 機能詳細

### 主要機能
1. 月次カード利用額の集計
2. 銀行引落額の抽出
3. 金額の自動照合
4. 不一致の検出とアラート

### ビジネスロジック
1. 対象月のクレジットカード取引を全て集計
2. 同じカードIDの銀行引落取引を検索
3. 金額を比較（±100円の許容範囲）
4. 一致: status を \"reconciled\" に更新
5. 不一致: アラートを生成

## 設計方針

### オニオンアーキテクチャの層
- [x] Domain層（ReconciliationService）
- [x] Application層（ReconcileCreditCardUseCase）
- [x] Infrastructure層（TransactionRepository）
- [x] Presentation層（CreditCardController）

## 受入基準
- [ ] 月次で自動照合が実行される
- [ ] 一致した場合、ステータスが更新される
- [ ] 不一致の場合、アラートが表示される
- [ ] 差額が明確に表示される
- [ ] 手動で照合を再実行できる

## テスト方針

### テストケース

#### 単体テスト
- [ ] 照合ロジックのテスト（一致・不一致）
- [ ] 複数カードの処理テスト
- [ ] エッジケース（データなし、複数引落など）

#### E2Eテスト
- [ ] 自動照合の実行
- [ ] 不一致時のアラート表示
- [ ] 手動照合の実行

## 実装タスク

### Phase 1: Backend実装
- [ ] ReconciliationService の実装
- [ ] ReconcileCreditCardUseCase の実装
- [ ] スケジューラーの設定
- [ ] 単体テストの作成

### Phase 2: Frontend実装
- [ ] 照合状態の表示
- [ ] 不一致アラートの表示
- [ ] 手動照合ボタンの実装

### Phase 3: テスト
- [ ] 統合テスト
- [ ] E2Eテスト

## 関連情報
- Depends on: FR-012 (月別集計)
- Related to: FR-014, FR-015

## スケジュール
- 見積もり工数: 4人日
" || echo "  ⚠️  作成失敗またはスキップ"

((CREATED_COUNT++))

# ================================================
# E-1. ダッシュボード
# ================================================

echo ""
echo "📊 [E-1] ダッシュボード"

gh issue create \
  --title "[UI] ダッシュボード画面の完成" \
  --label "enhancement,frontend,visualization,priority: medium,size: M" \
  --body "## タスク概要
ダッシュボード画面の完成度を高め、ユーザーが一目で資産状況を把握できるようにします。

## 目的・背景
現在のダッシュボードをより使いやすく、情報量を充実させることで、ユーザー体験を向上させます。

## タスク種別
- [x] 🎨 UI/UX改善

## 作業内容
- [ ] 収支サマリーカードの改善
- [ ] 最近の取引リスト表示
- [ ] 資産残高の表示
- [ ] クイックアクションボタンの追加
- [ ] レスポンシブ対応の強化

## 対象ファイル・モジュール

### Frontend
- src/app/dashboard/page.tsx
- src/components/dashboard/
- src/components/charts/

## UIコンポーネント
- [ ] サマリーカード（収入・支出・収支）
- [ ] 最近の取引カード
- [ ] 資産残高カード
- [ ] クイックアクションボタン

## デザイン要件
- [ ] レスポンシブデザイン対応
- [ ] ダークモード対応（将来）
- [ ] ローディング状態の表示
- [ ] エラー状態の表示

## 検証方法
- [ ] デスクトップ表示の確認
- [ ] モバイル表示の確認
- [ ] データがない場合の表示確認
- [ ] ローディング状態の確認

## スケジュール
- 見積もり工数: 2日
" || echo "  ⚠️  作成失敗またはスキップ"

((CREATED_COUNT++))

echo ""
echo "✅ Issue作成完了！"
echo "📊 作成したIssue数: $CREATED_COUNT"
echo ""
echo "💡 作成したIssueを確認:"
echo "   gh issue list"
echo ""
echo "💡 WebでIssueを確認:"
echo "   gh browse --issues"

