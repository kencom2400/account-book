#!/bin/bash

# 設定ファイルの読み込み
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/../config.sh" ]; then
  source "${SCRIPT_DIR}/../config.sh"
fi

# リポジトリ情報（設定ファイルから取得、未設定の場合はデフォルト値）
REPO_OWNER="${REPO_OWNER:-kencom2400}"
REPO_NAME="${REPO_NAME:-account-book}"
PROJECT_ID="${PROJECT_ID:-PVT_kwHOANWYrs4BIOm-}"
STATUS_FIELD_ID="${STATUS_FIELD_ID:-PVTSSF_lAHOANWYrs4BIOm-zg4wCDo}"

echo "🔄 全Issueのステータスを履歴から復元（ページネーション対応）"
echo "============================================================"
echo ""

# Epic issue numbers (skip these)
EPIC_ISSUES=(181 182 183 184 185 186 187 188 189 190 191 192 193 194 195 196)

# Get all issues with pagination
echo "📊 Issue一覧を取得中..."

ALL_ISSUES=""
HAS_NEXT_PAGE="true"
END_CURSOR="null"

while [ "$HAS_NEXT_PAGE" = "true" ]; do
  if [ "$END_CURSOR" = "null" ]; then
    response=$(gh api graphql -f query="query { repository(owner: \"$REPO_OWNER\", name: \"$REPO_NAME\") { issues(first: 100, states: [OPEN, CLOSED]) { pageInfo { hasNextPage endCursor } nodes { number } } } }")
  else
    response=$(gh api graphql -f query="query { repository(owner: \"$REPO_OWNER\", name: \"$REPO_NAME\") { issues(first: 100, states: [OPEN, CLOSED], after: \"$END_CURSOR\") { pageInfo { hasNextPage endCursor } nodes { number } } } }")
  fi
  
  page_issues=$(echo "$response" | jq -r '.data.repository.issues.nodes[].number')
  ALL_ISSUES="$ALL_ISSUES $page_issues"
  
  HAS_NEXT_PAGE=$(echo "$response" | jq -r '.data.repository.issues.pageInfo.hasNextPage')
  END_CURSOR=$(echo "$response" | jq -r '.data.repository.issues.pageInfo.endCursor')
  
  issue_count=$(echo "$page_issues" | wc -w | tr -d ' ')
  echo "  取得: $issue_count 件（合計: $(echo $ALL_ISSUES | wc -w | tr -d ' ') 件）"
done

restored=0
skipped=0
failed=0
no_history=0
not_in_project=0

echo ""
echo "🔧 ステータス復元中..."
echo ""

for issue_num in $ALL_ISSUES; do
  # Skip Epic issues
  skip=false
  for epic in "${EPIC_ISSUES[@]}"; do
    if [ "$issue_num" -eq "$epic" ] 2>/dev/null; then
      skip=true
      break
    fi
  done
  
  if $skip; then
    continue
  fi
  
  # Get last status from timeline
  response=$(gh api graphql -f query='
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          number
          timelineItems(last: 100) {
            nodes {
              __typename
              ... on ProjectV2ItemStatusChangedEvent {
                status
                createdAt
              }
            }
          }
        }
      }
    }
  ' -F owner="$REPO_OWNER" -F repo="$REPO_NAME" -F number="$issue_num" 2>/dev/null)
  
  # Extract last status
  last_status=$(echo "$response" | jq -r '[.data.repository.issue.timelineItems.nodes[] | select(.__typename == "ProjectV2ItemStatusChangedEvent")] | if length > 0 then .[-1].status else "" end')
  
  if [ -z "$last_status" ]; then
    echo "  ℹ️  #$issue_num: 履歴なし（スキップ）"
    ((no_history++))
    continue
  fi
  
  # Map status name to ID
  case "$last_status" in
    "🎯 Epic") status_id="9aa232cf" ;;
    "📋 Backlog") status_id="f908f688" ;;
    "📝 To Do") status_id="f36fcf60" ;;
    "🚧 In Progress") status_id="16defd77" ;;
    "👀 Review") status_id="0f0f2f26" ;;
    "✅ Done") status_id="2f722d70" ;;
    *) status_id="" ;;
  esac
  
  if [ -z "$status_id" ]; then
    echo "  ⚠️  #$issue_num: 不明なステータス '$last_status'（スキップ）"
    ((skipped++))
    continue
  fi
  
  # Get Issue Node ID
  issue_node_id=$(gh api graphql -f query="query { repository(owner: \"$REPO_OWNER\", name: \"$REPO_NAME\") { issue(number: $issue_num) { id } } }" 2>/dev/null | jq -r '.data.repository.issue.id')
  
  if [ -z "$issue_node_id" ] || [ "$issue_node_id" == "null" ]; then
    echo "  ⚠️  #$issue_num: Issue Node ID取得失敗"
    ((failed++))
    continue
  fi
  
  # Get Project Item ID
  project_item_id=$(gh api graphql -f query="query { node(id: \"$issue_node_id\") { ... on Issue { projectItems(first: 1) { nodes { id } } } } }" 2>/dev/null | jq -r '.data.node.projectItems.nodes[0].id')
  
  if [ -z "$project_item_id" ] || [ "$project_item_id" == "null" ]; then
    echo "  ℹ️  #$issue_num: プロジェクトに未登録"
    ((not_in_project++))
    continue
  fi
  
  # Update status
  gh api graphql -f query="mutation { updateProjectV2ItemFieldValue(input: { projectId: \"$PROJECT_ID\" itemId: \"$project_item_id\" fieldId: \"$STATUS_FIELD_ID\" value: { singleSelectOptionId: \"$status_id\" } }) { projectV2Item { id } } }" > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo "  ✅ #$issue_num → $last_status"
    ((restored++))
  else
    echo "  ❌ #$issue_num: 更新失敗"
    ((failed++))
  fi
done

echo ""
echo "✨ 復元完了！"
echo "============"
echo "  ✅ 復元成功: $restored件"
echo "  ℹ️  履歴なし: $no_history件"
echo "  ℹ️  未登録: $not_in_project件"
echo "  ⚠️  スキップ: $skipped件"
echo "  ❌ 失敗: $failed件"
echo ""
echo "🔍 確認:"
echo "  https://github.com/users/kencom2400/projects/1"

