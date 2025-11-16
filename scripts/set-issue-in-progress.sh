#!/bin/bash

# GitHub ProjectsでIssueのステータスを"In Progress"に変更するスクリプト

set -e

# 使い方
if [ $# -ne 1 ]; then
  echo "使い方: $0 <issue番号>"
  echo "例: $0 24"
  exit 1
fi

ISSUE_NUMBER=$1
PROJECT_NUMBER=1
OWNER="kencom2400"

echo "🔍 Issue #${ISSUE_NUMBER} の情報を取得中..."

# プロジェクトIDを取得
PROJECT_ID=$(gh project list --owner "$OWNER" --format json | jq -r '.[0].id')
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

# すでにIn Progressの場合はスキップ
if [ "$CURRENT_STATUS" = "🚧 In Progress" ]; then
  echo "✅ すでに In Progress ステータスです"
  exit 0
fi

# StatusフィールドのIDとオプションIDを取得
echo ""
echo "📝 ステータスフィールド情報を取得中..."
FIELD_INFO=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | \
  jq '.fields[] | select(.name == "Status")')

FIELD_ID=$(echo "$FIELD_INFO" | jq -r '.id')
IN_PROGRESS_OPTION_ID=$(echo "$FIELD_INFO" | jq -r '.options[] | select(.name == "🚧 In Progress") | .id')

echo "   フィールドID: $FIELD_ID"
echo "   In Progress オプションID: $IN_PROGRESS_OPTION_ID"

# ステータスを変更
echo ""
echo "🔄 ステータスを 'In Progress' に変更中..."
gh project item-edit \
  --project-id "$PROJECT_ID" \
  --id "$ITEM_ID" \
  --field-id "$FIELD_ID" \
  --single-select-option-id "$IN_PROGRESS_OPTION_ID"

echo ""
echo "✅ Issue #${ISSUE_NUMBER} のステータスを 'In Progress' に変更しました！"
echo ""
echo "確認: https://github.com/${OWNER}/account-book/issues/${ISSUE_NUMBER}"

