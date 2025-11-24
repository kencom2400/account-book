#!/bin/bash

# カバレッジ履歴更新スクリプト
# 現在のカバレッジデータを履歴に追加します

set -e

echo "================================"
echo "カバレッジ履歴更新開始"
echo "================================"

# プロジェクトルートに移動
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# 出力先ファイル
HISTORY_FILE="$PROJECT_ROOT/docs/testing/coverage-history.md"

# 履歴ファイルが存在しない場合は、まずカバレッジレポートを生成
if [ ! -f "$HISTORY_FILE" ]; then
  echo "📝 カバレッジ履歴ファイルが存在しません。カバレッジレポートを生成します..."
  ./scripts/test/generate-coverage-report.sh
  exit 0
fi

# 環境をアクティベート
if [ -f ".nodeenv/bin/activate" ]; then
  source .nodeenv/bin/activate
else
  echo "⚠ .nodeenv が見つかりません。setup.sh を先に実行してください。"
  exit 1
fi

# 現在の日時とコミットハッシュを取得
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# カバレッジデータを一時的に保存する関数
extract_coverage_data() {
  local coverage_file=$1
  
  if [ ! -f "$coverage_file" ]; then
    echo "0|0|0|0"
    return
  fi
  
  local lines=$(jq -r '.total.lines.pct // 0' "$coverage_file" 2>/dev/null || echo "0")
  local statements=$(jq -r '.total.statements.pct // 0' "$coverage_file" 2>/dev/null || echo "0")
  local functions=$(jq -r '.total.functions.pct // 0' "$coverage_file" 2>/dev/null || echo "0")
  local branches=$(jq -r '.total.branches.pct // 0' "$coverage_file" 2>/dev/null || echo "0")
  
  # 小数点以下2桁に丸める
  lines=$(printf "%.2f" "$lines" 2>/dev/null || echo "0.00")
  statements=$(printf "%.2f" "$statements" 2>/dev/null || echo "0.00")
  functions=$(printf "%.2f" "$functions" 2>/dev/null || echo "0.00")
  branches=$(printf "%.2f" "$branches" 2>/dev/null || echo "0.00")
  
  echo "$lines|$statements|$functions|$branches"
}

# 既存のカバレッジデータから読み取る（再実行を避ける）
echo "📊 既存のカバレッジデータを読み取り中..."

BACKEND_UNIT_DATA=$(extract_coverage_data "$PROJECT_ROOT/apps/backend/coverage/coverage-summary.json")
BACKEND_E2E_DATA=$(extract_coverage_data "$PROJECT_ROOT/apps/backend/coverage-e2e/coverage-summary.json")
FRONTEND_UNIT_DATA=$(extract_coverage_data "$PROJECT_ROOT/apps/frontend/coverage/coverage-summary.json")

# データを配列に分割
IFS='|' read -r BACKEND_UNIT_LINES BACKEND_UNIT_STMTS BACKEND_UNIT_FUNCS BACKEND_UNIT_BRANCHES <<< "$BACKEND_UNIT_DATA"
IFS='|' read -r BACKEND_E2E_LINES BACKEND_E2E_STMTS BACKEND_E2E_FUNCS BACKEND_E2E_BRANCHES <<< "$BACKEND_E2E_DATA"
IFS='|' read -r FRONTEND_UNIT_LINES FRONTEND_UNIT_STMTS FRONTEND_UNIT_FUNCS FRONTEND_UNIT_BRANCHES <<< "$FRONTEND_UNIT_DATA"

# カバレッジデータがすべて0の場合は警告
if [ "$BACKEND_UNIT_LINES" = "0" ] && [ "$BACKEND_E2E_LINES" = "0" ] && [ "$FRONTEND_UNIT_LINES" = "0" ]; then
  echo "⚠ カバレッジデータが見つかりません。先にカバレッジレポートを生成してください:"
  echo "  ./scripts/test/generate-coverage-report.sh"
  exit 1
fi

# 新しいエントリ
NEW_ENTRY="| $TIMESTAMP | \`$COMMIT_HASH\` | Lines: ${BACKEND_UNIT_LINES}%, Stmts: ${BACKEND_UNIT_STMTS}%, Funcs: ${BACKEND_UNIT_FUNCS}%, Branches: ${BACKEND_UNIT_BRANCHES}% | Lines: ${BACKEND_E2E_LINES}%, Stmts: ${BACKEND_E2E_STMTS}%, Funcs: ${BACKEND_E2E_FUNCS}%, Branches: ${BACKEND_E2E_BRANCHES}% | Lines: ${FRONTEND_UNIT_LINES}%, Stmts: ${FRONTEND_UNIT_STMTS}%, Funcs: ${FRONTEND_UNIT_FUNCS}%, Branches: ${FRONTEND_UNIT_BRANCHES}% |"

# 一時ファイル
TEMP_FILE=$(mktemp)

# 履歴ファイルを読み込み、新しいエントリを追加
awk -v new_entry="$NEW_ENTRY" '
  /^\| 日時 \|/ { 
    print $0
    getline
    print $0
    print new_entry
    next
  }
  { print $0 }
' "$HISTORY_FILE" > "$TEMP_FILE"

# 元のファイルを上書き
mv "$TEMP_FILE" "$HISTORY_FILE"

echo ""
echo "✅ カバレッジ履歴を更新しました"
echo ""
echo "📊 追加されたエントリ:"
echo "$NEW_ENTRY"
echo ""
echo "📝 履歴ファイル: $HISTORY_FILE"

