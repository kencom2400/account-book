#!/bin/bash

# 未実装Issueをプロジェクトボードの Backlog に移動

# 設定ファイルの読み込み
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/../workflow/config.sh" ]; then
  source "${SCRIPT_DIR}/../workflow/config.sh"
fi

# リポジトリ情報（設定ファイルから取得、未設定の場合はデフォルト値）
REPO="${REPO:-${REPO_OWNER:-kencom2400}/${REPO_NAME:-account-book}}"
OWNER="${OWNER:-${REPO_OWNER:-kencom2400}}"
PROJECT_NUMBER="${PROJECT_NUMBER:-1}"

# 未実装のIssue一覧
REOPEN_ISSUES=(
  79 80 81 82 83 84 85 86 87 88 89 90 91 92
  93 94 95 96 97 98 99 100 101 102 103 104 105 106
  107 108 109 110 111 112 113 114 115 116 117 118 119 120 121
  122 123 124 125 126
  127 128 129 130 131 132 133
  134 135 136 137
)

echo "════════════════════════════════════════════════════════════════"
echo "   📋 未実装IssueをBacklogに移動"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "プロジェクト: Account Book Development (Project #$PROJECT_NUMBER)"
echo "対象Issue数: ${#REOPEN_ISSUES[@]} 個"
echo ""

SUCCESS_COUNT=0
ALREADY_ADDED_COUNT=0
ERROR_COUNT=0

for issue_num in "${REOPEN_ISSUES[@]}"; do
    echo -n "Issue #$issue_num ... "
    
    # プロジェクトにIssueを追加
    result=$(gh project item-add "$PROJECT_NUMBER" \
        --owner "$OWNER" \
        --url "https://github.com/$OWNER/$REPO_NAME/issues/$issue_num" 2>&1)
    
    if echo "$result" | grep -q "already exists"; then
        echo "✅ 既に追加済み"
        ALREADY_ADDED_COUNT=$((ALREADY_ADDED_COUNT + 1))
    elif [ $? -eq 0 ]; then
        echo "✅ 追加完了"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "❌ エラー: $result"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
    
    # API rate limit対策
    sleep 0.5
done

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "   📊 実行結果"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "✅ 新規追加: $SUCCESS_COUNT 個"
echo "✅ 既に追加済み: $ALREADY_ADDED_COUNT 個"
if [ $ERROR_COUNT -gt 0 ]; then
    echo "❌ エラー: $ERROR_COUNT 個"
fi
echo ""
echo "合計: ${#REOPEN_ISSUES[@]} 個"
echo ""

echo "────────────────────────────────────────────────────────────────"
echo "💡 次のステップ"
echo "────────────────────────────────────────────────────────────────"
echo ""
echo "プロジェクトボードのWeb UIで、各IssueのステータスをBacklogに設定してください："
echo ""
echo "  https://github.com/users/$OWNER/projects/$PROJECT_NUMBER"
echo ""
echo "GitHub CLIではカラム移動が直接サポートされていないため、"
echo "Web UIから手動で設定する必要があります。"
echo ""
echo "または、GitHub GraphQL APIを使用して一括設定することも可能です。"
echo ""
echo "════════════════════════════════════════════════════════════════"

