#!/bin/bash

# 未実装IssueをプロジェクトボードのBacklogに移動（GraphQL API使用）

# 設定ファイルの読み込み
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/../workflow/config.sh" ]; then
  source "${SCRIPT_DIR}/../workflow/config.sh"
fi

# リポジトリ情報（設定ファイルから取得、未設定の場合はデフォルト値）
REPO="${REPO:-${REPO_OWNER:-kencom2400}/${REPO_NAME:-account-book}}"
OWNER="${OWNER:-${REPO_OWNER:-kencom2400}}"
PROJECT_ID="${PROJECT_ID:-PVT_kwHOANWYrs4BIOm-}"
STATUS_FIELD_ID="${STATUS_FIELD_ID:-PVTSSF_lAHOANWYrs4BIOm-zg4wCDo}"
BACKLOG_OPTION_ID="${BACKLOG_OPTION_ID:-f908f688}"

# 未実装のIssue一覧（カテゴリ別）
declare -A CATEGORIES
CATEGORIES[C]="79 80 81 82 83 84 85 86 87 88 89 90 91 92"
CATEGORIES[D]="93 94 95 96 97 98 99 100 101 102 103 104 105 106"
CATEGORIES[E]="107 108 109 110 111 112 113 114 115 116 117 118 119 120 121"
CATEGORIES[F]="122 123 124 125 126"
CATEGORIES[G]="127 128 129 130 131 132 133"
CATEGORIES[H]="134 135 136 137"

echo "════════════════════════════════════════════════════════════════"
echo "   📋 未実装IssueをBacklogに移動（GraphQL API使用）"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "プロジェクト: Account Book Development"
echo "Project ID: $PROJECT_ID"
echo "Status Field ID: $STATUS_FIELD_ID"
echo "Backlog Option ID: $BACKLOG_OPTION_ID"
echo ""

SUCCESS_COUNT=0
ALREADY_IN_PROJECT_COUNT=0
ERROR_COUNT=0
TOTAL_COUNT=0

for category in C D E F G H; do
    echo "────────────────────────────────────────────────────────────────"
    echo "カテゴリ $category"
    echo "────────────────────────────────────────────────────────────────"
    
    for issue_num in ${CATEGORIES[$category]}; do
        TOTAL_COUNT=$((TOTAL_COUNT + 1))
        echo -n "Issue #$issue_num ... "
        
        # 1. Issueのnode IDを取得
        ISSUE_ID=$(gh api repos/$OWNER/$REPO_NAME/issues/$issue_num --jq '.node_id' 2>&1)
        
        if [ $? -ne 0 ]; then
            echo "❌ Issue取得エラー: $ISSUE_ID"
            ERROR_COUNT=$((ERROR_COUNT + 1))
            continue
        fi
        
        # 2. プロジェクトにIssueを追加
        add_result=$(gh api graphql -f query="
mutation {
  addProjectV2ItemById(input: {
    projectId: \"$PROJECT_ID\"
    contentId: \"$ISSUE_ID\"
  }) {
    item {
      id
    }
  }
}
" 2>&1)
        
        if echo "$add_result" | grep -q "already exists"; then
            # 既にプロジェクトに存在する場合は、Item IDを別の方法で取得
            ITEM_ID=$(gh api graphql -f query="
query {
  node(id: \"$PROJECT_ID\") {
    ... on ProjectV2 {
      items(first: 100) {
        nodes {
          id
          content {
            ... on Issue {
              number
            }
          }
        }
      }
    }
  }
}
" --jq ".data.node.items.nodes[] | select(.content.number == $issue_num) | .id" 2>&1)
            
            if [ -z "$ITEM_ID" ]; then
                echo "⚠️  既にプロジェクトに追加済みだが、Item IDが取得できませんでした"
                ALREADY_IN_PROJECT_COUNT=$((ALREADY_IN_PROJECT_COUNT + 1))
                continue
            fi
            
            echo -n "既に追加済み, "
            ALREADY_IN_PROJECT_COUNT=$((ALREADY_IN_PROJECT_COUNT + 1))
        elif echo "$add_result" | grep -q '"id"'; then
            ITEM_ID=$(echo "$add_result" | jq -r '.data.addProjectV2ItemById.item.id')
            echo -n "追加完了, "
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo "❌ 追加エラー: $add_result"
            ERROR_COUNT=$((ERROR_COUNT + 1))
            continue
        fi
        
        # 3. StatusをBacklogに設定
        status_result=$(gh api graphql -f query="
mutation {
  updateProjectV2ItemFieldValue(input: {
    projectId: \"$PROJECT_ID\"
    itemId: \"$ITEM_ID\"
    fieldId: \"$STATUS_FIELD_ID\"
    value: {
      singleSelectOptionId: \"$BACKLOG_OPTION_ID\"
    }
  }) {
    projectV2Item {
      id
    }
  }
}
" 2>&1)
        
        if echo "$status_result" | grep -q '"id"'; then
            echo "✅ Backlogに設定完了"
        else
            echo "⚠️  Backlogへの設定でエラー: $(echo "$status_result" | head -1)"
        fi
        
        # API rate limit対策
        sleep 1
    done
    
    echo ""
done

echo "════════════════════════════════════════════════════════════════"
echo "   📊 実行結果"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "対象Issue数: $TOTAL_COUNT 個"
echo ""
echo "✅ 新規追加: $SUCCESS_COUNT 個"
echo "✅ 既に追加済み: $ALREADY_IN_PROJECT_COUNT 個"
if [ $ERROR_COUNT -gt 0 ]; then
    echo "❌ エラー: $ERROR_COUNT 個"
fi
echo ""

echo "────────────────────────────────────────────────────────────────"
echo "💡 確認"
echo "────────────────────────────────────────────────────────────────"
echo ""
echo "プロジェクトボードを確認してください："
echo ""
echo "  https://github.com/users/$OWNER/projects/1"
echo ""
echo "59個のIssueがBacklogカラムに追加されているはずです。"
echo ""
echo "════════════════════════════════════════════════════════════════"

