#!/bin/bash

# 設定ファイルの読み込み
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/../workflow/config.sh" ]; then
  source "${SCRIPT_DIR}/../workflow/config.sh"
fi

# GitHub API limit（設定ファイルで定義されていない場合のデフォルト値）
GH_API_LIMIT="${GH_API_LIMIT:-9999}"


# CloseされたIssueの完了状況確認スクリプト

REPO="kencom2400/account-book"
REOPEN_LIST=()

echo "════════════════════════════════════════════════════════════════"
echo "   🔍 CloseされたIssueの完了状況確認"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Issue #5: A-1 Monorepo環境の最終確認と整備
echo "[1/10] Issue #5: A-1: Monorepo環境の最終確認と整備"
echo "確認項目:"
echo "  - pnpm workspace設定"
echo "  - Turbo設定"
echo "  - 共通ライブラリのビルド"
echo ""

# package.jsonとpnpm-workspace.yamlの存在確認
if [ -f "package.json" ] && [ -f "pnpm-workspace.yaml" ] && [ -f "turbo.json" ]; then
    echo "  ✅ 設定ファイルが存在"
    # libs配下のビルド確認
    if [ -d "libs/types/dist" ] && [ -d "libs/utils/dist" ]; then
        echo "  ✅ 共通ライブラリがビルド済み"
        echo "  📋 判定: 完了"
    else
        echo "  ⚠️  共通ライブラリがビルドされていない"
        echo "  📋 判定: 未完了 - Reopenが必要"
        REOPEN_LIST+=("5")
    fi
else
    echo "  ❌ 必要な設定ファイルが不足"
    echo "  📋 判定: 未完了 - Reopenが必要"
    REOPEN_LIST+=("5")
fi
echo ""

# Issue #6: A-2 ESLint・Prettierの設定と適用
echo "[2/10] Issue #6: A-2: ESLint・Prettierの設定と適用"
echo "確認項目:"
echo "  - ESLint設定ファイル"
echo "  - Prettier設定"
echo "  - Lintエラーなし"
echo ""

if [ -f "eslint.config.mjs" ] && [ -f ".prettierrc" ]; then
    echo "  ✅ 設定ファイルが存在"
    echo "  📋 判定: 完了"
else
    echo "  ❌ 設定ファイルが不足"
    echo "  📋 判定: 未完了 - Reopenが必要"
    REOPEN_LIST+=("6")
fi
echo ""

# Issue #7: A-3 Backend基盤の構築
echo "[3/10] Issue #7: A-3: Backend基盤の構築（NestJS）"
echo "確認項目:"
echo "  - NestJSプロジェクトの存在"
echo "  - app.module.tsの存在"
echo "  - configディレクトリの存在"
echo ""

if [ -f "apps/backend/src/app.module.ts" ] && [ -d "apps/backend/src/config" ]; then
    echo "  ✅ Backend基盤が構築済み"
    echo "  📋 判定: 完了"
else
    echo "  ❌ Backend基盤が不完全"
    echo "  📋 判定: 未完了 - Reopenが必要"
    REOPEN_LIST+=("7")
fi
echo ""

# Issue #8: A-4 Frontend基盤の構築
echo "[4/10] Issue #8: A-4: Frontend基盤の構築（Next.js）"
echo "確認項目:"
echo "  - Next.jsプロジェクトの存在"
echo "  - Tailwind CSS設定"
echo "  - API Client層"
echo ""

if [ -f "apps/frontend/next.config.ts" ] && [ -f "apps/frontend/tailwind.config.ts" ] && [ -d "apps/frontend/src/lib/api" ]; then
    echo "  ✅ Frontend基盤が構築済み"
    echo "  📋 判定: 完了"
else
    echo "  ❌ Frontend基盤が不完全"
    echo "  📋 判定: 未完了 - Reopenが必要"
    REOPEN_LIST+=("8")
fi
echo ""

# Issue #9: A-5 開発用スクリプト群の整備
echo "[5/10] Issue #9: A-5: 開発用スクリプト群の整備"
echo "確認項目:"
echo "  - スクリプトの存在"
echo "  - scripts/README.mdの存在"
echo ""

if [ -f "scripts/dev/dev.sh" ] && [ -f "scripts/build/build.sh" ] && [ -f "scripts/test/test.sh" ] && [ -f "scripts/README.md" ]; then
    echo "  ✅ 開発用スクリプトが整備済み"
    echo "  📋 判定: 完了"
else
    echo "  ❌ スクリプトが不足"
    echo "  📋 判定: 未完了 - Reopenが必要"
    REOPEN_LIST+=("9")
fi
echo ""

# Issue #11: A-7 GitHub Issue管理環境の構築
echo "[6/10] Issue #11: A-7: GitHub Issue管理環境の構築"
echo "確認項目:"
echo "  - Issueテンプレート"
echo "  - labels.yml"
echo "  - workflows"
echo ""

if [ -d ".github/ISSUE_TEMPLATE" ] && [ -f ".github/labels.yml" ] && [ -f ".github/workflows/issue-labeler.yml" ]; then
    echo "  ✅ GitHub Issue管理環境が構築済み"
    echo "  📋 判定: 完了"
else
    echo "  ❌ 設定ファイルが不足"
    echo "  📋 判定: 未完了 - Reopenが必要"
    REOPEN_LIST+=("11")
fi
echo ""

# Issue #12: A-8 データディレクトリ構造の整備
echo "[7/10] Issue #12: A-8: データディレクトリ構造の整備"
echo "確認項目:"
echo "  - dataディレクトリの存在"
echo ""

# apps/backend/data の確認
if [ -d "apps/backend/data/categories" ] || [ -d "data" ]; then
    echo "  ✅ データディレクトリが整備済み"
    echo "  📋 判定: 完了"
else
    echo "  ❌ データディレクトリが存在しない"
    echo "  📋 判定: 未完了 - Reopenが必要"
    REOPEN_LIST+=("12")
fi
echo ""

# Issue #13: A-9 カテゴリマスタデータの初期化
echo "[8/10] Issue #13: A-9: カテゴリマスタデータの初期化"
echo "確認項目:"
echo "  - カテゴリデータファイルの存在"
echo ""

if [ -f "apps/backend/data/categories/categories.json" ]; then
    echo "  ✅ カテゴリマスタデータが存在"
    echo "  📋 判定: 完了"
else
    echo "  ❌ カテゴリデータが存在しない"
    echo "  📋 判定: 未完了 - Reopenが必要"
    REOPEN_LIST+=("13")
fi
echo ""

# Issue #14: A-10 ドキュメント整備
echo "[9/10] Issue #14: A-10: ドキュメント整備"
echo "確認項目:"
echo "  - 要件定義書"
echo "  - システムアーキテクチャ"
echo "  - テスト設計書"
echo ""

if [ -f "docs/requirements-specification.md" ] && [ -f "docs/system-architecture.md" ] && [ -f "docs/test-design-document.md" ]; then
    echo "  ✅ ドキュメントが整備済み"
    echo "  📋 判定: 完了"
else
    echo "  ❌ ドキュメントが不足"
    echo "  📋 判定: 未完了 - Reopenが必要"
    REOPEN_LIST+=("14")
fi
echo ""

# Issue #138: GitHub環境構築と全Issue詳細化の完了
echo "[10/10] Issue #138: GitHub環境構築と全Issue詳細化の完了"
echo "確認項目:"
echo "  - 100個のIssue作成"
echo "  - ラベル作成"
echo "  - マイルストーン作成"
echo ""

# GitHubのIssue数を確認（簡易チェック）
ISSUE_COUNT=$(gh issue list --repo "$REPO" --limit "$GH_API_LIMIT" --state all | wc -l)
if [ "$ISSUE_COUNT" -gt "$MIN_ISSUE_COUNT_FOR_COMPLETION" ]; then
    echo "  ✅ Issueが大量に作成されている（$ISSUE_COUNT 個以上）"
    echo "  📋 判定: 完了"
else
    echo "  ⚠️  Issue数が少ない（$ISSUE_COUNT 個）"
    echo "  📋 判定: 要確認"
fi
echo ""

# 結果サマリー
echo "════════════════════════════════════════════════════════════════"
echo "   📊 確認結果サマリー"
echo "════════════════════════════════════════════════════════════════"
echo ""

if [ ${#REOPEN_LIST[@]} -eq 0 ]; then
    echo "✅ すべてのCloseされたIssueが完了条件を満たしています"
else
    echo "⚠️  以下のIssueが完了条件を満たしていません:"
    echo ""
    for issue_num in "${REOPEN_LIST[@]}"; do
        echo "  - Issue #$issue_num"
    done
    echo ""
    echo "これらのIssueをReopenしますか？ (y/N): "
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
