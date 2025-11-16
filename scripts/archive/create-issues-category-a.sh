#!/bin/bash

# GitHub Issue一括作成スクリプト（カテゴリA: 環境構築・インフラ）

set -e

REPO="kencom2400/account-book"
echo "════════════════════════════════════════════════════════════════"
echo "   📋 カテゴリA: 環境構築・インフラ Issue作成"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Issue A-1
echo "[1/10] A-1: Monorepo環境の最終確認と整備"
gh issue create \
  --repo "$REPO" \
  --title "[TASK] A-1: Monorepo環境の最終確認と整備" \
  --label "task,infrastructure,priority: high,size: M" \
  --milestone "Phase 0: 基盤構築" \
  --body "## 概要
pnpm workspaceとTurboによるmonorepo環境の最終確認と整備

## 作業内容
- [x] pnpm workspace設定の検証
- [x] Turbo設定の最適化
- [x] 共通ライブラリ(types, utils)のビルド確認
- [x] ルートレベルのスクリプト整備

## 完了条件
- [x] すべてのワークスペースが正常にビルドできる
- [x] 依存関係が正しく解決される
- [x] scriptsディレクトリのコマンドが全て動作する

## ステータス
✅ 完了済み"

if [ $? -eq 0 ]; then
  echo "  ✅ 作成成功"
  # Closeする
  ISSUE_NUM=$(gh issue list --repo "$REPO" --limit 1 --json number --jq '.[0].number')
  gh issue close "$ISSUE_NUM" --repo "$REPO" --reason "completed"
  echo "  🔒 Closed"
else
  echo "  ❌ 作成失敗"
fi

echo ""

# Issue A-2
echo "[2/10] A-2: ESLint・Prettierの設定と適用"
gh issue create \
  --repo "$REPO" \
  --title "[TASK] A-2: ESLint・Prettierの設定と適用" \
  --label "task,infrastructure,priority: high,size: S" \
  --milestone "Phase 0: 基盤構築" \
  --body "## 概要
コード品質と一貫性を保つためのLinter・Formatter設定

## 作業内容
- [x] ESLint 9.x flat config設定
- [x] Prettier設定
- [x] TypeScript strict設定
- [x] 各ワークスペースへの適用

## 完了条件
- [x] pnpm lint でエラーなし
- [x] 全ファイルがフォーマットルールに準拠
- [x] CI/CDでlintチェックが動作

## ステータス
✅ 完了済み"

if [ $? -eq 0 ]; then
  echo "  ✅ 作成成功"
  ISSUE_NUM=$(gh issue list --repo "$REPO" --limit 1 --json number --jq '.[0].number')
  gh issue close "$ISSUE_NUM" --repo "$REPO" --reason "completed"
  echo "  🔒 Closed"
else
  echo "  ❌ 作成失敗"
fi

echo ""

# Issue A-3
echo "[3/10] A-3: Backend基盤の構築（NestJS）"
gh issue create \
  --repo "$REPO" \
  --title "[TASK] A-3: Backend基盤の構築（NestJS）" \
  --label "task,infrastructure,backend,priority: high,size: L" \
  --milestone "Phase 0: 基盤構築" \
  --body "## 概要
NestJSによるバックエンドアプリケーションの基盤構築

## 作業内容
- [x] NestJSプロジェクトの初期化
- [x] Onion Architectureの基本構造構築
- [x] ConfigModule、ScheduleModuleの設定
- [x] 共通層（filters, interceptors, guards）の整備

## 完了条件
- [x] pnpm dev:backend でサーバーが起動
- [x] APIのヘルスチェックが動作
- [x] 環境変数の設定が正常

## ステータス
✅ 完了済み"

if [ $? -eq 0 ]; then
  echo "  ✅ 作成成功"
  ISSUE_NUM=$(gh issue list --repo "$REPO" --limit 1 --json number --jq '.[0].number')
  gh issue close "$ISSUE_NUM" --repo "$REPO" --reason "completed"
  echo "  🔒 Closed"
else
  echo "  ❌ 作成失敗"
fi

echo ""

# Issue A-4
echo "[4/10] A-4: Frontend基盤の構築（Next.js）"
gh issue create \
  --repo "$REPO" \
  --title "[TASK] A-4: Frontend基盤の構築（Next.js）" \
  --label "task,infrastructure,frontend,priority: high,size: L" \
  --milestone "Phase 0: 基盤構築" \
  --body "## 概要
Next.js 14（App Router）によるフロントエンドアプリケーションの基盤構築

## 作業内容
- [x] Next.jsプロジェクトの初期化
- [x] Tailwind CSSの設定
- [x] ディレクトリ構造の整備
- [x] API Client層の構築

## 完了条件
- [x] pnpm dev:frontend でアプリが起動
- [x] トップページが表示される
- [x] APIクライアントでバックエンドと通信できる

## ステータス
✅ 完了済み"

if [ $? -eq 0 ]; then
  echo "  ✅ 作成成功"
  ISSUE_NUM=$(gh issue list --repo "$REPO" --limit 1 --json number --jq '.[0].number')
  gh issue close "$ISSUE_NUM" --repo "$REPO" --reason "completed"
  echo "  🔒 Closed"
else
  echo "  ❌ 作成失敗"
fi

echo ""

# Issue A-5
echo "[5/10] A-5: 開発用スクリプト群の整備"
gh issue create \
  --repo "$REPO" \
  --title "[TASK] A-5: 開発用スクリプト群の整備" \
  --label "task,infrastructure,priority: medium,size: M" \
  --milestone "Phase 0: 基盤構築" \
  --body "## 概要
開発効率を向上させるためのシェルスクリプト群の作成

## 作業内容
- [x] dev.sh - 開発サーバー起動
- [x] build.sh - ビルドスクリプト
- [x] test.sh - テスト実行
- [x] lint.sh - Linter実行
- [x] clean.sh - クリーンアップ
- [x] GitHub関連スクリプト

## 完了条件
- [x] すべてのスクリプトが正常に動作
- [x] README.mdにスクリプトの説明を記載

## ステータス
✅ 完了済み"

if [ $? -eq 0 ]; then
  echo "  ✅ 作成成功"
  ISSUE_NUM=$(gh issue list --repo "$REPO" --limit 1 --json number --jq '.[0].number')
  gh issue close "$ISSUE_NUM" --repo "$REPO" --reason "completed"
  echo "  🔒 Closed"
else
  echo "  ❌ 作成失敗"
fi

echo ""

# Issue A-6
echo "[6/10] A-6: GitHub Actions CI パイプライン構築"
gh issue create \
  --repo "$REPO" \
  --title "[TASK] A-6: GitHub Actions CI パイプライン構築" \
  --label "task,infrastructure,testing,priority: high,size: M" \
  --milestone "Phase 0: 基盤構築" \
  --body "## 概要
GitHub ActionsによるCI/CDパイプラインの構築

## 作業内容
- [ ] Lint実行の自動化
- [ ] 単体テスト実行の自動化
- [ ] ビルド検証の自動化
- [ ] PRチェックの自動化
- [ ] Codecov連携

## 完了条件
- [ ] PR作成時に自動的にCIが実行される
- [ ] Lintエラーがあればfail
- [ ] テストが失敗すればfail
- [ ] カバレッジレポートが生成される

## ステータス
📋 未着手"

if [ $? -eq 0 ]; then
  echo "  ✅ 作成成功（Open）"
else
  echo "  ❌ 作成失敗"
fi

echo ""

# Issue A-7
echo "[7/10] A-7: GitHub Issue管理環境の構築"
gh issue create \
  --repo "$REPO" \
  --title "[TASK] A-7: GitHub Issue管理環境の構築" \
  --label "task,infrastructure,priority: high,size: L" \
  --milestone "Phase 0: 基盤構築" \
  --body "## 概要
GitHub Issue管理に必要なテンプレート、ラベル、マイルストーン、プロジェクトボードの整備

## 作業内容
- [x] Issueテンプレートの作成
- [x] PRテンプレートの作成
- [x] 58個のラベルの作成
- [x] 7個のマイルストーン作成
- [x] プロジェクトボードの作成と設定
- [x] Issue自動ラベリングWorkflow

## 完了条件
- [x] Issueテンプレートが利用可能
- [x] ラベルが全て作成済み
- [x] マイルストーンが作成済み
- [x] プロジェクトボードが設定済み

## ステータス
✅ 完了済み"

if [ $? -eq 0 ]; then
  echo "  ✅ 作成成功"
  ISSUE_NUM=$(gh issue list --repo "$REPO" --limit 1 --json number --jq '.[0].number')
  gh issue close "$ISSUE_NUM" --repo "$REPO" --reason "completed"
  echo "  🔒 Closed"
else
  echo "  ❌ 作成失敗"
fi

echo ""

# Issue A-8
echo "[8/10] A-8: データディレクトリ構造の整備"
gh issue create \
  --repo "$REPO" \
  --title "[TASK] A-8: データディレクトリ構造の整備" \
  --label "task,infrastructure,priority: medium,size: S" \
  --milestone "Phase 0: 基盤構築" \
  --body "## 概要
JSON形式でのデータ永続化のためのディレクトリ構造整備

## 作業内容
- [x] data/ ディレクトリの作成
- [x] カテゴリデータの初期化
- [x] 金融機関データの雛形作成
- [x] 取引データディレクトリの作成
- [x] 設定データディレクトリの作成

## 完了条件
- [x] 必要なディレクトリが全て存在
- [x] サンプルデータが正常に読み込める

## ステータス
✅ 完了済み"

if [ $? -eq 0 ]; then
  echo "  ✅ 作成成功"
  ISSUE_NUM=$(gh issue list --repo "$REPO" --limit 1 --json number --jq '.[0].number')
  gh issue close "$ISSUE_NUM" --repo "$REPO" --reason "completed"
  echo "  🔒 Closed"
else
  echo "  ❌ 作成失敗"
fi

echo ""

# Issue A-9
echo "[9/10] A-9: カテゴリマスタデータの初期化"
gh issue create \
  --repo "$REPO" \
  --title "[TASK] A-9: カテゴリマスタデータの初期化" \
  --label "task,infrastructure,backend,priority: medium,size: S" \
  --milestone "Phase 0: 基盤構築" \
  --body "## 概要
5種類の費目分類マスタデータの初期化

## 作業内容
- [x] 食費カテゴリのデータ作成
- [x] 日用品カテゴリのデータ作成
- [x] 交際費カテゴリのデータ作成
- [x] 交通費カテゴリのデータ作成
- [x] その他カテゴリのデータ作成
- [x] カテゴリAPIでの読み込みテスト

## 完了条件
- [x] カテゴリデータが正常に読み込める
- [x] GET /api/categories で全カテゴリが取得できる

## ステータス
✅ 完了済み"

if [ $? -eq 0 ]; then
  echo "  ✅ 作成成功"
  ISSUE_NUM=$(gh issue list --repo "$REPO" --limit 1 --json number --jq '.[0].number')
  gh issue close "$ISSUE_NUM" --repo "$REPO" --reason "completed"
  echo "  🔒 Closed"
else
  echo "  ❌ 作成失敗"
fi

echo ""

# Issue A-10
echo "[10/10] A-10: ドキュメント整備（要件定義・設計書）"
gh issue create \
  --repo "$REPO" \
  --title "[TASK] A-10: ドキュメント整備" \
  --label "task,documentation,priority: medium,size: L" \
  --milestone "Phase 0: 基盤構築" \
  --body "## 概要
プロジェクトの要件定義書、設計書、開発ガイドの整備

## 作業内容
- [x] 要件定義書の作成
- [x] システムアーキテクチャ設計書
- [x] 機能要件詳細書 (FR-001〜031)
- [x] テスト設計書
- [x] セットアップガイド
- [x] 開発タスク一覧

## 完了条件
- [x] すべてのドキュメントが作成済み
- [x] ドキュメントが最新の実装状況を反映

## ステータス
✅ 完了済み"

if [ $? -eq 0 ]; then
  echo "  ✅ 作成成功"
  ISSUE_NUM=$(gh issue list --repo "$REPO" --limit 1 --json number --jq '.[0].number')
  gh issue close "$ISSUE_NUM" --repo "$REPO" --reason "completed"
  echo "  🔒 Closed"
else
  echo "  ❌ 作成失敗"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ カテゴリA Issue作成完了！"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "確認: https://github.com/kencom2400/account-book/issues"
echo ""

