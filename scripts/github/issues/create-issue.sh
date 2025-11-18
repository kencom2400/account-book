#!/bin/bash

# 汎用Issue作成スクリプト
# 使用方法: ./create-issue.sh <data-file>

set -e

# 使用方法を表示
show_usage() {
    echo "使用方法: $0 <data-file>"
    echo ""
    echo "例:"
    echo "  $0 issue-data/mysql-migration.yml"
    echo "  $0 issue-data/drafts/my-feature-draft.json"
    echo ""
    echo "対応形式: .yml, .yaml, .json"
}

# 引数チェック
if [ $# -eq 0 ]; then
    echo "❌ エラー: データファイルを指定してください"
    echo ""
    show_usage
    exit 1
fi

DATA_FILE=$1

# ファイル存在チェック
if [ ! -f "$DATA_FILE" ]; then
    echo "❌ エラー: ファイルが見つかりません: $DATA_FILE"
    exit 1
fi

echo "════════════════════════════════════════════════════════════════"
echo "   📋 Issue作成"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "データファイル: $DATA_FILE"
echo ""

# ファイル拡張子を取得
EXT="${DATA_FILE##*.}"

# ファイル形式に応じてデータを読み込み
case "$EXT" in
    yml|yaml)
        # yqコマンドの確認
        if ! command -v yq &> /dev/null; then
            echo "❌ エラー: yqコマンドが見つかりません"
            echo ""
            echo "インストール方法:"
            echo "  macOS: brew install yq"
            echo "  Linux: snap install yq"
            echo ""
            echo "または、JSONファイルを使用してください（yqなしで動作）"
            exit 1
        fi
        
        # YAMLファイルからデータを読み込み
        TITLE=$(yq eval '.title' "$DATA_FILE")
        LABELS=$(yq eval '.labels | join(",")' "$DATA_FILE")
        BODY=$(yq eval '.body' "$DATA_FILE")
        ;;
    json)
        # jqコマンドの確認
        if ! command -v jq &> /dev/null; then
            echo "❌ エラー: jqコマンドが見つかりません"
            echo ""
            echo "jqは通常プリインストールされていますが、必要に応じて:"
            echo "  macOS: brew install jq"
            echo "  Linux: apt-get install jq"
            exit 1
        fi
        
        # JSONファイルからデータを読み込み
        TITLE=$(jq -r '.title' "$DATA_FILE")
        LABELS=$(jq -r '.labels | join(",")' "$DATA_FILE")
        BODY=$(jq -r '.body' "$DATA_FILE")
        ;;
    *)
        echo "❌ エラー: サポートされていないファイル形式: .$EXT"
        echo ""
        echo "対応形式: .yml, .yaml, .json"
        exit 1
        ;;
esac

# データの検証
if [ -z "$TITLE" ] || [ "$TITLE" = "null" ]; then
    echo "❌ エラー: titleが設定されていません"
    exit 1
fi

if [ -z "$BODY" ] || [ "$BODY" = "null" ]; then
    echo "❌ エラー: bodyが設定されていません"
    exit 1
fi

# Issueを作成
echo "📝 Issue作成中..."
echo "   タイトル: $TITLE"
echo "   ラベル: $LABELS"
echo ""

if [ -n "$LABELS" ] && [ "$LABELS" != "null" ]; then
    gh issue create \
      --title "$TITLE" \
      --label "$LABELS" \
      --body "$BODY"
else
    gh issue create \
      --title "$TITLE" \
      --body "$BODY"
fi

if [ $? -eq 0 ]; then
    ISSUE_NUM=$(gh issue list --limit 1 --json number --jq '.[0].number')
    echo ""
    echo "✅ Issue #${ISSUE_NUM} 作成成功"
    echo ""
    
    # Projectに追加
    echo "📊 プロジェクトボードに追加中..."
    gh project item-add 1 --owner kencom2400 --url "https://github.com/kencom2400/account-book/issues/${ISSUE_NUM}" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ プロジェクトボードに追加完了"
    else
        echo "⚠️  プロジェクトボードへの追加に失敗しました"
        echo "   手動で追加してください: https://github.com/kencom2400/account-book/issues/${ISSUE_NUM}"
    fi
    
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "   ✅ 完了"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "Issue URL: https://github.com/kencom2400/account-book/issues/${ISSUE_NUM}"
else
    echo ""
    echo "❌ Issue作成に失敗しました"
    exit 1
fi

