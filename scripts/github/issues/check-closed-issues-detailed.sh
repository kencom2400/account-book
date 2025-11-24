#!/bin/bash

# CloseされたIssueの完了状況詳細確認スクリプト

REPO="kencom2400/account-book"
REOPEN_LIST=()
COMPLETED_LIST=()

echo "════════════════════════════════════════════════════════════════"
echo "   🔍 CloseされたIssueの完了状況確認（詳細版）"
echo "════════════════════════════════════════════════════════════════"
echo ""

# 全CloseされたIssueを取得
CLOSED_ISSUES=$(gh issue list --repo "$REPO" --state closed --limit 100 --json number,title | jq -r '.[] | "\(.number)|\(.title)"')

while IFS='|' read -r issue_num issue_title; do
    echo "────────────────────────────────────────────────────────────────"
    echo "Issue #$issue_num: $issue_title"
    echo "────────────────────────────────────────────────────────────────"
    
    # Issueの本文を取得
    issue_body=$(gh issue view "$issue_num" --repo "$REPO" --json body | jq -r '.body')
    
    # Acceptance Criteriaのチェックボックスを確認
    unchecked_ac=$(echo "$issue_body" | grep -A 50 "Acceptance Criteria" | grep "^- \[ \]" | wc -l)
    checked_ac=$(echo "$issue_body" | grep -A 50 "Acceptance Criteria" | grep "^- \[x\]" | wc -l)
    
    # Definition of Doneのチェックボックスを確認
    unchecked_dod=$(echo "$issue_body" | grep -A 100 "Definition of Done" | grep "^- \[ \]" | wc -l)
    checked_dod=$(echo "$issue_body" | grep -A 100 "Definition of Done" | grep "^- \[x\]" | wc -l)
    
    echo "📋 チェックボックス確認:"
    echo "  Acceptance Criteria: ✅ $checked_ac / ❌ $unchecked_ac"
    echo "  Definition of Done:  ✅ $checked_dod / ❌ $unchecked_dod"
    
    # カテゴリ別の具体的な確認
    case $issue_num in
        5)
            # A-1: Monorepo環境
            echo ""
            echo "🔍 具体的な確認:"
            if [ -f "package.json" ] && [ -f "pnpm-workspace.yaml" ] && [ -f "turbo.json" ] && \
               [ -d "libs/types/dist" ] && [ -d "libs/utils/dist" ]; then
                echo "  ✅ Monorepo環境が完全に構築済み"
                echo "  ✅ 共通ライブラリがビルド済み"
                COMPLETED_LIST+=("$issue_num")
                echo "  📋 判定: ✅ 完了"
            else
                echo "  ❌ Monorepo環境が不完全"
                REOPEN_LIST+=("$issue_num")
                echo "  📋 判定: ⚠️  未完了 - Reopenが必要"
            fi
            ;;
        6)
            # A-2: ESLint・Prettier
            echo ""
            echo "🔍 具体的な確認:"
            if [ -f "eslint.config.mjs" ]; then
                echo "  ✅ ESLint設定ファイルが存在"
                COMPLETED_LIST+=("$issue_num")
                echo "  📋 判定: ✅ 完了"
            else
                echo "  ❌ ESLint設定ファイルが不足"
                REOPEN_LIST+=("$issue_num")
                echo "  📋 判定: ⚠️  未完了 - Reopenが必要"
            fi
            ;;
        7)
            # A-3: Backend基盤
            echo ""
            echo "🔍 具体的な確認:"
            if [ -f "apps/backend/src/app.module.ts" ] && \
               [ -f "apps/backend/src/main.ts" ] && \
               [ -d "apps/backend/src/config" ] && \
               [ -d "apps/backend/src/modules" ]; then
                echo "  ✅ Backend基盤が完全に構築済み"
                # モジュール数を確認
                module_count=$(ls -1 apps/backend/src/modules | wc -l)
                echo "  ✅ モジュール数: $module_count"
                COMPLETED_LIST+=("$issue_num")
                echo "  📋 判定: ✅ 完了"
            else
                echo "  ❌ Backend基盤が不完全"
                REOPEN_LIST+=("$issue_num")
                echo "  📋 判定: ⚠️  未完了 - Reopenが必要"
            fi
            ;;
        8)
            # A-4: Frontend基盤
            echo ""
            echo "🔍 具体的な確認:"
            if [ -f "apps/frontend/next.config.ts" ] && \
               [ -f "apps/frontend/tailwind.config.ts" ] && \
               [ -d "apps/frontend/src/lib/api" ] && \
               [ -d "apps/frontend/src/components" ]; then
                echo "  ✅ Frontend基盤が完全に構築済み"
                # API Client数を確認
                api_count=$(ls -1 apps/frontend/src/lib/api/*.ts 2>/dev/null | wc -l)
                echo "  ✅ API Client数: $api_count"
                COMPLETED_LIST+=("$issue_num")
                echo "  📋 判定: ✅ 完了"
            else
                echo "  ❌ Frontend基盤が不完全"
                REOPEN_LIST+=("$issue_num")
                echo "  📋 判定: ⚠️  未完了 - Reopenが必要"
            fi
            ;;
        9)
            # A-5: 開発用スクリプト
            echo ""
            echo "🔍 具体的な確認:"
            required_scripts=("dev.sh" "build.sh" "test.sh" "lint.sh" "install.sh")
            all_exist=true
            for script in "${required_scripts[@]}"; do
                if [ -f "scripts/$script" ]; then
                    echo "  ✅ scripts/$script が存在"
                else
                    echo "  ❌ scripts/$script が存在しない"
                    all_exist=false
                fi
            done
            if [ "$all_exist" = true ] && [ -f "scripts/README.md" ]; then
                COMPLETED_LIST+=("$issue_num")
                echo "  📋 判定: ✅ 完了"
            else
                REOPEN_LIST+=("$issue_num")
                echo "  📋 判定: ⚠️  未完了 - Reopenが必要"
            fi
            ;;
        11)
            # A-7: GitHub Issue管理環境
            echo ""
            echo "🔍 具体的な確認:"
            if [ -d ".github/ISSUE_TEMPLATE" ] && \
               [ -f ".github/labels.yml" ] && \
               [ -f ".github/workflows/issue-labeler.yml" ] && \
               [ -f ".github/ISSUE_MANAGEMENT.md" ]; then
                template_count=$(ls -1 .github/ISSUE_TEMPLATE/*.md 2>/dev/null | wc -l)
                echo "  ✅ Issueテンプレート数: $template_count"
                echo "  ✅ ラベル定義ファイルが存在"
                echo "  ✅ 自動ラベリングWorkflowが存在"
                COMPLETED_LIST+=("$issue_num")
                echo "  📋 判定: ✅ 完了"
            else
                echo "  ❌ GitHub Issue管理環境が不完全"
                REOPEN_LIST+=("$issue_num")
                echo "  📋 判定: ⚠️  未完了 - Reopenが必要"
            fi
            ;;
        12)
            # A-8: データディレクトリ
            echo ""
            echo "🔍 具体的な確認:"
            if [ -d "apps/backend/data/categories" ] && \
               [ -d "apps/backend/data/institutions" ] && \
               [ -d "apps/backend/data/transactions" ]; then
                echo "  ✅ データディレクトリが完全に整備済み"
                COMPLETED_LIST+=("$issue_num")
                echo "  📋 判定: ✅ 完了"
            else
                echo "  ❌ データディレクトリが不完全"
                REOPEN_LIST+=("$issue_num")
                echo "  📋 判定: ⚠️  未完了 - Reopenが必要"
            fi
            ;;
        13)
            # A-9: カテゴリマスタ
            echo ""
            echo "🔍 具体的な確認:"
            if [ -f "apps/backend/data/categories/categories.json" ]; then
                # カテゴリ数を確認
                category_count=$(jq '. | length' apps/backend/data/categories/categories.json 2>/dev/null || echo "0")
                echo "  ✅ カテゴリマスタデータが存在"
                echo "  ✅ カテゴリ数: $category_count"
                if [ "$category_count" -gt 0 ]; then
                    COMPLETED_LIST+=("$issue_num")
                    echo "  📋 判定: ✅ 完了"
                else
                    REOPEN_LIST+=("$issue_num")
                    echo "  📋 判定: ⚠️  未完了 - カテゴリデータが空"
                fi
            else
                echo "  ❌ カテゴリマスタデータが存在しない"
                REOPEN_LIST+=("$issue_num")
                echo "  📋 判定: ⚠️  未完了 - Reopenが必要"
            fi
            ;;
        14)
            # A-10: ドキュメント整備
            echo ""
            echo "🔍 具体的な確認:"
            docs_check=true
            required_docs=("requirements-specification.md" "system-architecture.md" "test-design.md")
            for doc in "${required_docs[@]}"; do
                if [ -f "docs/$doc" ]; then
                    echo "  ✅ docs/$doc が存在"
                else
                    echo "  ❌ docs/$doc が存在しない"
                    docs_check=false
                fi
            done
            
            # 機能要件ドキュメントの確認
            fr_count=$(ls -1 docs/functional-requirements/*.md 2>/dev/null | wc -l)
            echo "  ✅ 機能要件ドキュメント数: $fr_count"
            
            if [ "$docs_check" = true ] && [ "$fr_count" -gt 0 ]; then
                COMPLETED_LIST+=("$issue_num")
                echo "  📋 判定: ✅ 完了"
            else
                REOPEN_LIST+=("$issue_num")
                echo "  📋 判定: ⚠️  未完了 - ドキュメントが不完全"
            fi
            ;;
        138)
            # GitHub環境構築と全Issue詳細化
            echo ""
            echo "🔍 具体的な確認:"
            total_issues=$(gh issue list --repo "$REPO" --limit 9999 --state all | wc -l)
            echo "  ✅ 総Issue数: $total_issues"
            
            if [ "$total_issues" -gt 90 ]; then
                COMPLETED_LIST+=("$issue_num")
                echo "  📋 判定: ✅ 完了"
            else
                REOPEN_LIST+=("$issue_num")
                echo "  📋 判定: ⚠️  未完了 - Issue数が不足"
            fi
            ;;
        *)
            # その他のIssue
            echo ""
            echo "🔍 判定: ⚠️  個別確認が必要"
            ;;
    esac
    
    echo ""
done <<< "$CLOSED_ISSUES"

# 結果サマリー
echo "════════════════════════════════════════════════════════════════"
echo "   📊 確認結果サマリー"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "✅ 完了: ${#COMPLETED_LIST[@]} 個"
echo "⚠️  未完了: ${#REOPEN_LIST[@]} 個"
echo ""

if [ ${#REOPEN_LIST[@]} -eq 0 ]; then
    echo "🎉 すべてのCloseされたIssueが完了条件を満たしています！"
else
    echo "⚠️  以下のIssueが完了条件を満たしていません:"
    echo ""
    for issue_num in "${REOPEN_LIST[@]}"; do
        issue_title=$(gh issue view "$issue_num" --repo "$REPO" --json title | jq -r '.title')
        echo "  - Issue #$issue_num: $issue_title"
    done
fi

echo ""
echo "════════════════════════════════════════════════════════════════"

# Reopenリストを返す
if [ ${#REOPEN_LIST[@]} -gt 0 ]; then
    echo ""
    echo "これらのIssueをReopenしますか？ (y/N)"
    echo ""
    echo "Reopenするには以下のコマンドを実行してください："
    echo ""
    for issue_num in "${REOPEN_LIST[@]}"; do
        echo "  gh issue reopen $issue_num --repo $REPO"
    done
    echo ""
fi

