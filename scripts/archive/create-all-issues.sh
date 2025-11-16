#!/bin/bash

# GitHub CLIがインストールされているか確認
if ! command -v gh &> /dev/null; then
    echo "❌ エラー: GitHub CLI (gh) がインストールされていません。"
    exit 1
fi

# GitHub CLIの認証状態を確認
if ! gh auth status &> /dev/null; then
    echo "❌ 警告: GitHub CLIが認証されていません。"
    exit 1
fi

REPO_OWNER=$(gh repo view --json owner --jq '.owner.login')
REPO_NAME=$(gh repo view --json name --jq '.name')

echo "════════════════════════════════════════════════════════════════"
echo "   📋 GitHub Issue一括作成スクリプト"
echo "════════════════════════════════════════════════════════════════"
echo "📍 リポジトリ: ${REPO_OWNER}/${REPO_NAME}"
echo "📅 日時: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# プロジェクトIDを取得
PROJECT_ID=$(gh api graphql -f query='
  query {
    viewer {
      projectsV2(first: 10) {
        nodes {
          id
          title
        }
      }
    }
  }' --jq '.data.viewer.projectsV2.nodes[] | select(.title == "Account Book Development") | .id')

if [ -n "$PROJECT_ID" ]; then
    echo "✅ プロジェクトボード: Account Book Development"
    echo "   ID: $PROJECT_ID"
else
    echo "⚠️  プロジェクトボードが見つかりませんでした（自動追加はスキップされます）"
fi

echo ""
echo "────────────────────────────────────────────────────────────────"
echo ""

# カウンター
TOTAL_CREATED=0
TOTAL_FAILED=0

# Issue作成関数
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    local milestone="$4"
    local state="${5:-open}"  # open or closed
    
    echo "  作成中: $title"
    
    local cmd="gh issue create --title \"$title\" --body \"$body\" --label \"$labels\""
    
    if [ -n "$milestone" ]; then
        cmd="$cmd --milestone \"$milestone\""
    fi
    
    # Issue作成
    local issue_url=$(eval $cmd 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "    ✅ 作成成功: $issue_url"
        TOTAL_CREATED=$((TOTAL_CREATED + 1))
        
        # Closedにする場合
        if [ "$state" = "closed" ]; then
            local issue_number=$(echo "$issue_url" | grep -oE '[0-9]+$')
            gh issue close "$issue_number" --reason "completed" > /dev/null 2>&1
            echo "    🔒 Closed状態に設定"
        fi
        
        # プロジェクトボードに追加
        if [ -n "$PROJECT_ID" ]; then
            local issue_node_id=$(gh issue view "$issue_url" --json id --jq '.id')
            gh api graphql -f query="
                mutation {
                    addProjectV2ItemById(input: {projectId: \"$PROJECT_ID\", contentId: \"$issue_node_id\"}) {
                        item { id }
                    }
                }" > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                echo "    📊 プロジェクトボードに追加"
            fi
        fi
        
        return 0
    else
        echo "    ❌ 作成失敗: $issue_url"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
        return 1
    fi
}

# ============================================================
# A. 環境構築・インフラ (10個)
# ============================================================
echo "════════════════════════════════════════════════════════════════"
echo " 📂 カテゴリA: 環境構築・インフラ (10個)"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "[1/10] Monorepo環境の最終確認と整備"
create_issue \
    "[TASK] A-1: Monorepo環境の最終確認と整備" \
    "## 概要
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

## 関連ファイル
- \`package.json\` (ルート)
- \`pnpm-workspace.yaml\`
- \`turbo.json\`
- \`libs/types/\`, \`libs/utils/\`

## ステータス
✅ 完了済み" \
    "task,infrastructure,priority: high,size: M" \
    "Phase 0: 基盤構築" \
    "closed"

echo ""
echo "[2/10] ESLint・Prettierの設定と適用"
create_issue \
    "[TASK] A-2: ESLint・Prettierの設定と適用" \
    "## 概要
コード品質と一貫性を保つためのLinter・Formatter設定

## 作業内容
- [x] ESLint 9.x flat config設定
- [x] Prettier設定
- [x] TypeScript strict設定
- [x] 各ワークスペースへの適用

## 完了条件
- [x] \`pnpm lint\`でエラーなし
- [x] 全ファイルがフォーマットルールに準拠
- [x] CI/CDでlintチェックが動作

## 関連ファイル
- \`eslint.config.mjs\`
- \`tsconfig.json\`
- \`apps/backend/eslint.config.mjs\`
- \`apps/frontend/\`

## ステータス
✅ 完了済み" \
    "task,infrastructure,priority: high,size: S" \
    "Phase 0: 基盤構築" \
    "closed"

echo ""
echo "[3/10] Backend基盤の構築（NestJS）"
create_issue \
    "[TASK] A-3: Backend基盤の構築（NestJS）" \
    "## 概要
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

## 関連ファイル
- apps/backend/src/
- apps/backend/src/app.module.ts
- apps/backend/src/config/

## ステータス
✅ 完了済み" \
    "task,infrastructure,backend,priority: high,size: L" \
    "Phase 0: 基盤構築" \
    "closed"

echo ""
echo "[4/10] Frontend基盤の構築（Next.js）"
create_issue \
    "[TASK] A-4: Frontend基盤の構築（Next.js）" \
    "## 概要
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

## 関連ファイル
- apps/frontend/src/
- apps/frontend/next.config.ts
- apps/frontend/tailwind.config.ts

## ステータス
✅ 完了済み" \
    "task,infrastructure,frontend,priority: high,size: L" \
    "Phase 0: 基盤構築" \
    "closed"

echo ""
echo "[5/10] 開発用スクリプト群の整備"
create_issue \
    "[TASK] A-5: 開発用スクリプト群の整備" \
    "## 概要
開発効率を向上させるためのシェルスクリプト群の作成

## 作業内容
- [x] dev.sh - 開発サーバー起動
- [x] build.sh - ビルドスクリプト
- [x] test.sh - テスト実行
- [x] lint.sh - Linter実行
- [x] clean.sh - クリーンアップ
- [x] GitHub関連スクリプト（labels, issues, workflow）

## 完了条件
- [x] すべてのスクリプトが正常に動作
- [x] README.mdにスクリプトの説明を記載

## 関連ファイル
- scripts/
- scripts/README.md

## ステータス
✅ 完了済み" \
    "task,infrastructure,priority: medium,size: M" \
    "Phase 0: 基盤構築" \
    "closed"

echo ""
echo "[6/10] GitHub Actions CI パイプライン構築"
create_issue \
    "[TASK] A-6: GitHub Actions CI パイプライン構築" \
    "## 概要
GitHub ActionsによるCI/CDパイプラインの構築

## 作業内容
- [ ] Lint実行の自動化
- [ ] 単体テスト実行の自動化
- [ ] ビルド検証の自動化
- [ ] PRチェックの自動化
- [ ] Codecov連携（カバレッジレポート）

## 完了条件
- [ ] PR作成時に自動的にCIが実行される
- [ ] Lintエラーがあればfail
- [ ] テストが失敗すればfail
- [ ] カバレッジレポートが生成される

## 関連ファイル
- .github/workflows/ci.yml
- .github/workflows/test.yml

## 参考
- docs/system-architecture.md - CI/CDセクション
- docs/test-design.md

## ステータス
📋 未着手" \
    "task,infrastructure,testing,priority: high,size: M" \
    "Phase 0: 基盤構築" \
    "open"

echo ""
echo "[7/10] GitHub Issue管理環境の構築"
create_issue \
    "[TASK] A-7: GitHub Issue管理環境の構築" \
    "## 概要
GitHub Issue管理に必要なテンプレート、ラベル、マイルストーン、プロジェクトボードの整備

## 作業内容
- [x] Issueテンプレートの作成（Feature, Bug, Task）
- [x] PRテンプレートの作成
- [x] 58個のラベルの作成
- [x] 7個のマイルストーン作成
- [x] プロジェクトボードの作成と設定
- [x] Issue自動ラベリングWorkflowの設定

## 完了条件
- [x] Issueテンプレートが利用可能
- [x] ラベルが全て作成済み
- [x] マイルストーンが作成済み
- [x] プロジェクトボードが設定済み
- [x] 自動ラベリングが動作

## 関連ファイル
- .github/ISSUE_TEMPLATE/
- .github/labels.yml
- .github/workflows/issue-labeler.yml
- scripts/setup-github-labels.sh

## ステータス
✅ 完了済み" \
    "task,infrastructure,priority: high,size: L" \
    "Phase 0: 基盤構築" \
    "closed"

echo ""
echo "[8/10] データディレクトリ構造の整備"
create_issue \
    "[TASK] A-8: データディレクトリ構造の整備" \
    "## 概要
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
- [x] .gitignore で適切にデータファイルを除外

## 関連ファイル
- data/categories/
- data/institutions/
- data/transactions/
- data/settings/

## ステータス
✅ 完了済み" \
    "task,infrastructure,priority: medium,size: S" \
    "Phase 0: 基盤構築" \
    "closed"

echo ""
echo "[9/10] カテゴリマスタデータの初期化"
create_issue \
    "[TASK] A-9: カテゴリマスタデータの初期化" \
    "## 概要
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
- [x] カテゴリIDの重複がない

## 関連ファイル
- apps/backend/data/categories/categories.json
- apps/backend/src/modules/category/

## ステータス
✅ 完了済み" \
    "task,infrastructure,backend,priority: medium,size: S" \
    "Phase 0: 基盤構築" \
    "closed"

echo ""
echo "[10/10] ドキュメント整備（要件定義・設計書）"
create_issue \
    "[TASK] A-10: ドキュメント整備（要件定義・設計書）" \
    "## 概要
プロジェクトの要件定義書、設計書、開発ガイドの整備

## 作業内容
- [x] 要件定義書の作成 (requirements-specification.md)
- [x] システムアーキテクチャ設計書 (system-architecture.md)
- [x] 機能要件詳細書 (FR-001〜031)
- [x] テスト設計書 (test-design.md)
- [x] セットアップガイド (SETUP.md)
- [x] 開発タスク一覧 (development-setup-tasks.md)

## 完了条件
- [x] すべてのドキュメントが作成済み
- [x] ドキュメントが最新の実装状況を反映
- [x] README.mdにドキュメントへのリンクを記載

## 関連ファイル
- docs/
- README.md
- SETUP.md

## ステータス
✅ 完了済み" \
    "task,documentation,priority: medium,size: L" \
    "Phase 0: 基盤構築" \
    "closed"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo " ✅ カテゴリA完了: ${TOTAL_CREATED}個作成, ${TOTAL_FAILED}個失敗"
echo "════════════════════════════════════════════════════════════════"
echo ""

# 最終サマリー
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "   📊 Issue作成完了サマリー"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "✅ 作成成功: ${TOTAL_CREATED}個"
echo "❌ 作成失敗: ${TOTAL_FAILED}個"
echo ""
echo "🔗 Issue一覧:"
echo "   https://github.com/${REPO_OWNER}/${REPO_NAME}/issues"
echo ""
echo "📊 プロジェクトボード:"
echo "   https://github.com/users/${REPO_OWNER}/projects/1"
echo ""
echo "════════════════════════════════════════════════════════════════"

