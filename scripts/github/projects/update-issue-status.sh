#!/bin/bash

# GitHub ProjectsでIssueのステータスを任意の値に変更する汎用スクリプト

set -e

# 使い方
if [ $# -ne 2 ]; then
  echo "使い方: $0 <issue番号> <ステータス>"
  echo "例: $0 24 '🚧 In Progress'"
  echo "例: $0 24 '✅ Done'"
  echo "例: $0 24 '📝 To Do'"
  echo ""
  echo "利用可能なステータス:"
  echo "  - 📝 To Do"
  echo "  - 🚧 In Progress"
  echo "  - ✅ Done"
  echo "  - 📦 Backlog"
  exit 1
fi

ISSUE_NUMBER=$1
STATUS=$2
PROJECT_NUMBER="${PROJECT_NUMBER:-1}"
OWNER="${OWNER:-kencom2400}"

echo "🔍 Issue #${ISSUE_NUMBER} の情報を取得中..."

# プロジェクトIDを取得（プロジェクト番号でフィルタリング）
PROJECT_ID=$(gh project list --owner "$OWNER" --format json | \
  jq -r --argjson pnum "$PROJECT_NUMBER" '.projects[] | select(.number == $pnum) | .id')

if [ -z "$PROJECT_ID" ]; then
  echo "❌ エラー: プロジェクト番号 ${PROJECT_NUMBER} が見つかりませんでした"
  exit 1
fi

echo "   プロジェクトID: $PROJECT_ID"

# アイテムIDとステータスを取得
ITEM_INFO=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --limit 200 | \
  jq --arg num "$ISSUE_NUMBER" '.items[] | select(.content.number == ($num | tonumber)) | {id: .id, title: .title, status: .status}')

if [ -z "$ITEM_INFO" ]; then
  echo "❌ エラー: Issue #${ISSUE_NUMBER} がプロジェクトに見つかりませんでした"
  exit 1
fi

ITEM_ID=$(echo "$ITEM_INFO" | jq -r '.id')
CURRENT_STATUS=$(echo "$ITEM_INFO" | jq -r '.status')
TITLE=$(echo "$ITEM_INFO" | jq -r '.title')

echo "   アイテムID: $ITEM_ID"
echo "   タイトル: $TITLE"
echo "   現在のステータス: $CURRENT_STATUS"

# すでに指定されたステータスの場合はスキップ
if [ "$CURRENT_STATUS" = "$STATUS" ]; then
  echo "✅ すでに '${STATUS}' ステータスです"
  exit 0
fi

# StatusフィールドのIDとオプションIDを取得
echo ""
echo "📝 ステータスフィールド情報を取得中..."
FIELD_INFO=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | \
  jq '.fields[] | select(.name == "Status")')

FIELD_ID=$(echo "$FIELD_INFO" | jq -r '.id')
STATUS_OPTION_ID=$(echo "$FIELD_INFO" | jq -r --arg status "$STATUS" '.options[] | select(.name == $status) | .id')

if [ -z "$STATUS_OPTION_ID" ]; then
  echo "❌ エラー: ステータス '${STATUS}' が見つかりませんでした"
  echo ""
  echo "利用可能なステータス:"
  echo "$FIELD_INFO" | jq -r '.options[] | "  - \(.name)"'
  exit 1
fi

echo "   フィールドID: $FIELD_ID"
echo "   ステータスオプションID: $STATUS_OPTION_ID"

# ステータスを変更
echo ""
echo "🔄 ステータスを '${STATUS}' に変更中..."
gh project item-edit \
  --project-id "$PROJECT_ID" \
  --id "$ITEM_ID" \
  --field-id "$FIELD_ID" \
  --single-select-option-id "$STATUS_OPTION_ID"

echo ""
echo "✅ Issue #${ISSUE_NUMBER} のステータスを '${STATUS}' に変更しました！"
echo ""
echo "確認: https://github.com/${OWNER}/account-book/issues/${ISSUE_NUMBER}"

