#!/bin/bash

# GraphQL APIを使った統合的なIssue登録スクリプト
# 使用方法:
#   対話型: ./create-issue-graphql.sh
#   バッチ: ./create-issue-graphql.sh --title "タイトル" --body "本文" --labels "bug,testing" --priority "medium"

set -e

# 設定ファイルの読み込み
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/../workflow/config.sh" ]; then
  source "${SCRIPT_DIR}/../workflow/config.sh"
fi

# プロジェクト設定（環境変数で上書き可能、設定ファイルが優先）
OWNER="${OWNER:-${GH_OWNER:-kencom2400}}"
REPO="${REPO_NAME:-${GH_REPO:-account-book}}"
PROJECT_ID="${PROJECT_ID:-${GH_PROJECT_ID:-PVT_kwHOANWYrs4BIOm-}}"
STATUS_FIELD_ID="${STATUS_FIELD_ID:-${GH_STATUS_FIELD_ID:-PVTSSF_lAHOANWYrs4BIOm-zg4wCDo}}"

# 使用方法を表示
show_usage() {
    cat << EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GraphQL Issue作成スクリプト
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

使用方法:

  対話型モード:
    $0

  バッチモード:
    $0 --title "タイトル" --body "本文" [オプション]

オプション:
  --title TEXT           Issue タイトル（必須）
  --body TEXT            Issue 本文
  --body-file FILE       本文をファイルから読み込み
  --labels "l1,l2,..."   ラベル（カンマ区切り）
  --priority LEVEL       優先度: low/medium/high/critical
  --status STATUS        ステータス（デフォルト: 📝 To Do）
  --help                 このヘルプを表示

例:
  # 対話型
  $0

  # バッチモード（直接指定）
  $0 --title "[bug] E2Eテストエラー" \\
     --body "## 概要\\n\\nE2Eテストが失敗します" \\
     --labels "bug,testing" \\
     --priority "high"

  # ファイルから本文を読み込み
  $0 --title "[feature] 新機能" \\
     --body-file ./issue-content.md \\
     --labels "feature,backend" \\
     --priority "medium"

ステータス: 📝 To Do, 🚧 In Progress, ✅ Done, 📋 Backlog, 🎯 Epic, 👀 Review

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
}

# 引数解析
TITLE=""
BODY=""
LABELS=""
PRIORITY=""
STATUS="📝 To Do"

while [[ $# -gt 0 ]]; do
    case $1 in
        --title)
            TITLE="$2"
            shift 2
            ;;
        --body)
            BODY="$2"
            shift 2
            ;;
        --body-file)
            if [ ! -f "$2" ]; then
                echo "❌ エラー: ファイルが見つかりません: $2"
                exit 1
            fi
            BODY=$(cat "$2")
            shift 2
            ;;
        --labels)
            LABELS="$2"
            shift 2
            ;;
        --priority)
            PRIORITY="$2"
            shift 2
            ;;
        --status)
            STATUS="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo "❌ エラー: 不明なオプション: $1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
done

# 対話型モード
if [ -z "$TITLE" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  📝 対話型Issueスクリプト"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    read -p "タイトル: " TITLE
    
    if [ -z "$TITLE" ]; then
        echo "❌ エラー: タイトルは必須です"
        exit 1
    fi
    
    read -p "本文ファイルのパス (直接入力の場合は空Enter): " BODY_FILE
    
    if [ -n "$BODY_FILE" ]; then
        if [ ! -f "$BODY_FILE" ]; then
            echo "❌ エラー: ファイルが見つかりません: $BODY_FILE"
            exit 1
        fi
        BODY=$(cat "$BODY_FILE")
    else
        echo "本文を入力してください (Ctrl+D で終了):"
        BODY=$(cat)
    fi
    
    read -p "ラベル (カンマ区切り, 例: bug,testing): " LABELS
    read -p "優先度 (low/medium/high/critical, 空Enter=なし): " PRIORITY
    read -p "ステータス (デフォルト: 📝 To Do, 空Enter=デフォルト): " STATUS_INPUT
    
    if [ -n "$STATUS_INPUT" ]; then
        STATUS="$STATUS_INPUT"
    fi
    
    echo ""
fi

# 必須項目チェック
if [ -z "$TITLE" ]; then
    echo "❌ エラー: タイトルが指定されていません"
    echo ""
    show_usage
    exit 1
fi

if [ -z "$BODY" ]; then
    BODY="（本文未設定）"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Issue作成中..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "タイトル: $TITLE"
echo "ラベル: ${LABELS:-なし}"
echo "優先度: ${PRIORITY:-なし}"
echo "ステータス: $STATUS"
echo ""

# ラベルID配列を作成
LABEL_IDS=()

# リポジトリIDを取得
REPO_ID=$(gh api graphql -f query="
query {
  repository(owner: \"$OWNER\", name: \"$REPO\") {
    id
  }
}" | jq -r '.data.repository.id')

if [ -z "$REPO_ID" ] || [ "$REPO_ID" = "null" ]; then
    echo "❌ エラー: リポジトリIDの取得に失敗しました"
    exit 1
fi

# ラベル名からIDを取得（全ラベルを一度に取得して効率化）
if [ -n "$LABELS" ] || [ -n "$PRIORITY" ]; then
    echo "🔍 ラベルIDを取得中..."
    
    # 全ラベルを一度に取得
    ALL_LABELS_JSON=$(gh api graphql -f query='
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        labels(first: 100) {
          nodes {
            id
            name
          }
        }
      }
    }' -f owner="$OWNER" -f repo="$REPO" | jq '.data.repository.labels.nodes')

    if [ "$ALL_LABELS_JSON" = "null" ] || [ -z "$ALL_LABELS_JSON" ]; then
        echo "❌ エラー: ラベルの取得に失敗しました。リポジトリ名や権限を確認してください。"
        exit 1
    fi

    # 通常のラベルを処理
    if [ -n "$LABELS" ]; then
        IFS=',' read -ra LABEL_ARRAY <<< "$LABELS"
        for label in "${LABEL_ARRAY[@]}"; do
            label=$(echo "$label" | xargs)  # trim

            LABEL_ID=$(echo "$ALL_LABELS_JSON" | jq -r ".[] | select(.name == \"$label\") | .id")

            if [ -n "$LABEL_ID" ] && [ "$LABEL_ID" != "null" ]; then
                LABEL_IDS+=("\"$LABEL_ID\"")
                echo "  ✓ $label"
            else
                echo "  ⚠️  ラベルが見つかりません: $label"
            fi
        done
    fi

    # 優先度ラベルを追加
    if [ -n "$PRIORITY" ]; then
        PRIORITY_LABEL_NAME=""
        case "$PRIORITY" in
            low|medium|high|critical)
                PRIORITY_LABEL_NAME="priority: $PRIORITY"
                ;;
            *)
                echo "  ⚠️  不明な優先度: $PRIORITY"
                ;;
        esac

        if [ -n "$PRIORITY_LABEL_NAME" ]; then
            PRIORITY_LABEL_ID=$(echo "$ALL_LABELS_JSON" | jq -r ".[] | select(.name == \"$PRIORITY_LABEL_NAME\") | .id")

            if [ -n "$PRIORITY_LABEL_ID" ] && [ "$PRIORITY_LABEL_ID" != "null" ]; then
                LABEL_IDS+=("\"$PRIORITY_LABEL_ID\"")
                echo "  ✓ priority: $PRIORITY"
            else
                echo "  ⚠️  優先度ラベルが見つかりません: $PRIORITY_LABEL_NAME"
            fi
        fi
    fi
fi

# ラベルID配列を作成（JSON形式）
if [ ${#LABEL_IDS[@]} -gt 0 ]; then
    LABEL_IDS_JSON="[$(IFS=,; echo "${LABEL_IDS[*]}")]"
else
    LABEL_IDS_JSON="[]"
fi

echo ""
echo "🔄 GraphQL APIでIssueを作成中..."

# GraphQL mutation: Issue作成
# bodyのJSONエスケープ処理
BODY_ESCAPED=$(echo "$BODY" | jq -Rs .)

ISSUE_RESPONSE=$(gh api graphql -f query="
mutation {
  createIssue(input: {
    repositoryId: \"$REPO_ID\"
    title: \"$TITLE\"
    body: $BODY_ESCAPED
    labelIds: $LABEL_IDS_JSON
  }) {
    issue {
      id
      number
      url
    }
  }
}")

ISSUE_ID=$(echo "$ISSUE_RESPONSE" | jq -r '.data.createIssue.issue.id')
ISSUE_NUMBER=$(echo "$ISSUE_RESPONSE" | jq -r '.data.createIssue.issue.number')
ISSUE_URL=$(echo "$ISSUE_RESPONSE" | jq -r '.data.createIssue.issue.url')

if [ -z "$ISSUE_ID" ] || [ "$ISSUE_ID" = "null" ]; then
    echo "❌ エラー: Issue作成に失敗しました"
    echo ""
    echo "レスポンス:"
    echo "$ISSUE_RESPONSE" | jq .
    exit 1
fi

echo "✅ Issue #$ISSUE_NUMBER を作成しました"
echo ""

# プロジェクトに追加
echo "🔄 プロジェクトに追加中..."

ITEM_RESPONSE=$(gh api graphql -f query="
mutation {
  addProjectV2ItemById(input: {
    projectId: \"$PROJECT_ID\"
    contentId: \"$ISSUE_ID\"
  }) {
    item {
      id
    }
  }
}")

ITEM_ID=$(echo "$ITEM_RESPONSE" | jq -r '.data.addProjectV2ItemById.item.id')

if [ -z "$ITEM_ID" ] || [ "$ITEM_ID" = "null" ]; then
    echo "⚠️  プロジェクトへの追加に失敗しました"
    echo ""
    echo "レスポンス:"
    echo "$ITEM_RESPONSE" | jq .
else
    echo "✅ プロジェクトに追加しました"
    echo ""
    
    # ステータス設定
    echo "🔄 ステータスを '$STATUS' に設定中..."
    
    # ステータスオプションを動的に取得
    STATUS_OPTIONS_JSON=$(gh api graphql -f query='
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }' -f projectId="$PROJECT_ID" | jq ".data.node.fields.nodes[] | select(.id == \"$STATUS_FIELD_ID\") | .options")

    if [ "$STATUS_OPTIONS_JSON" = "null" ] || [ -z "$STATUS_OPTIONS_JSON" ]; then
        echo "❌ エラー: ステータスオプションの取得に失敗しました"
        exit 1
    fi

    STATUS_OPTION_ID=$(echo "$STATUS_OPTIONS_JSON" | jq -r ".[] | select(.name == \"$STATUS\") | .id")
    
    if [ -z "$STATUS_OPTION_ID" ] || [ "$STATUS_OPTION_ID" = "null" ]; then
        echo "⚠️  不明なステータス: $STATUS"
        echo "   デフォルト（📝 To Do）を使用します"
        STATUS="📝 To Do"
        STATUS_OPTION_ID=$(echo "$STATUS_OPTIONS_JSON" | jq -r '.[] | select(.name == "📝 To Do") | .id')
        
        if [ -z "$STATUS_OPTION_ID" ] || [ "$STATUS_OPTION_ID" = "null" ]; then
            echo "⚠️  デフォルトステータス '📝 To Do' のID取得に失敗しました。ステータスは設定されません。"
        fi
    fi
    
    if [ -n "$STATUS_OPTION_ID" ] && [ "$STATUS_OPTION_ID" != "null" ]; then
        STATUS_UPDATE_RESPONSE=$(gh api graphql -f query="
        mutation {
          updateProjectV2ItemFieldValue(
            input: {
              projectId: \"$PROJECT_ID\"
              itemId: \"$ITEM_ID\"
              fieldId: \"$STATUS_FIELD_ID\"
              value: {singleSelectOptionId: \"$STATUS_OPTION_ID\"}
            }
          ) {
            projectV2Item {
              id
            }
          }
        }")
        
        STATUS_UPDATE_RESULT=$(echo "$STATUS_UPDATE_RESPONSE" | jq -r '.data.updateProjectV2ItemFieldValue.projectV2Item.id')
        
        if [ -n "$STATUS_UPDATE_RESULT" ] && [ "$STATUS_UPDATE_RESULT" != "null" ]; then
            echo "✅ ステータスを '$STATUS' に設定しました"
        else
            echo "⚠️  ステータス設定に失敗しました"
            echo ""
            echo "レスポンス:"
            echo "$STATUS_UPDATE_RESPONSE" | jq .
        fi
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Issue作成完了"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Issue番号: #$ISSUE_NUMBER"
echo "タイトル: $TITLE"
echo "ステータス: $STATUS"
echo "URL: $ISSUE_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

